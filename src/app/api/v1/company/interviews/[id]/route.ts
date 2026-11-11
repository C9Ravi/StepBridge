import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCompanyRecruiter } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateInterviewSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"]).optional(),
  feedback: z.string().max(2000).optional(),
  rating: z.number().min(1).max(5).optional(),
  recommendation: z.enum(["STRONG_HIRE", "HIRE", "HOLD", "NO_HIRE"]).optional(),
  notes: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    let companyId: string;
    try {
      companyId = assertCompanyRecruiter(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Forbidden";
      return apiError(msg, "FORBIDDEN", 403);
    }

    const { id: interviewId } = await params;
    const interview = await prisma.interviewSchedule.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            opportunity: true,
          },
        },
      },
    });

    if (!interview || interview.application.opportunity.companyId !== companyId) {
      return apiError("Interview not found in your company scope", "NOT_FOUND", 404);
    }

    const body = await req.json();
    const result = updateInterviewSchema.safeParse(body);
    if (!result.success) {
      return apiError("Invalid interview feedback data", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const iv = await tx.interviewSchedule.update({
        where: { id: interviewId },
        data: {
          ...(result.data.status && { status: result.data.status }),
          ...(result.data.feedback !== undefined && { feedback: result.data.feedback }),
          ...(result.data.rating !== undefined && { rating: result.data.rating }),
          ...(result.data.recommendation !== undefined && { recommendation: result.data.recommendation }),
          ...(result.data.notes !== undefined && { notes: result.data.notes }),
        },
      });

      // If feedback provided, also add internal recruiter note to application
      if (result.data.feedback || result.data.recommendation) {
        await tx.applicationStageEvent.create({
          data: {
            applicationId: interview.applicationId,
            actorId: session!.userId,
            fromStage: interview.application.stage,
            toStage: interview.application.stage,
            note: `[INTERVIEW EVALUATION - ${interview.roundTitle}] Rating: ${result.data.rating || "N/A"}/5 | Rec: ${result.data.recommendation || "N/A"} | Feedback: ${result.data.feedback || "None"}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: session!.userId,
          tenantType: "COMPANY",
          tenantId: companyId,
          action: "INTERVIEW_FEEDBACK_RECORDED",
          resource: `InterviewSchedule:${iv.id}`,
          metadata: JSON.stringify(result.data),
        },
      });

      return iv;
    });

    return apiSuccess({ interview: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update interview";
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}
