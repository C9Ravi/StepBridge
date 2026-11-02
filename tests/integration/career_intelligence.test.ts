import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { calculateStudentReadiness } from "@/modules/career/readinessService";
import { createStudentRoadmap } from "@/modules/career/roadmapService";
import { startAssessmentAttempt, saveAssessmentAnswer, submitAssessmentAttempt } from "@/modules/career/assessmentService";

describe("Phase 3: Career Intelligence Tests", () => {
  let studentProfileId: string;
  let testUserId: string;
  let testRoleId: string;
  let testAssessmentId: string;

  beforeAll(async () => {
    const studentUser = await prisma.user.findFirst({
      where: { role: "STUDENT", email: "aarav.patel@nitb.ac.in" },
      include: { studentProfile: true },
    });

    testUserId = studentUser!.id;
    studentProfileId = studentUser!.studentProfile!.id;

    const role = await prisma.role.findFirst({ where: { title: "Full Stack Engineer" } });
    testRoleId = role!.id;

    const assessment = await prisma.assessment.findFirst({ where: { status: "ACTIVE" } });
    testAssessmentId = assessment!.id;
  });

  it("calculates transparent readiness and skill gaps against target role", async () => {
    const readiness = await calculateStudentReadiness(studentProfileId);
    expect(readiness).not.toBeNull();
    expect(readiness?.overallScore).toBeGreaterThanOrEqual(0);
    expect(readiness?.overallScore).toBeLessThanOrEqual(100);
    expect(readiness?.skillGaps.length).toBeGreaterThan(0);
    expect(["HIGH", "MEDIUM", "LOW"]).toContain(readiness?.confidence);
  });

  it("starts assessment and ensures answer keys are NOT exposed to student", async () => {
    // Clear prior attempts for clean test idempotency
    await prisma.assessmentAttempt.deleteMany({
      where: { assessmentId: testAssessmentId, studentId: studentProfileId },
    });

    const attempt = await startAssessmentAttempt({
      assessmentId: testAssessmentId,
      studentProfileId,
    });

    expect(attempt.attemptId).toBeDefined();
    expect(attempt.questions.length).toBeGreaterThan(0);

    // Verify answerKey is NOT present in returned question objects
    for (const q of attempt.questions) {
      expect((q as Record<string, unknown>).answerKey).toBeUndefined();
      expect(q.options.length).toBeGreaterThan(0);
    }

    // Test autosave answer
    const q1 = attempt.questions[0];
    const saved = await saveAssessmentAnswer({
      attemptId: attempt.attemptId,
      questionId: q1.id,
      selectedAnswer: 1,
      studentProfileId,
    });
    expect(saved.selectedAnswer).toBe(1);

    // Test submission and grading
    const submitResult = await submitAssessmentAttempt({
      attemptId: attempt.attemptId,
      studentProfileId,
    });

    expect(submitResult.attemptId).toBe(attempt.attemptId);
    expect(submitResult.scorePercentage).toBeGreaterThanOrEqual(0);
    expect(submitResult.review.length).toBeGreaterThan(0);
  });

  it("generates structured 8-week career roadmap with milestones and tasks", async () => {
    const result = await createStudentRoadmap({
      studentProfileId,
      userId: testUserId,
      roleId: testRoleId,
      horizonWeeks: 8,
      weeklyHours: 15,
    });

    expect(result.roadmap.id).toBeDefined();
    expect(result.roadmap.horizonWeeks).toBe(8);
    expect(result.roadmapDetails.milestones.length).toBe(8);

    // Verify database milestones & tasks were persisted
    const milestones = await prisma.roadmapMilestone.findMany({
      where: { roadmapId: result.roadmap.id },
      include: { tasks: true },
    });

    expect(milestones.length).toBe(8);
    expect(milestones[0].tasks.length).toBeGreaterThan(0);

    // Update task status
    const firstTask = milestones[0].tasks[0];
    const updatedTask = await prisma.roadmapTask.update({
      where: { id: firstTask.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    expect(updatedTask.status).toBe("COMPLETED");
  });
});
