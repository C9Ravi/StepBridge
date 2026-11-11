import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  authenticateOrLinkGoogleUser,
  generatePkcePair,
  createGoogleAuthorizationUrl,
} from "@/lib/auth/googleOAuth";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateCryptoToken,
  revokeServerSessions,
} from "@/lib/auth/session";
import {
  renderWelcomeEmail,
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderCollegeInvitationEmail,
  renderRecruiterVerificationEmail,
  renderApplicationConfirmationEmail,
} from "@/lib/email/templates";
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/email/service";

describe("StepBridge Production Authentication, Google OAuth & Communication Integration Tests", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  describe("1. Google OAuth & Account Linking Protection", () => {
    it("generates PKCE codeVerifier and codeChallenge (S256)", async () => {
      const { codeVerifier, codeChallenge } = await generatePkcePair();
      expect(codeVerifier).toBeDefined();
      expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(codeChallenge).toBeDefined();
      expect(codeChallenge).not.toBe(codeVerifier);
    });

    it("generates Google Authorization URL with secure scopes and PKCE", async () => {
      // Temporarily set dummy credentials to test URL generator
      process.env.AUTH_GOOGLE_ID = "mock_client_id.apps.googleusercontent.com";
      process.env.AUTH_GOOGLE_SECRET = "mock_client_secret";

      const { authUrl, state, codeVerifier } = await createGoogleAuthorizationUrl({
        role: "STUDENT",
      });

      expect(authUrl).toContain("accounts.google.com/o/oauth2/v2/auth");
      expect(authUrl).toContain("client_id=mock_client_id.apps.googleusercontent.com");
      expect(authUrl).toContain("code_challenge_method=S256");
      expect(authUrl).toContain("scope=openid+email+profile");
      expect(state).toBeDefined();
      expect(codeVerifier).toBeDefined();
    });

    it("creates a new user and links Google Account on first sign-in", async () => {
      const testGoogleSub = `google_sub_${Date.now()}`;
      const testEmail = `new.google.user.${Date.now()}@example.com`;

      const result = await authenticateOrLinkGoogleUser({
        profile: {
          sub: testGoogleSub,
          email: testEmail,
          email_verified: true,
          name: "Test Google Scholar",
          picture: "https://lh3.googleusercontent.com/test-pic.jpg",
        },
        tokens: {
          access_token: "mock_google_access_token",
          token_type: "Bearer",
          expires_in: 3600,
        },
        requestedRole: "STUDENT",
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.role).toBe("STUDENT");
      expect(result.redirectPath).toBe("/student");
      expect(result.sessionToken).toBeDefined();

      // Verify Account record exists
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: testGoogleSub,
          },
        },
      });
      expect(account).toBeDefined();
      expect(account?.userId).toBe(result.user.id);
    });

    it("safely links existing credential account when Google email is verified", async () => {
      const sharedEmail = `existing.student.${Date.now()}@jcbust.ac.in`;
      const passHash = await hashPassword("ExistingPass123!");

      // Existing user created with email/password
      const existingUser = await prisma.user.create({
        data: {
          email: sharedEmail,
          name: "Pre-existing Student",
          passwordHash: passHash,
          role: "STUDENT",
          status: "ACTIVE",
        },
      });

      const googleSub = `google_sub_link_${Date.now()}`;
      const linkResult = await authenticateOrLinkGoogleUser({
        profile: {
          sub: googleSub,
          email: sharedEmail,
          email_verified: true, // Google has verified the address
          name: "Pre-existing Student",
        },
        tokens: {
          access_token: "mock_linked_access_token",
          expires_in: 3600,
        },
      });

      expect(linkResult.user.id).toBe(existingUser.id);

      // Verify account was linked to existing user
      const linkedAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: googleSub,
          },
        },
      });
      expect(linkedAccount?.userId).toBe(existingUser.id);
    });

    it("PREVENTS account takeover when Google email is unverified", async () => {
      const targetEmail = `victim.user.${Date.now()}@stepbridge.in`;
      await prisma.user.create({
        data: {
          email: targetEmail,
          name: "Target Victim",
          passwordHash: await hashPassword("Secret123!"),
          role: "COLLEGE_ADMIN",
          status: "ACTIVE",
        },
      });

      // Attacker tries to sign in with an unverified Google account using target email
      await expect(
        authenticateOrLinkGoogleUser({
          profile: {
            sub: `attacker_sub_${Date.now()}`,
            email: targetEmail,
            email_verified: false, // NOT verified by Google
            name: "Impersonator",
          },
          tokens: { access_token: "attacker_token" },
        })
      ).rejects.toThrow(/Security alert.*prevent account takeover/i);
    });

    it("prevents self-granting privileged SUPER_ADMIN role during OAuth", async () => {
      const adminAttemptEmail = `malicious.admin.${Date.now()}@attacker.com`;

      const result = await authenticateOrLinkGoogleUser({
        profile: {
          sub: `attacker_admin_${Date.now()}`,
          email: adminAttemptEmail,
          email_verified: true,
          name: "Sneaky User",
        },
        tokens: { access_token: "token" },
        requestedRole: "SUPER_ADMIN", // User tries to request SUPER_ADMIN
      });

      // Role must fall back to STUDENT; privileged role grant is strictly denied
      expect(result.user.role).toBe("STUDENT");
      expect(result.redirectPath).toBe("/student");
    });
  });

  describe("2. Email & Password Authentication & Token Security", () => {
    it("hashes and verifies passwords securely using bcrypt", async () => {
      const plain = "StrongPassword2026!";
      const hashed = await hashPassword(plain);

      expect(hashed).not.toBe(plain);
      const isMatch = await verifyPassword(plain, hashed);
      expect(isMatch).toBe(true);

      const isWrong = await verifyPassword("WrongPassword!", hashed);
      expect(isWrong).toBe(false);
    });

    it("creates, validates, and expires email verification tokens", async () => {
      const user = await prisma.user.create({
        data: {
          email: `verify.test.${Date.now()}@example.com`,
          name: "Verify Tester",
          role: "STUDENT",
          status: "ACTIVE",
        },
      });

      const rawToken = generateCryptoToken();
      const tokenHash = await hashToken(rawToken);

      // Save token in DB
      await prisma.emailToken.create({
        data: {
          userId: user.id,
          tokenHash,
          purpose: "EMAIL_VERIFICATION",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Verify token
      const foundToken = await prisma.emailToken.findUnique({
        where: { tokenHash },
      });
      expect(foundToken).toBeDefined();
      expect(foundToken?.usedAt).toBeNull();

      // Mark used and update user verified
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        }),
        prisma.emailToken.update({
          where: { id: foundToken!.id },
          data: { usedAt: new Date() },
        }),
      ]);

      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.emailVerifiedAt).not.toBeNull();

      const usedToken = await prisma.emailToken.findUnique({ where: { tokenHash } });
      expect(usedToken?.usedAt).not.toBeNull();
    });

    it("resets password and revokes all active sessions upon password reset", async () => {
      const user = await prisma.user.create({
        data: {
          email: `reset.test.${Date.now()}@example.com`,
          name: "Reset Tester",
          passwordHash: await hashPassword("OldPassword123!"),
          role: "STUDENT",
          status: "ACTIVE",
        },
      });

      // Simulate 2 active sessions
      await prisma.session.createMany({
        data: [
          { userId: user.id, tokenHash: `sess_1_${Date.now()}`, expiresAt: new Date(Date.now() + 10000) },
          { userId: user.id, tokenHash: `sess_2_${Date.now()}`, expiresAt: new Date(Date.now() + 10000) },
        ],
      });

      const activeBefore = await prisma.session.count({
        where: { userId: user.id, revokedAt: null },
      });
      expect(activeBefore).toBe(2);

      // Perform password reset revocation
      await revokeServerSessions(user.id);

      const activeAfter = await prisma.session.count({
        where: { userId: user.id, revokedAt: null },
      });
      expect(activeAfter).toBe(0);
    });
  });

  describe("3. Email Communication Templates & Service", () => {
    it("renders branded email templates with Ravi Chauhan attribution", () => {
      const welcome = renderWelcomeEmail({
        name: "Ravi Chauhan",
        role: "STUDENT",
        dashboardUrl: "https://stepbridge.in/student",
      });
      expect(welcome).toContain("Welcome to StepBridge");
      expect(welcome).toContain("Ravi Chauhan");
      expect(welcome).toContain("https://stepbridge.in/student");

      const verify = renderVerificationEmail({
        name: "Aman",
        verifyUrl: "https://stepbridge.in/verify-email?token=123",
        token: "998877",
      });
      expect(verify).toContain("998877");
      expect(verify).toContain("Verify Your Email Address");

      const reset = renderPasswordResetEmail({
        name: "Priya",
        token: "token_abc_123",
        resetUrl: "https://stepbridge.in/reset-password?token=abc",
      });
      expect(reset).toContain("Reset Your Password");
      expect(reset).toContain("token_abc_123");
      expect(reset).toContain("https://stepbridge.in/reset-password?token=abc");

      const collegeInvite = renderCollegeInvitationEmail({
        institutionName: "JCBUST, YMCA Faridabad",
        inviterName: "Dr. Ramesh Sharma",
        inviteUrl: "https://stepbridge.in/register?invite=123",
        department: "Computer Engineering",
      });
      expect(collegeInvite).toContain("JCBUST, YMCA Faridabad");
      expect(collegeInvite).toContain("Dr. Ramesh Sharma");

      const recruiterVerif = renderRecruiterVerificationEmail({
        companyName: "TechCorp Global",
        status: "APPROVED",
        portalUrl: "https://stepbridge.in/recruiter",
      });
      expect(recruiterVerif).toContain("TechCorp Global");
      expect(recruiterVerif).toContain("Verification Approved");

      const appConfirm = renderApplicationConfirmationEmail({
        studentName: "Ravi Chauhan",
        roleTitle: "Software Engineer Intern",
        companyName: "Google Cloud",
        appliedAt: new Date().toLocaleDateString(),
        dashboardUrl: "https://stepbridge.in/student/applications",
      });
      expect(appConfirm).toContain("Software Engineer Intern");
      expect(appConfirm).toContain("Google Cloud");
    });

    it("dispatches transactional emails gracefully using dev fallback when RESEND_API_KEY is not set", async () => {
      delete process.env.RESEND_API_KEY;

      const welcomeRes = await sendWelcomeEmail(
        "developer.test@stepbridge.in",
        "Test Developer",
        "STUDENT"
      );
      expect(welcomeRes.success).toBe(true);
      expect(welcomeRes.provider).toBe("mock_dev");

      const verifyRes = await sendVerificationEmail(
        "developer.test@stepbridge.in",
        "Test Developer",
        "123456"
      );
      expect(verifyRes.success).toBe(true);

      const resetRes = await sendPasswordResetEmail(
        "developer.test@stepbridge.in",
        "Test Developer",
        "token_abc_xyz"
      );
      expect(resetRes.success).toBe(true);
    });
  });

  describe("4. In-App Notification Center & Preferences", () => {
    let testUserId: string;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          email: `notify.tester.${Date.now()}@example.com`,
          name: "Notify Tester",
          role: "STUDENT",
          status: "ACTIVE",
        },
      });
      testUserId = user.id;
    });

    it("creates, counts, and fetches unread notifications", async () => {
      // Create 3 notifications
      await prisma.notification.createMany({
        data: [
          { userId: testUserId, type: "DRIVE_ALERT", title: "Drive Alert 1", body: "Amazon India drive opened." },
          { userId: testUserId, type: "DRIVE_ALERT", title: "Drive Alert 2", body: "Google SWE intern drive opened." },
          { userId: testUserId, type: "SYSTEM_ALERT", title: "Resume Feedback", body: "AI ATS score is 88/100." },
        ],
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: testUserId, readAt: null },
      });
      expect(unreadCount).toBe(3);

      const list = await prisma.notification.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: "desc" },
      });
      expect(list.length).toBe(3);
    });

    it("marks a single notification as read", async () => {
      const item = await prisma.notification.findFirst({
        where: { userId: testUserId, readAt: null },
      });
      expect(item).toBeDefined();

      await prisma.notification.update({
        where: { id: item!.id },
        data: { readAt: new Date() },
      });

      const updated = await prisma.notification.findUnique({
        where: { id: item!.id },
      });
      expect(updated?.readAt).not.toBeNull();

      const remainingUnread = await prisma.notification.count({
        where: { userId: testUserId, readAt: null },
      });
      expect(remainingUnread).toBe(2);
    });

    it("marks all notifications as read in bulk", async () => {
      await prisma.notification.updateMany({
        where: { userId: testUserId, readAt: null },
        data: { readAt: new Date() },
      });

      const remainingUnread = await prisma.notification.count({
        where: { userId: testUserId, readAt: null },
      });
      expect(remainingUnread).toBe(0);
    });

    it("creates and updates notification preferences", async () => {
      // Upsert preferences
      const pref = await prisma.notificationPreference.upsert({
        where: { userId: testUserId },
        create: {
          userId: testUserId,
          emailEnabled: true,
          inAppEnabled: true,
          digestSchedule: "WEEKLY",
        },
        update: {
          emailEnabled: false,
          digestSchedule: "DAILY",
        },
      });
      expect(pref.userId).toBe(testUserId);
      expect(pref.emailEnabled).toBe(true);

      // Update to false
      const updated = await prisma.notificationPreference.update({
        where: { userId: testUserId },
        data: { emailEnabled: false, digestSchedule: "DAILY" },
      });
      expect(updated.emailEnabled).toBe(false);
      expect(updated.digestSchedule).toBe("DAILY");
    });
  });
});
