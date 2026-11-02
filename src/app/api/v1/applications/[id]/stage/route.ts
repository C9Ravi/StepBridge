import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCompanyRecruiter } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { sendNotification } from "@/lib/email/service";
import { z } from "zod";

const updateStageSchema = z.object({
  stage: z.enum(["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"]),
  note: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  let companyId: string;
  try {
    companyId = assertCompanyRecruiter(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const { id: applicationId } = await params;
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      opportunity: { include: { company: true } },
      student: { select: { userId: true } },
    },
  });

  // Cross-company access check (PRD 11.2)
  if (!application || application.opportunity.companyId !== companyId) {
    return apiError("Application not found in your company scope", "NOT_FOUND", 404);
  }

  const body = await req.json();
  const result = updateStageSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid stage value", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  const fromStage = application.stage;
  const toStage = result.data.stage;
  const note = result.data.note;

  const updatedApp = await prisma.$transaction(async (tx) => {
    const app = await tx.application.update({
      where: { id: applicationId },
      data: { stage: toStage },
    });

    await tx.applicationStageEvent.create({
      data: {
        applicationId,
        actorId: session!.userId,
        fromStage,
        toStage,
        note: note || `Application advanced to ${toStage}`,
      },
    });

    return app;
  });

  // Notify student of stage progression (FR-REC-07)
  await sendNotification({
    userId: application.student.userId,
    type: "APPLICATION_STAGE",
    title: `Application Update: ${application.opportunity.title}`,
    body: `Your application status at ${application.opportunity.company.name} has moved from ${fromStage} to ${toStage}.`,
    actionUrl: `/applications`,
    sendEmail: true,
  });

  return apiSuccess({
    application: updatedApp,
    fromStage,
    toStage,
  });
}
