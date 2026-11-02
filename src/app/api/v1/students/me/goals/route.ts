import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { calculateProfileCompletion } from "@/modules/students/profileService";

const setGoalSchema = z.object({
  roleId: z.string().uuid(),
  targetDate: z.string().datetime().optional(),
});

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

  const { roleId, targetDate } = result.data;
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return apiError("Role not found", "NOT_FOUND", 404);

  // Archive prior primary goals and archive prior roadmaps (PRD 12.6)
  await prisma.$transaction([
    prisma.careerGoal.updateMany({
      where: { studentProfileId: profile.id, isPrimary: true },
      data: { isPrimary: false, status: "ARCHIVED" },
    }),
    prisma.roadmap.updateMany({
      where: { studentProfileId: profile.id, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    }),
    prisma.careerGoal.create({
      data: {
        studentProfileId: profile.id,
        roleId,
        isPrimary: true,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: "ACTIVE",
      },
    }),
  ]);

  const completion = await calculateProfileCompletion(profile.id);

  return apiSuccess({
    message: `Primary career goal updated to ${role.title}. Active roadmaps have been archived.`,
    role,
    completion,
  });
}
