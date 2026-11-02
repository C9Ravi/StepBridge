import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { calculateProfileCompletion } from "@/modules/students/profileService";

const addSkillSchema = z.object({
  skillId: z.string().uuid(),
  selfLevel: z.number().min(1).max(5),
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

  const studentSkills = await prisma.studentSkill.findMany({
    where: { studentProfileId: profile.id },
    include: { skill: true },
    orderBy: { verifiedLevel: "desc" },
  });

  return apiSuccess({ studentSkills });
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
  const result = addSkillSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid skill data", "VALIDATION_ERROR", 422);
  }

  const { skillId, selfLevel } = result.data;

  const studentSkill = await prisma.studentSkill.upsert({
    where: {
      studentProfileId_skillId: {
        studentProfileId: profile.id,
        skillId,
      },
    },
    update: { selfLevel },
    create: {
      studentProfileId: profile.id,
      skillId,
      selfLevel,
      verifiedLevel: 0,
      evidenceMetadata: JSON.stringify({ source: "Self-declared" }),
    },
    include: { skill: true },
  });

  const completion = await calculateProfileCompletion(profile.id);

  return apiSuccess({ studentSkill, completion });
}
