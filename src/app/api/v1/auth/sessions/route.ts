import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthenticated", "UNAUTHENTICATED", 401);
  }

  const sessions = await prisma.session.findMany({
    where: {
      userId: session.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      ipAddress: true,
      deviceInfo: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ sessions });
}
