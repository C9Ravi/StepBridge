import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  getDomainCatalog,
  getDomainDetails,
  compareDomains,
  enrollStudentDomain,
  getStudentEnrolledDomains,
} from "@/modules/career/domainService";
import { calculateStudentReadiness } from "@/modules/career/readinessService";
import { createStudentRoadmap } from "@/modules/career/roadmapService";
import { getCollegeDomainAnalytics } from "@/modules/institutions/collegeService";
import {
  startAssessmentAttempt,
  saveAssessmentAnswer,
  submitAssessmentAttempt,
} from "@/modules/career/assessmentService";

describe("Expanded Multi-Domain Career Readiness Platform Tests", () => {
  let studentProfileId: string;
  let testUserId: string;
  let institutionId: string;

  const EXPECTED_SLUGS = [
    "fde",
    "ai-ml",
    "backend",
    "frontend",
    "full-stack",
    "devops-sre",
    "cloud",
    "cybersecurity",
    "data-engineer",
    "data-science-analytics",
    "mobile-engineer",
    "sdet-qa",
  ];

  beforeAll(async () => {
    const studentUser = await prisma.user.findFirst({
      where: { email: "aarav.patel@nitb.ac.in" },
      include: { studentProfile: true },
    });

    expect(studentUser).not.toBeNull();
    testUserId = studentUser!.id;
    studentProfileId = studentUser!.studentProfile!.id;
    institutionId = studentUser!.studentProfile!.institutionId!;
  });

  it("verifies all 12 distinct technology career domains exist with valid blueprints", async () => {
    const domains = await getDomainCatalog();
    expect(domains.length).toBe(12);

    const slugs = domains.map((d) => d.slug);
    for (const expectedSlug of EXPECTED_SLUGS) {
      expect(slugs).toContain(expectedSlug);
    }

    // Check each domain has rich, non-generic blueprint fields
    for (const d of domains) {
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.overview.length).toBeGreaterThan(20);
      expect(d.skillsCount).toBeGreaterThanOrEqual(4);
      expect(d.projectsCount).toBe(3); // Beginner, Intermediate, Advanced
      expect(d.careerOpportunities.length).toBeGreaterThan(0);
    }
  });

  it("retrieves full blueprint and per-domain readiness via getDomainDetails", async () => {
    const aiDomain = await getDomainDetails("ai-ml", studentProfileId);
    expect(aiDomain).not.toBeNull();
    expect(aiDomain!.domain.title).toBe("AI / Machine Learning Engineer");
    expect(aiDomain!.domain.category).toBe("Data & AI");
    expect(aiDomain!.studentReadiness).toBeDefined();
    expect(aiDomain!.studentReadiness?.overallScore).toBeGreaterThanOrEqual(0);
    expect(aiDomain!.studentReadiness?.overallScore).toBeLessThanOrEqual(100);
    expect(aiDomain!.studentReadiness?.skillsRemaining).toBeGreaterThan(0);

    const fdeDomain = await getDomainDetails("fde", studentProfileId);
    expect(fdeDomain).not.toBeNull();
    expect(fdeDomain!.domain.title).toContain("Forward Deployed Engineer");
    expect(fdeDomain!.domain.coreCsSubjects).toContain("Distributed Systems Architecture");

    // Test alias resolution (e.g. forward-deployed-engineer)
    const fdeByAlias = await getDomainDetails("forward-deployed-engineer", studentProfileId);
    expect(fdeByAlias).not.toBeNull();
    expect(fdeByAlias!.domain.slug).toBe("fde");
  });

  it("supports side-by-side comparison of 2 to 4 domains with skill overlap calculation", async () => {
    const comparison = await compareDomains(
      ["backend", "devops-sre", "cloud"],
      studentProfileId
    );

    expect(comparison.domains.length).toBe(3);
    expect(comparison.commonSkills).toBeDefined();

    const slugsInComparison = comparison.domains.map((d) => d.slug);
    expect(slugsInComparison).toContain("backend");
    expect(slugsInComparison).toContain("devops-sre");
    expect(slugsInComparison).toContain("cloud");

    // Each domain must contain real computed student readiness
    for (const item of comparison.domains) {
      expect(item.readinessScore).toBeDefined();
      expect(item.readinessScore).toBeGreaterThanOrEqual(0);
      expect(item.readinessScore).toBeLessThanOrEqual(100);
      expect(item.requiredSkills.length).toBeGreaterThan(0);
      expect(item.sampleProjects.length).toBe(3);
    }
  });

  it("allows student to enroll in multiple career interests and switch primary targets without losing progress", async () => {
    const aiRole = await prisma.role.findUnique({ where: { slug: "ai-ml" } });
    expect(aiRole).not.toBeNull();

    const devopsRole = await prisma.role.findUnique({ where: { slug: "devops-sre" } });
    expect(devopsRole).not.toBeNull();

    // 1. Enroll AI / ML as a secondary career interest
    const secondaryEnroll = await enrollStudentDomain({
      studentProfileId,
      roleId: aiRole!.id,
      isPrimary: false,
    });
    expect(secondaryEnroll.isPrimary).toBe(false);
    expect(secondaryEnroll.status).toBe("ACTIVE");

    // 2. Enroll DevOps as a secondary interest
    await enrollStudentDomain({
      studentProfileId,
      roleId: devopsRole!.id,
      isPrimary: false,
    });

    // 3. Query all enrolled domains for the student
    const enrolled = await getStudentEnrolledDomains(studentProfileId);
    expect(enrolled.length).toBeGreaterThanOrEqual(3); // Original Full Stack + AI/ML + DevOps

    const aiGoal = enrolled.find((g) => g.roleSlug === "ai-ml");
    expect(aiGoal).toBeDefined();
    expect(aiGoal?.isPrimary).toBe(false);

    // 4. Switch primary target to AI / Machine Learning Engineer
    const switchedPrimary = await enrollStudentDomain({
      studentProfileId,
      roleId: aiRole!.id,
      isPrimary: true,
    });
    expect(switchedPrimary.isPrimary).toBe(true);

    // 5. Verify prior primary (Full Stack) was demoted to secondary instead of deleted
    const reEnrolled = await getStudentEnrolledDomains(studentProfileId);
    const fullStackGoal = reEnrolled.find((g) => g.roleSlug === "full-stack");
    expect(fullStackGoal).toBeDefined();
    expect(fullStackGoal?.isPrimary).toBe(false); // Successfully demoted without loss
    expect(fullStackGoal?.status).toBe("ACTIVE");

    // 6. Restore Full Stack as primary for downstream test stability
    const fullStackRole = await prisma.role.findUnique({ where: { slug: "full-stack" } });
    await enrollStudentDomain({
      studentProfileId,
      roleId: fullStackRole!.id,
      isPrimary: true,
    });
  });

  it("computes domain-specific readiness and skill gaps distinctly across tracks", async () => {
    const fullStackReadiness = await calculateStudentReadiness(studentProfileId, "full-stack");
    const cyberReadiness = await calculateStudentReadiness(studentProfileId, "cybersecurity");

    expect(fullStackReadiness).not.toBeNull();
    expect(cyberReadiness).not.toBeNull();

    // Student has strong React and web evidence, so Full Stack readiness should exceed Cyber readiness
    expect(fullStackReadiness!.overallScore).toBeGreaterThanOrEqual(cyberReadiness!.overallScore);

    // Skill gaps for Cyber must reflect required domain skills where student has gaps
    expect(cyberReadiness!.skillGaps.length).toBeGreaterThan(0);
    const cyberGapNames = cyberReadiness!.skillGaps.map((g) => g.skillName);
    expect(cyberGapNames.some((n) => n === "Python" || n === "System Design" || n === "REST API Design")).toBe(true);
  });

  it("generates genuine domain-specialized roadmaps for newly added tracks", async () => {
    const devopsRole = await prisma.role.findUnique({ where: { slug: "devops-sre" } });

    const roadmapResult = await createStudentRoadmap({
      studentProfileId,
      userId: testUserId,
      roleId: devopsRole!.id,
      horizonWeeks: 8,
      weeklyHours: 15,
    });

    expect(roadmapResult.roadmap.id).toBeDefined();
    expect(roadmapResult.roadmapDetails.milestones.length).toBe(8);

    // Verify milestones contain domain-specific terms (not generic templates)
    const allTitles = roadmapResult.roadmapDetails.milestones
      .map((m) => m.title.toLowerCase())
      .join(" ");

    expect(
      allTitles.includes("devops") ||
      allTitles.includes("cloud") ||
      allTitles.includes("ci/cd") ||
      allTitles.includes("kubernetes") ||
      allTitles.includes("infrastructure")
    ).toBe(true);
  });

  it("handles domain-specific assessment attempt lifecycle without exposing answer keys", async () => {
    // Find an active assessment
    const assessment = await prisma.assessment.findFirst({
      where: {
        status: "ACTIVE",
      },
    });

    expect(assessment).not.toBeNull();

    // Clear previous attempts for clean test run
    await prisma.assessmentAttempt.deleteMany({
      where: { assessmentId: assessment!.id, studentId: studentProfileId },
    });

    const attempt = await startAssessmentAttempt({
      assessmentId: assessment!.id,
      studentProfileId,
    });

    expect(attempt.attemptId).toBeDefined();
    expect(attempt.questions.length).toBeGreaterThan(0);

    // Verify answer key is strictly omitted from student view
    for (const q of attempt.questions) {
      expect((q as Record<string, unknown>).answerKey).toBeUndefined();
    }

    // Save an answer
    const q1 = attempt.questions[0];
    const saved = await saveAssessmentAnswer({
      attemptId: attempt.attemptId,
      questionId: q1.id,
      selectedAnswer: 0,
      studentProfileId,
    });
    expect(saved.selectedAnswer).toBe(0);

    // Submit attempt
    const result = await submitAssessmentAttempt({
      attemptId: attempt.attemptId,
      studentProfileId,
    });
    expect(result.attemptId).toBe(attempt.attemptId);
    expect(result.scorePercentage).toBeGreaterThanOrEqual(0);
    expect(result.review.length).toBe(attempt.questions.length);
  });

  it("enforces college tenant isolation on domain analytics", async () => {
    const analytics = await getCollegeDomainAnalytics(institutionId);
    expect(analytics.length).toBe(12);

    // Check Full Stack Engineer has interested students from NIT Bangalore
    const fseAnalytics = analytics.find((d) => d.slug === "full-stack" || d.title.includes("Full Stack"));
    expect(fseAnalytics).toBeDefined();
    expect(fseAnalytics!.interestedStudentsCount).toBeGreaterThan(0);
    expect(fseAnalytics!.primaryTargetCount).toBeGreaterThan(0);

    // Verify other college's institutionId has 0 students enrolled
    const fakeInstitutionId = "non-existent-college-id-999";
    const foreignAnalytics = await getCollegeDomainAnalytics(fakeInstitutionId);
    expect(foreignAnalytics.length).toBe(12);
    for (const d of foreignAnalytics) {
      expect(d.interestedStudentsCount).toBe(0);
      expect(d.primaryTargetCount).toBe(0);
    }
  });

  it("preserves Aarav Patel's existing target role and progress without regression", async () => {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        careerGoals: {
          where: { isPrimary: true, status: "ACTIVE" },
          include: { role: true },
        },
        skills: true,
      },
    });

    expect(student).not.toBeNull();
    expect(student!.careerGoals.length).toBe(1);
    expect(student!.careerGoals[0].role.title).toBe("Full Stack Engineer");
    expect(student!.skills.length).toBeGreaterThan(0);
  });
});
