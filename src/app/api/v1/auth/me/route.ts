import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthenticated", "UNAUTHENTICATED", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      studentProfile: {
        select: {
          id: true,
          headline: true,
          visibility: true,
          completionPercentage: true,
          institutionId: true,
          batchId: true,
        },
      },
      institutionMemberships: {
        include: { institution: true },
      },
      companyMemberships: {
        include: { company: true },
      },
    },
  });

  if (!user) {
    return apiError("User not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ user });
}
