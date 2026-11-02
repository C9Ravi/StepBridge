import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { checkOpportunityEligibility } from "@/modules/opportunities/eligibilityService";
import { sendNotification } from "@/lib/email/service";
import { z } from "zod";

const applySchema = z.object({
  resumeId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  try {
    assertStudent(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const { id: opportunityId } = await params;
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session!.userId },
    include: {
      user: { select: { name: true, email: true } },
      education: true,
      skills: { include: { skill: true } },
      projects: true,
    },
  });

  if (!profile) return apiError("Profile not found", "NOT_FOUND", 404);

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { company: true },
  });

  if (!opportunity || opportunity.status !== "PUBLISHED") {
    return apiError("Opportunity is not open for applications", "BAD_REQUEST", 400);
  }

  // Check deadline
  if (opportunity.deadline && new Date() > new Date(opportunity.deadline)) {
    return apiError("The application deadline for this opportunity has passed", "DEADLINE_EXPIRED", 400);
  }

  // Server rechecks eligibility (PRD 12.11)
  const eligibility = await checkOpportunityEligibility({
    opportunityId,
    studentProfileId: profile.id,
  });

  if (!eligibility.isEligible) {
    return apiError(
      "You do not meet the minimum eligibility criteria for this role.",
      "INELIGIBLE",
      403,
      {
        reasons: eligibility.checks.filter((c) => !c.passed).map((c) => c.reason),
      }
    );
  }

  // Check duplicate application
  const existingApp = await prisma.application.findUnique({
    where: {
      opportunityId_studentId: {
        opportunityId,
        studentId: profile.id,
      },
    },
  });

  if (existingApp) {
    return apiError("You have already applied to this opportunity", "DUPLICATE_APPLICATION", 409);
  }

  const body = await req.json().catch(() => ({}));
  const result = applySchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid application parameters", "VALIDATION_ERROR", 422);
  }

  // Prepare immutable snapshot of student profile at application time (PRD 12.11, 19.2)
  const profileSnapshot = JSON.stringify({
    studentId: profile.id,
    name: profile.user.name,
    email: profile.user.email,
    headline: profile.headline,
    cgpa: profile.cgpa,
    education: profile.education,
    skills: profile.skills.map((s) => ({
      skill: s.skill.canonicalName,
      verifiedLevel: s.verifiedLevel,
      selfLevel: s.selfLevel,
    })),
    projects: profile.projects.map((p) => ({
      title: p.title,
      technologies: p.technologies,
      url: p.url,
    })),
    appliedAt: new Date().toISOString(),
  });

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.application.create({
      data: {
        opportunityId,
        studentId: profile.id,
        stage: "APPLIED",
        resumeId: result.data.resumeId || null,
        profileSnapshot,
      },
    });

    // Create initial stage transition event
    await tx.applicationStageEvent.create({
      data: {
        applicationId: app.id,
        actorId: session!.userId,
        fromStage: "NONE",
        toStage: "APPLIED",
        note: result.data.note || "Application submitted by student.",
      },
    });

    return app;
  });

  // Notify student of confirmation
  await sendNotification({
    userId: session!.userId,
    type: "APPLICATION_STAGE",
    title: `Application Submitted: ${opportunity.title}`,
    body: `Your application to ${opportunity.company.name} for "${opportunity.title}" has been successfully submitted.`,
    actionUrl: `/applications`,
    sendEmail: true,
  });

  return apiSuccess({ application }, 201);
}
