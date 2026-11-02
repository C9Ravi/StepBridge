import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { startAssessmentAttempt } from "@/modules/career/assessmentService";

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

  try {
    const attempt = await startAssessmentAttempt({
      assessmentId: id,
      studentProfileId: profile.id,
    });
    return apiSuccess({ attempt }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to start assessment attempt";
    return apiError(msg, "ASSESSMENT_START_FAILED", 400);
  }
}
