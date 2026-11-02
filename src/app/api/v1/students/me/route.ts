import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { studentProfileUpdateSchema } from "@/lib/validation/schemas";
import { calculateProfileCompletion } from "@/modules/students/profileService";

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
    include: {
      user: { select: { id: true, name: true, email: true, emailVerifiedAt: true } },
      institution: { select: { id: true, name: true, city: true, state: true } },
      batch: { select: { id: true, graduationYear: true, label: true } },
      education: true,
      skills: {
        include: { skill: true },
      },
      projects: true,
      certifications: true,
      careerGoals: {
        where: { isPrimary: true, status: "ACTIVE" },
        include: { role: true },
      },
      resumes: {
        orderBy: { createdAt: "desc" },
        include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  if (!profile) {
    return apiError("Student profile not found", "NOT_FOUND", 404);
  }

  const completion = await calculateProfileCompletion(profile.id);

  return apiSuccess({
    profile,
    completion,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  try {
    assertStudent(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const body = await req.json();
  const result = studentProfileUpdateSchema.safeParse(body);

  if (!result.success) {
    return apiError(
      "Validation failed",
      "VALIDATION_ERROR",
      422,
      result.error.flatten().fieldErrors
    );
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session!.userId },
  });

  if (!profile) {
    return apiError("Student profile not found", "NOT_FOUND", 404);
  }

  const updated = await prisma.studentProfile.update({
    where: { id: profile.id },
    data: result.data,
  });

  const completion = await calculateProfileCompletion(profile.id);

  return apiSuccess({
    profile: updated,
    completion,
  });
}
