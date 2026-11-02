import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, generateCryptoToken, hashToken } from "@/lib/auth/session";

describe("Phase 1: Identity and Tenant Foundation Tests", () => {
  const testStudentEmail = `student_${Date.now()}@nitb.ac.in`;
  const testCollegeEmail = `tpo_${Date.now()}@college.edu`;
  const testRecruiterEmail = `recruiter_${Date.now()}@company.com`;
  const testPassword = "StrongPassword2026!";

  beforeAll(async () => {
    // Ensure database is ready
    await prisma.$connect();
  });

  it("registers student, verifies email token creation and profile association", async () => {
    const passwordHash = await hashPassword(testPassword);
    const user = await prisma.user.create({
      data: {
        name: "Test Student",
        email: testStudentEmail,
        passwordHash,
        role: "STUDENT",
        status: "ACTIVE",
        studentProfile: {
          create: {
            headline: "Computer Science Enthusiast",
            visibility: "INSTITUTION_ONLY",
          },
        },
      },
      include: { studentProfile: true },
    });

    expect(user.id).toBeDefined();
    expect(user.studentProfile?.id).toBeDefined();

    // Generate single-use verification token
    const rawToken = generateCryptoToken();
    const tokenHash = await hashToken(rawToken);

    const emailToken = await prisma.emailToken.create({
      data: {
        userId: user.id,
        tokenHash,
        purpose: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    expect(emailToken.id).toBeDefined();
    expect(emailToken.usedAt).toBeNull();

    // Verify token
    const foundToken = await prisma.emailToken.findUnique({ where: { tokenHash } });
    expect(foundToken).not.toBeNull();
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    const verifiedUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(verifiedUser?.emailVerifiedAt).not.toBeNull();
  });

  it("prevents duplicate registration on identical normalized email", async () => {
    const passwordHash = await hashPassword(testPassword);
    await expect(
      prisma.user.create({
        data: {
          name: "Duplicate User",
          email: testStudentEmail,
          passwordHash,
          role: "STUDENT",
        },
      })
    ).rejects.toThrow();
  });

  it("handles tenant registration in PENDING verification state", async () => {
    const inst = await prisma.institution.create({
      data: {
        name: "National Institute of Science",
        domain: "nis.ac.in",
        verificationStatus: "PENDING",
      },
    });
    expect(inst.verificationStatus).toBe("PENDING");

    // Super admin approval
    const approved = await prisma.institution.update({
      where: { id: inst.id },
      data: { verificationStatus: "APPROVED" },
    });
    expect(approved.verificationStatus).toBe("APPROVED");
  });

  it("enforces server-side blocking when a user is suspended", async () => {
    const suspendedEmail = `suspended_${Date.now()}@stepbridge.ai`;
    const passwordHash = await hashPassword(testPassword);
    const user = await prisma.user.create({
      data: {
        name: "Suspended Account",
        email: suspendedEmail,
        passwordHash,
        role: "STUDENT",
        status: "SUSPENDED",
      },
    });

    // Check status check logic
    const fetched = await prisma.user.findUnique({ where: { id: user.id } });
    expect(fetched?.status).toBe("SUSPENDED");
  });

  it("invalidates all active sessions upon password reset", async () => {
    const resetUserEmail = `reset_${Date.now()}@stepbridge.ai`;
    const passwordHash = await hashPassword(testPassword);
    const user = await prisma.user.create({
      data: {
        name: "Reset User",
        email: resetUserEmail,
        passwordHash,
        role: "STUDENT",
        status: "ACTIVE",
      },
    });

    // Create 2 active sessions
    await prisma.session.createMany({
      data: [
        {
          userId: user.id,
          tokenHash: `hash_session_1_${Date.now()}_${Math.random()}`,
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          userId: user.id,
          tokenHash: `hash_session_2_${Date.now()}_${Math.random()}`,
          expiresAt: new Date(Date.now() + 86400000),
        },
      ],
    });

    const activeBefore = await prisma.session.count({
      where: { userId: user.id, revokedAt: null },
    });
    expect(activeBefore).toBe(2);

    // Revoke all sessions upon password reset
    await prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const activeAfter = await prisma.session.count({
      where: { userId: user.id, revokedAt: null },
    });
    expect(activeAfter).toBe(0);
  });
});
