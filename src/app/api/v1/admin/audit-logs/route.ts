import { getSession } from "@/lib/auth/session";
import { assertSuperAdmin } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSession();
  try {
    assertSuperAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const auditLogs = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return apiSuccess({ auditLogs });
}
