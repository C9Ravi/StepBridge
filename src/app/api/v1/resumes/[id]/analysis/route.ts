import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET(
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

  const resume = await prisma.resume.findUnique({
    where: { id },
  });

  if (!resume || resume.studentProfileId !== profile.id) {
    return apiError("Resume not found", "NOT_FOUND", 404);
  }

  const latestAnalysis = await prisma.resumeAnalysis.findFirst({
    where: { resumeId: id },
    orderBy: { createdAt: "desc" },
  });

  if (!latestAnalysis) {
    return apiError("No analysis found for this resume. Please analyze it first.", "NOT_FOUND", 404);
  }

  const parsed = JSON.parse(latestAnalysis.structuredResult);

  return apiSuccess({
    analysisId: latestAnalysis.id,
    atsScore: latestAnalysis.atsScore,
    status: latestAnalysis.status,
    result: parsed,
    createdAt: latestAnalysis.createdAt,
  });
}
