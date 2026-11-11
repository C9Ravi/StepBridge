import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthenticated", "UNAUTHENTICATED", 401);
  }

  await prisma.notification.updateMany({
    where: { userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  });

  return apiSuccess({ success: true, message: "All notifications marked as read" });
}
