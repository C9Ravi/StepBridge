import { getSession } from "@/lib/auth/session";
import { assertSuperAdmin } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSession();
  try {
    assertSuperAdmin(session);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return apiError(message, "FORBIDDEN", 403);
  }

  const [institutions, companies] = await Promise.all([
    prisma.institution.findMany({
      where: { verificationStatus: "PENDING" },
      include: {
        memberships: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      where: { verificationStatus: "PENDING" },
      include: {
        memberships: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return apiSuccess({
    pendingInstitutions: institutions,
    pendingCompanies: companies,
  });
}
