import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { calculateStudentReadiness } from "@/modules/career/readinessService";

export async function GET() {
  const session = await getSession();
  try {
    assertStudent(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session!.userId },
  });
  if (!profile) return apiError("Profile not found", "NOT_FOUND", 404);

  const readiness = await calculateStudentReadiness(profile.id);
  if (!readiness) {
    return apiError(
      "No primary career goal selected. Please choose a target role first.",
      "GOAL_NOT_SET",
      400
    );
  }

  return apiSuccess({ readiness });
}
