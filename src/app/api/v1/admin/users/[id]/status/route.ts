import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertSuperAdmin } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: z.string().min(3),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  try {
    assertSuperAdmin(session);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return apiError(message, "FORBIDDEN", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const result = updateStatusSchema.safeParse(body);

  if (!result.success) {
    return apiError("Invalid status or missing reason", "VALIDATION_ERROR", 422);
  }

  const { status, reason } = result.data;

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    return apiError("User not found", "NOT_FOUND", 404);
  }

  // If suspending, also revoke active sessions immediately
  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (status === "SUSPENDED") {
      await tx.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: session!.userId,
        action: `USER_${status}`,
        resource: `User:${id}`,
        metadata: JSON.stringify({ reason }),
      },
    });

    return user;
  });

  return apiSuccess({ user: updatedUser });
}
