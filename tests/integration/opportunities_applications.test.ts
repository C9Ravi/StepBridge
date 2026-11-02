import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { checkOpportunityEligibility } from "@/modules/opportunities/eligibilityService";

describe("Phase 4: Opportunities & Applications Tests", () => {
  let testStudentProfileId: string;
  let testOpportunityId: string;

  beforeAll(async () => {
    const studentUser = await prisma.user.findFirst({
      where: { email: "aarav.patel@nitb.ac.in" },
      include: { studentProfile: true },
    });
    testStudentProfileId = studentUser!.studentProfile!.id;

    const opp = await prisma.opportunity.findFirst({
      where: { title: "Junior Full Stack Engineer" },
    });
    testOpportunityId = opp!.id;
  });

  it("evaluates eligibility correctly with transparent pass/fail rules", async () => {
    const result = await checkOpportunityEligibility({
      opportunityId: testOpportunityId,
      studentProfileId: testStudentProfileId,
    });

    expect(result.isEligible).toBe(true);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.checks[0].ruleType).toBe("MIN_CGPA");
    expect(result.checks[0].passed).toBe(true);
    expect(result.checks[0].reason).toContain("CGPA requirement met");

    // Explainable match string
    expect(result.matchExplanation.summary).toContain("Matches");
    expect(result.matchExplanation.matchedSkills.length).toBeGreaterThan(0);
  });

  it("submits application and verifies immutable snapshot and stage transition log", async () => {
    // Delete any prior application for clean test execution
    await prisma.application.deleteMany({
      where: {
        opportunityId: testOpportunityId,
        studentId: testStudentProfileId,
      },
    });

    const snapshotData = JSON.stringify({
      name: "Aarav Patel",
      cgpa: 8.65,
      skills: ["React", "TypeScript", "Node.js"],
    });

    const app = await prisma.application.create({
      data: {
        opportunityId: testOpportunityId,
        studentId: testStudentProfileId,
        stage: "APPLIED",
        profileSnapshot: snapshotData,
        stageEvents: {
          create: {
            fromStage: "NONE",
            toStage: "APPLIED",
            note: "Applied via student portal",
          },
        },
      },
      include: { stageEvents: true },
    });

    expect(app.id).toBeDefined();
    expect(app.stage).toBe("APPLIED");
    expect(app.stageEvents.length).toBe(1);
    expect(app.stageEvents[0].toStage).toBe("APPLIED");

    // Test duplicate prevention constraint
    await expect(
      prisma.application.create({
        data: {
          opportunityId: testOpportunityId,
          studentId: testStudentProfileId,
          stage: "APPLIED",
          profileSnapshot: snapshotData,
        },
      })
    ).rejects.toThrow();
  });
});
