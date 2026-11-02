import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthenticated", "UNAUTHENTICATED", 401);

  const { id } = await params;
  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification || notification.userId !== session.userId) {
    return apiError("Notification not found", "NOT_FOUND", 404);
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return apiSuccess({ notification: updated });
}
