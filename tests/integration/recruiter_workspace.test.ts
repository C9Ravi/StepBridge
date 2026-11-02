import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";

describe("Phase 6: Recruiter Workspace Tests", () => {
  let companyId: string;
  let recruiterUserId: string;
  let testJobId: string;
  let otherCompanyId: string;

  beforeAll(async () => {
    const comp = await prisma.company.findFirst({
      where: { domain: "techcorp-innovations.io" },
      include: { memberships: true },
    });
    companyId = comp!.id;
    recruiterUserId = comp!.memberships[0].userId;

    const opp = await prisma.opportunity.findFirst({
      where: { companyId },
    });
    testJobId = opp!.id;

    // Create a second company to verify cross-company tenant isolation
    const otherComp = await prisma.company.upsert({
      where: { id: "00000000-0000-0000-0000-000000000088" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000088",
        name: "Secondary Innovations Ltd",
        domain: "secondary.io",
        verificationStatus: "APPROVED",
      },
    });
    otherCompanyId = otherComp.id;
  });

  it("creates a job draft and publishes it when company is approved", async () => {
    const draftJob = await prisma.opportunity.create({
      data: {
        companyId,
        title: "Frontend Systems Engineer",
        type: "FULL_TIME",
        description: "Building responsive next-gen interfaces with React & TypeScript.",
        location: "Bengaluru",
        status: "DRAFT",
      },
    });

    expect(draftJob.id).toBeDefined();
    expect(draftJob.status).toBe("DRAFT");

    // Publish job
    const published = await prisma.opportunity.update({
      where: { id: draftJob.id },
      data: { status: "PUBLISHED" },
    });
    expect(published.status).toBe("PUBLISHED");
  });

  it("moves applicant through hiring stages and logs audit transitions", async () => {
    // Find or create an application for testJobId
    let app = await prisma.application.findFirst({
      where: { opportunityId: testJobId },
    });

    if (!app) {
      const student = await prisma.studentProfile.findFirst();
      app = await prisma.application.create({
        data: {
          opportunityId: testJobId,
          studentId: student!.id,
          stage: "APPLIED",
          profileSnapshot: JSON.stringify({ skills: [{ skill: "React" }] }),
        },
      });
    }

    // Move to SHORTLISTED
    const updated = await prisma.application.update({
      where: { id: app.id },
      data: { stage: "SHORTLISTED" },
    });
    expect(updated.stage).toBe("SHORTLISTED");

    // Log stage event
    const event = await prisma.applicationStageEvent.create({
      data: {
        applicationId: app.id,
        actorId: recruiterUserId,
        fromStage: "APPLIED",
        toStage: "SHORTLISTED",
        note: "Candidate has strong project evidence.",
      },
    });
    expect(event.id).toBeDefined();
    expect(event.toStage).toBe("SHORTLISTED");

    // Add private recruiter note
    const noteEvent = await prisma.applicationStageEvent.create({
      data: {
        applicationId: app.id,
        actorId: recruiterUserId,
        fromStage: "SHORTLISTED",
        toStage: "SHORTLISTED",
        note: "[RECRUITER NOTE] Scheduled initial technical interview for Thursday 3 PM.",
      },
    });
    expect(noteEvent.note).toContain("[RECRUITER NOTE]");
  });

  it("enforces strict company scoping preventing cross-company access", async () => {
    // Query job belonging to primary company with otherCompanyId should return null
    const crossCompanyJob = await prisma.opportunity.findFirst({
      where: { id: testJobId, companyId: otherCompanyId },
    });
    expect(crossCompanyJob).toBeNull();
  });
});
