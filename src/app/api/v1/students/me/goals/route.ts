import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { calculateProfileCompletion } from "@/modules/students/profileService";
import { enrollStudentDomain, getStudentEnrolledDomains } from "@/modules/career/domainService";

const setGoalSchema = z.object({
  roleId: z.string().uuid(),
  isPrimary: z.boolean().default(true),
  targetDate: z.string().datetime().optional(),
});

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

  const enrolledDomains = await getStudentEnrolledDomains(profile.id);

  return apiSuccess({
    totalCount: enrolledDomains.length,
    goals: enrolledDomains,
  });
}

export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const result = setGoalSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid goal data", "VALIDATION_ERROR", 422);
  }

  const { roleId, isPrimary, targetDate } = result.data;

  const enrollmentResult = await enrollStudentDomain({
    studentProfileId: profile.id,
    roleId,
    isPrimary,
    targetDate: targetDate ? new Date(targetDate) : undefined,
  });

  const completion = await calculateProfileCompletion(profile.id);

  return apiSuccess({
    ...enrollmentResult,
    completion,
  });
}
