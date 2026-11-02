import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { processResumeAnalysis } from "@/modules/resumes/resumeService";

export async function POST(
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
    include: {
      careerGoals: {
        where: { isPrimary: true, status: "ACTIVE" },
        include: { role: true },
      },
    },
  });
  if (!profile) return apiError("Profile not found", "NOT_FOUND", 404);

  const resume = await prisma.resume.findUnique({
    where: { id },
  });

  if (!resume || resume.studentProfileId !== profile.id) {
    return apiError("Resume not found", "NOT_FOUND", 404);
  }

  try {
    const targetRole = profile.careerGoals[0]?.role.title || "Full Stack Engineer";
    const result = await processResumeAnalysis({
      userId: session!.userId,
      resumeId: id,
      targetRoleTitle: targetRole,
    });

    return apiSuccess({
      analysisId: result.analysis.id,
      atsScore: result.result.atsScore,
      roleAlignmentScore: result.result.roleAlignmentScore,
      structuredResult: result.result,
      provider: result.provider,
    });
  } catch (err) {
    console.error("Resume analysis execution error:", err);
    return apiError("Failed to process resume analysis", "AI_EXECUTION_ERROR", 500);
  }
}
