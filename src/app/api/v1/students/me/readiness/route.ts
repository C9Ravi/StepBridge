import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { calculateStudentReadiness } from "@/modules/career/readinessService";

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const roleIdOrSlug = searchParams.get("roleId") || searchParams.get("slug") || undefined;

  const readiness = await calculateStudentReadiness(profile.id, roleIdOrSlug);
  if (!readiness) {
    return apiError(
      "No target career domain selected. Please choose a target track first.",
      "GOAL_NOT_SET",
      400
    );
  }

  return apiSuccess({ readiness });
}
