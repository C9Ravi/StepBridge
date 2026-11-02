import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { projectSchema } from "@/lib/validation/schemas";
import { calculateProfileCompletion } from "@/modules/students/profileService";

export async function PATCH(
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

  // Anti-IDOR check
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.studentProfileId !== profile.id) {
    return apiError("Project not found", "NOT_FOUND", 404);
  }

  const body = await req.json();
  const result = projectSchema.safeParse(body);
  if (!result.success) {
    return apiError("Validation failed", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      title: result.data.title,
      description: result.data.description,
      technologies: result.data.technologies,
      url: result.data.url || null,
      startDate: result.data.startDate ? new Date(result.data.startDate) : null,
      endDate: result.data.endDate ? new Date(result.data.endDate) : null,
    },
  });

  return apiSuccess({ project: updated });
}

export async function DELETE(
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

  // Anti-IDOR check
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.studentProfileId !== profile.id) {
    return apiError("Project not found", "NOT_FOUND", 404);
  }

  await prisma.project.delete({ where: { id } });
  const completion = await calculateProfileCompletion(profile.id);

  return apiSuccess({ message: "Project deleted successfully", completion });
}
