import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { projectSchema } from "@/lib/validation/schemas";
import { calculateProfileCompletion } from "@/modules/students/profileService";

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

  if (!profile) {
    return apiError("Student profile not found", "NOT_FOUND", 404);
  }

  const body = await req.json();
  const result = projectSchema.safeParse(body);

  if (!result.success) {
    return apiError(
      "Validation failed",
      "VALIDATION_ERROR",
      422,
      result.error.flatten().fieldErrors
    );
  }

  const project = await prisma.project.create({
    data: {
      studentProfileId: profile.id,
      title: result.data.title,
      description: result.data.description,
      technologies: result.data.technologies,
      url: result.data.url || null,
      startDate: result.data.startDate ? new Date(result.data.startDate) : null,
      endDate: result.data.endDate ? new Date(result.data.endDate) : null,
    },
  });

  const completion = await calculateProfileCompletion(profile.id);

  return apiSuccess({ project, completion }, 201);
}
