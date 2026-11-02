import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthenticated", "UNAUTHENTICATED", 401);
  }

  const { id } = await params;

  // Anti-IDOR: verify session belongs to user
  const targetSession = await prisma.session.findUnique({
    where: { id },
  });

  if (!targetSession || targetSession.userId !== session.userId) {
    return apiError("Session not found", "NOT_FOUND", 404);
  }

  await prisma.session.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return apiSuccess({ message: "Session revoked successfully" });
}
