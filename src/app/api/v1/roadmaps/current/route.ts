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

  const roadmap = await prisma.roadmap.findFirst({
    where: { studentProfileId: profile.id, status: "ACTIVE" },
    include: {
      role: true,
      milestones: {
        orderBy: { weekNumber: "asc" },
        include: {
          tasks: {
            include: { skill: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!roadmap) {
    return apiError("No active roadmap found. Please generate a roadmap first.", "NOT_FOUND", 404);
  }

  let totalTasks = 0;
  let completedTasks = 0;

  for (const m of roadmap.milestones) {
    for (const t of m.tasks) {
      totalTasks++;
      if (t.status === "COMPLETED") completedTasks++;
    }
  }

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return apiSuccess({
    roadmap: {
      ...roadmap,
      totalTasks,
      completedTasks,
      progressPercentage,
    },
  });
}
