import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { roadmapGenerationSchema } from "@/lib/validation/schemas";
import { createStudentRoadmap } from "@/modules/career/roadmapService";

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
  const result = roadmapGenerationSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid roadmap parameters", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  try {
    const generated = await createStudentRoadmap({
      studentProfileId: profile.id,
      userId: session!.userId,
      roleId: result.data.roleId,
      horizonWeeks: result.data.horizonWeeks,
      weeklyHours: result.data.weeklyHours,
      preferences: result.data.preferences,
    });

    return apiSuccess({
      roadmapId: generated.roadmap.id,
      horizonWeeks: generated.roadmap.horizonWeeks,
      details: generated.roadmapDetails,
      provider: generated.provider,
    }, 201);
  } catch (err: unknown) {
    console.error("Roadmap generation error:", err);
    return apiError("Failed to generate career roadmap", "ROADMAP_GEN_FAILED", 500);
  }
}
