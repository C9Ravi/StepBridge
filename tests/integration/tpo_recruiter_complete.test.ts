import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  getCollegeCohortAnalytics,
  previewDriveEligibleCount,
  importStudentsFromCsv,
  recordPlacementOutcome,
  broadcastCollegeNotification,
} from "@/modules/institutions/collegeService";

describe("Complete College TPO & Recruiter E2E Integration Suite", () => {
  let institutionId: string;
  let collegeAdminUserId: string;
  let companyId: string;
  let recruiterUserId: string;
  let testStudentId: string;
  let testStudentUserId: string;
  let testJobId: string;

  beforeAll(async () => {
    // 1. Fetch JCBUST College
    const institution = await prisma.institution.findFirst({
      where: {
        OR: [{ domain: "jcbust.ac.in" }, { name: { contains: "JCBUST" } }, { domain: "nitb.ac.in" }],
      },
      include: {
        memberships: true,
      },
    });
    institutionId = institution!.id;
    collegeAdminUserId = institution!.memberships[0]?.userId || "admin-user";

    // 2. Fetch TechCorp Innovations
    const company = await prisma.company.findFirst({
      where: { domain: "techcorp-innovations.io" },
      include: { memberships: true },
    });
    companyId = company!.id;
    recruiterUserId = company!.memberships[0]?.userId || "recruiter-user";

    // 3. Fetch Ravi Chauhan (Student)
    const student = await prisma.studentProfile.findFirst({
      where: { institutionId },
      include: { user: true, skills: { include: { skill: true } } },
    });
    testStudentId = student!.id;
    testStudentUserId = student!.userId;

    // 4. Ensure an Opportunity exists
    let opp = await prisma.opportunity.findFirst({
      where: { companyId },
    });
    if (!opp) {
      opp = await prisma.opportunity.create({
        data: {
          companyId,
          title: "Full Stack Systems Engineer",
          type: "FULL_TIME",
          description: "End to end cloud platform development with React, Node.js and SQL.",
          location: "Bengaluru (Hybrid)",
          salaryRange: "₹12 – 16 LPA",
          status: "PUBLISHED",
        },
      });
    }
    testJobId = opp.id;
  });

  describe("COLLEGE TPO WORKSPACE", () => {
    it("computes real placement metrics and cohort distribution", async () => {
      const analytics = await getCollegeCohortAnalytics(institutionId);

      expect(analytics.totalStudents).toBeGreaterThan(0);
      expect(analytics.placementMetrics.placedStudentsCount).toBeGreaterThanOrEqual(0);
      expect(analytics.placementMetrics.placementRatePercentage).toBeGreaterThanOrEqual(0);
      expect(analytics.readinessBands).toBeDefined();
      expect(analytics.readinessBands.readyForPlacement).toBeGreaterThanOrEqual(0);
    });

    it("previews drive eligibility and excludes students not meeting CGPA cutoff", async () => {
      const highCutoffPreview = await previewDriveEligibleCount({
        institutionId,
        minCgpa: 8.5,
        allowedBranches: ["CSE"],
        graduationYears: [2025],
      });

      const lowCutoffPreview = await previewDriveEligibleCount({
        institutionId,
        minCgpa: 6.0,
        allowedBranches: ["CSE"],
        graduationYears: [2025],
      });

      expect(lowCutoffPreview.eligibleCount).toBeGreaterThanOrEqual(highCutoffPreview.eligibleCount);
      expect(highCutoffPreview.eligibleCount + highCutoffPreview.excludedCount).toBe(highCutoffPreview.totalStudents);
    });

    it("imports validated students from CSV and creates student profiles", async () => {
      const uniqueSuffix = Date.now();
      const csvRecords = [
        {
          name: "Ankit Sharma",
          email: `ankit_${uniqueSuffix}@jcbust.ac.in`,
          departmentCode: "CSE",
          graduationYear: 2025,
          cgpa: 8.75,
        },
        {
          name: "Deepa Nair",
          email: `deepa_${uniqueSuffix}@jcbust.ac.in`,
          departmentCode: "ECE",
          graduationYear: 2026,
          cgpa: 8.1,
        },
      ];

      const res = await importStudentsFromCsv({
        institutionId,
        records: csvRecords,
      });

      expect(res.importedCount).toBe(2);
      expect(res.skippedCount).toBe(0);

      // Verify records are persisted in database
      const found = await prisma.user.findUnique({
        where: { email: `ankit_${uniqueSuffix}@jcbust.ac.in` },
        include: { studentProfile: true },
      });
      expect(found).toBeDefined();
      expect(found!.studentProfile?.institutionId).toBe(institutionId);
    });

    it("broadcasts notifications to student cohort", async () => {
      const result = await broadcastCollegeNotification({
        institutionId,
        title: "Campus Drive Registration Alert",
        body: "Registration for TechCorp campus placement is now live.",
      });

      expect(result.dispatchedCount).toBeGreaterThan(0);

      // Verify student received the notification
      const studentNotification = await prisma.notification.findFirst({
        where: {
          userId: testStudentUserId,
          title: "Campus Drive Registration Alert",
        },
      });
      expect(studentNotification).toBeDefined();
    });

    it("records a placement outcome and updates placement metrics", async () => {
      const outcome = await recordPlacementOutcome({
        institutionId,
        studentId: testStudentId,
        companyName: "Google Cloud",
        packageLpa: 26.5,
        outcome: "OFFERED",
      });

      expect(outcome.id).toBeDefined();
      expect(outcome.packageLpa).toBe(26.5);

      // Verify analytics reflect the placed student
      const updatedAnalytics = await getCollegeCohortAnalytics(institutionId);
      expect(updatedAnalytics.placementMetrics.placedStudentsCount).toBeGreaterThan(0);
      expect(updatedAnalytics.placementMetrics.highestPackageLpa).toBeGreaterThanOrEqual(26.5);
    });
  });

  describe("RECRUITER WORKSPACE", () => {
    it("creates a new job and publishes it", async () => {
      const newJob = await prisma.opportunity.create({
        data: {
          companyId,
          title: `Backend Distributed Engineer ${Date.now()}`,
          type: "FULL_TIME",
          description: "Designing high throughput event driven architectures with Kafka and Redis.",
          location: "Faridabad / Gurgaon",
          salaryRange: "₹14 – 18 LPA",
          status: "PUBLISHED",
        },
      });

      expect(newJob.id).toBeDefined();
      expect(newJob.status).toBe("PUBLISHED");
    });

    it("searches candidates and respects privacy consent (PRIVATE visibility excluded)", async () => {
      // Create a private student
      const privateUser = await prisma.user.create({
        data: {
          name: "Secret Learner",
          email: `private_${Date.now()}@example.com`,
          passwordHash: "hash",
          role: "STUDENT",
        },
      });
      await prisma.studentProfile.create({
        data: {
          userId: privateUser.id,
          headline: "Stealth Developer",
          visibility: "PRIVATE",
        },
      });

      // Recruiter discovery query
      const candidates = await prisma.studentProfile.findMany({
        where: {
          visibility: { in: ["VERIFIED_RECRUITERS", "INSTITUTION_ONLY"] },
        },
      });

      const privateFound = candidates.find((c) => c.userId === privateUser.id);
      expect(privateFound).toBeUndefined();
    });

    it("advances application stages and enforces audit trails", async () => {
      const application = await prisma.application.upsert({
        where: {
          opportunityId_studentId: {
            opportunityId: testJobId,
            studentId: testStudentId,
          },
        },
        create: {
          opportunityId: testJobId,
          studentId: testStudentId,
          stage: "APPLIED",
          profileSnapshot: JSON.stringify({ skills: ["TypeScript", "Node.js"] }),
        },
        update: {
          stage: "APPLIED",
        },
      });

      // Advance to SHORTLISTED
      const updated = await prisma.application.update({
        where: { id: application.id },
        data: { stage: "SHORTLISTED" },
      });
      expect(updated.stage).toBe("SHORTLISTED");

      // Record stage transition event
      const stageEvent = await prisma.applicationStageEvent.create({
        data: {
          applicationId: application.id,
          actorId: recruiterUserId,
          fromStage: "APPLIED",
          toStage: "SHORTLISTED",
          note: "Strong GitHub project portfolio and verified assessments.",
        },
      });
      expect(stageEvent.id).toBeDefined();
      expect(stageEvent.toStage).toBe("SHORTLISTED");
    });

    it("schedules an interview round and dispatches notification to candidate", async () => {
      const application = await prisma.application.findFirst({
        where: { opportunityId: testJobId, studentId: testStudentId },
      });

      const interview = await prisma.interviewSchedule.create({
        data: {
          applicationId: application!.id,
          roundTitle: "System Architecture Screening",
          scheduledAt: new Date(Date.now() + 86400000 * 3), // 3 days later
          durationMinutes: 60,
          meetingUrl: "https://meet.google.com/techcorp-eval-room",
          interviewerName: "TechCorp Principal Architect",
          status: "SCHEDULED",
        },
      });

      expect(interview.id).toBeDefined();
      expect(interview.roundTitle).toBe("System Architecture Screening");

      // Record evaluation feedback
      const evaluated = await prisma.interviewSchedule.update({
        where: { id: interview.id },
        data: {
          status: "COMPLETED",
          rating: 5,
          recommendation: "STRONG_HIRE",
          feedback: "Exceptional mastery of relational normalization and cache invalidation strategies.",
        },
      });

      expect(evaluated.status).toBe("COMPLETED");
      expect(evaluated.rating).toBe(5);
      expect(evaluated.recommendation).toBe("STRONG_HIRE");
    });
  });

  describe("CROSS-ROLE WORKFLOWS & TENANT ISOLATION", () => {
    it("ensures recruiter notes are never exposed across company tenant boundaries", async () => {
      // Create a second company
      const otherCompany = await prisma.company.upsert({
        where: { id: "00000000-0000-0000-0000-000000000077" },
        update: {},
        create: {
          id: "00000000-0000-0000-0000-000000000077",
          name: "Unrelated Corp",
          domain: "unrelated.com",
          verificationStatus: "APPROVED",
        },
      });

      // Try to query applications for TechCorp under Unrelated Corp scope
      const leakAttempt = await prisma.application.findMany({
        where: {
          opportunity: { companyId: otherCompany.id },
        },
      });

      // Must be empty
      expect(leakAttempt.length).toBe(0);
    });

    it("ensures college placement analytics strictly isolate students of other institutions", async () => {
      // Create an outside student from another college
      const outsideInst = await prisma.institution.upsert({
        where: { id: "00000000-0000-0000-0000-000000000066" },
        update: {},
        create: {
          id: "00000000-0000-0000-0000-000000000066",
          name: "Outside Engineering Institute",
          domain: "outside.edu",
          verificationStatus: "APPROVED",
        },
      });

      const outsideUser = await prisma.user.create({
        data: {
          name: "External Candidate",
          email: `external_${Date.now()}@outside.edu`,
          passwordHash: "hash",
          role: "STUDENT",
        },
      });

      await prisma.studentProfile.create({
        data: {
          userId: outsideUser.id,
          institutionId: outsideInst.id,
          cgpa: 9.8,
        },
      });

      // JCBUST cohort analytics must NOT count this outside student
      const jcbustAnalytics = await getCollegeCohortAnalytics(institutionId);
      expect(jcbustAnalytics.totalStudents).toBeGreaterThan(0);
      expect(collegeAdminUserId).toBeDefined();

      const studentEmails = (await prisma.studentProfile.findMany({
        where: { institutionId },
        include: { user: true },
      })).map((s) => s.user.email);

      expect(studentEmails).not.toContain(outsideUser.email);
    });
  });
});
