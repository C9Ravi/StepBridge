import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { calculateStudentReadiness } from "@/modules/career/readinessService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const { id } = await params;

  const profile = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      batch: { include: { department: true } },
      education: true,
      skills: { include: { skill: true } },
      projects: true,
      certifications: true,
      careerGoals: { where: { isPrimary: true }, include: { role: true } },
      resumes: { orderBy: { createdAt: "desc" }, take: 1 },
      applications: {
        include: {
          opportunity: { include: { company: true } },
          stageEvents: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  // PRD 11.2 & FR-COL-05: Strict institution scoping check
  if (!profile || profile.institutionId !== institutionId) {
    return apiError("Student record not found in this institution scope", "NOT_FOUND", 404);
  }

  const readiness = await calculateStudentReadiness(profile.id);

  return apiSuccess({
    student: profile,
    readiness,
  });
}
