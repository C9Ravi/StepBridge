import { NextRequest } from "next/server";
import { getSession, clearSessionCookie, revokeServerSessions } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session) {
    try {
      await revokeServerSessions(session.userId);
      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: "USER_LOGOUT",
          resource: `User:${session.userId}`,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });
    } catch {
      // Ignore audit failure
    }
  }

  await clearSessionCookie();
  return apiSuccess({ message: "Successfully logged out", success: true });
}
