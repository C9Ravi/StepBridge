import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

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

  const { id } = await params;
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session!.userId },
  });
  if (!profile) return apiError("Profile not found", "NOT_FOUND", 404);

  const application = await prisma.application.findUnique({
    where: { id },
  });

  if (!application || application.studentId !== profile.id) {
    return apiError("Application not found", "NOT_FOUND", 404);
  }

  // PRD 12.11: Student may withdraw until interview stage
  if (["INTERVIEW", "OFFERED", "HIRED"].includes(application.stage)) {
    return apiError(
      "Applications that have progressed to Interview stage or beyond cannot be withdrawn online.",
      "WITHDRAW_FORBIDDEN",
      403
    );
  }

  await prisma.$transaction([
    prisma.application.update({
      where: { id },
      data: { stage: "REJECTED" }, // marks inactive
    }),
    prisma.applicationStageEvent.create({
      data: {
        applicationId: id,
        actorId: session!.userId,
        fromStage: application.stage,
        toStage: "WITHDRAWN",
        note: "Withdrawn by candidate.",
      },
    }),
  ]);

  return apiSuccess({ message: "Application withdrawn successfully" });
}
