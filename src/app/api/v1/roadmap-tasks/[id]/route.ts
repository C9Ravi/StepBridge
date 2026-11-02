import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateTaskSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED"]),
  notes: z.string().max(1000).optional(),
});

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

  const task = await prisma.roadmapTask.findUnique({
    where: { id },
    include: { milestone: { include: { roadmap: true } } },
  });

  // Anti-IDOR: verify task belongs to current student's roadmap
  if (!task || task.milestone.roadmap.studentProfileId !== profile.id) {
    return apiError("Task not found", "NOT_FOUND", 404);
  }

  const body = await req.json();
  const result = updateTaskSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid task update payload", "VALIDATION_ERROR", 422);
  }

  const updatedTask = await prisma.roadmapTask.update({
    where: { id },
    data: {
      status: result.data.status,
      completedAt: result.data.status === "COMPLETED" ? new Date() : null,
      notes: result.data.notes !== undefined ? result.data.notes : task.notes,
    },
  });

  return apiSuccess({ task: updatedTask });
}
