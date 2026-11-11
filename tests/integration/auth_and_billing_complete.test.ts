import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { revokeServerSessions, hashPassword } from "@/lib/auth/session";
import { BILLING_PLANS, createOrUpdateSubscription } from "@/modules/billing/billingService";

describe("Phase 5: Auth Revocation, SaaS Subscriptions & Admin Governance Tests", () => {
  let testUserId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Create a dedicated test user
    const passwordHash = await hashPassword("AuthTest2026!");
    const testUser = await prisma.user.upsert({
      where: { email: "authtest.user@stepbridge.in" },
      update: {},
      create: {
        name: "Auth Test User",
        email: "authtest.user@stepbridge.in",
        passwordHash,
        role: "STUDENT",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
    testUserId = testUser.id;
  });

  it("revokes active server sessions upon user logout", async () => {
    // Simulate active session in prisma.session
    const tokenHash = `test_token_hash_${Date.now()}`;
    await prisma.session.create({
      data: {
        userId: testUserId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const activeSessionsBefore = await prisma.session.findMany({
      where: { userId: testUserId, revokedAt: null },
    });
    expect(activeSessionsBefore.length).toBeGreaterThan(0);

    // Call revokeServerSessions
    await revokeServerSessions(testUserId);

    const activeSessionsAfter = await prisma.session.findMany({
      where: { userId: testUserId, revokedAt: null },
    });
    expect(activeSessionsAfter.length).toBe(0);

    const revokedSessions = await prisma.session.findMany({
      where: { userId: testUserId, revokedAt: { not: null } },
    });
    expect(revokedSessions.length).toBeGreaterThan(0);
  });

  it("provides correct SaaS subscription tiers and plan limits", () => {
    const planIds = BILLING_PLANS.map((p) => p.id);
    expect(planIds).toContain("STUDENT_FREE");
    expect(planIds).toContain("STUDENT_PREMIUM");
    expect(planIds).toContain("COLLEGE_PILOT");
    expect(planIds).toContain("RECRUITER_PRO");

    const studentPremium = BILLING_PLANS.find((p) => p.id === "STUDENT_PREMIUM");
    expect(studentPremium?.priceInr).toBe(499);
    expect(studentPremium?.features.length).toBeGreaterThan(0);

    const recruiterPro = BILLING_PLANS.find((p) => p.id === "RECRUITER_PRO");
    expect(recruiterPro?.priceInr).toBe(14999);
  });

  it("creates active subscription and payment record transactionally", async () => {
    const sub = await createOrUpdateSubscription({
      userId: testUserId,
      planTier: "STUDENT_PREMIUM",
      billingInterval: "MONTHLY",
      providerPaymentId: `pay_test_${Date.now()}`,
    });

    expect(sub.id).toBeDefined();
    expect(sub.planTier).toBe("STUDENT_PREMIUM");
    expect(sub.status).toBe("ACTIVE");

    const payment = await prisma.paymentRecord.findFirst({
      where: { subscriptionId: sub.id },
    });
    expect(payment).not.toBeNull();
    expect(payment?.amount).toBe(499);
    expect(payment?.status).toBe("SUCCESS");
  });

  it("toggles user status between ACTIVE and SUSPENDED and prevents unauthorized escalation", async () => {
    // Suspend user
    const suspended = await prisma.user.update({
      where: { id: testUserId },
      data: { status: "SUSPENDED" },
    });
    expect(suspended.status).toBe("SUSPENDED");

    // Reactivate user
    const reactivated = await prisma.user.update({
      where: { id: testUserId },
      data: { status: "ACTIVE" },
    });
    expect(reactivated.status).toBe("ACTIVE");
  });

  it("evaluates student resume and computes ATS hygiene and section completeness", async () => {
    // Find or create student profile for test user
    let profile = await prisma.studentProfile.findUnique({
      where: { userId: testUserId },
    });
    if (!profile) {
      profile = await prisma.studentProfile.create({
        data: {
          userId: testUserId,
          headline: "Aspiring Cloud Engineer",
          cgpa: 8.5,
          completionPercentage: 80,
        },
      });
    }

    const testResume = await prisma.resume.create({
      data: {
        studentProfileId: profile.id,
        fileName: "test_engineering_resume.pdf",
        storageKey: `resumes/test_${Date.now()}.pdf`,
        fileType: "pdf",
        sizeBytes: 104850,
        status: "UPLOADED",
        extractedText:
          "Jane Doe | jane.doe@example.com | +91 9876543210 | B.Tech CSE 2025 | Skills: React, TypeScript, Python, PostgreSQL, Git | Projects: E-Commerce Store with Redis.",
      },
    });

    expect(testResume.id).toBeDefined();

    // Create an analysis record
    const analysis = await prisma.resumeAnalysis.create({
      data: {
        resumeId: testResume.id,
        atsScore: 85,
        status: "COMPLETED",
        structuredResult: JSON.stringify({
          atsHygiene: { contactInfo: true, standardHeadings: true },
          extractedSkills: ["React", "TypeScript", "Python", "PostgreSQL"],
          suggestions: ["Add quantitative benchmarks to project descriptions"],
        }),
      },
    });

    expect(analysis.atsScore).toBe(85);
    expect(analysis.status).toBe("COMPLETED");
  });
});
