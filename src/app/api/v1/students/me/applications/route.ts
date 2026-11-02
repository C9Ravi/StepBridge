import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

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

  const applications = await prisma.application.findMany({
    where: { studentId: profile.id },
    include: {
      opportunity: {
        include: { company: true },
      },
      resume: {
        select: { id: true, fileName: true, fileType: true },
      },
      stageEvents: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  return apiSuccess({ applications });
}
