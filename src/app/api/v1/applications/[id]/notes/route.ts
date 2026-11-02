import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCompanyRecruiter } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const addNoteSchema = z.object({
  note: z.string().min(1, "Note cannot be empty").max(1000),
});

export async function POST(
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
    include: { opportunity: true },
  });

  if (!application || application.opportunity.companyId !== companyId) {
    return apiError("Application not found in your company scope", "NOT_FOUND", 404);
  }

  const body = await req.json();
  const result = addNoteSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid note content", "VALIDATION_ERROR", 422);
  }

  // Private recruiter note logged as a stage event (FR-REC-06)
  const event = await prisma.applicationStageEvent.create({
    data: {
      applicationId,
      actorId: session!.userId,
      fromStage: application.stage,
      toStage: application.stage,
      note: `[RECRUITER NOTE] ${result.data.note}`,
    },
    include: {
      actor: { select: { name: true } },
    },
  });

  return apiSuccess({
    note: {
      id: event.id,
      author: event.actor?.name || "Recruiter",
      note: event.note,
      createdAt: event.createdAt,
    },
  }, 201);
}
