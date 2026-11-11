import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertSuperAdmin } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  try {
    assertSuperAdmin(session);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return apiError(message, "FORBIDDEN", 403);
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      studentProfile: {
        select: {
          headline: true,
          cgpa: true,
          institution: { select: { name: true } },
        },
      },
      institutionMemberships: {
        select: {
          institution: { select: { name: true } },
        },
      },
      companyMemberships: {
        select: {
          company: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const formattedUsers = users.map((u) => {
    let orgName = "Platform";
    if (u.studentProfile?.institution?.name) {
      orgName = u.studentProfile.institution.name;
    } else if (u.institutionMemberships[0]?.institution?.name) {
      orgName = u.institutionMemberships[0].institution.name;
    } else if (u.companyMemberships[0]?.company?.name) {
      orgName = u.companyMemberships[0].company.name;
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      organization: orgName,
      createdAt: u.createdAt.toISOString().split("T")[0],
    };
  });

  return apiSuccess({
    users: formattedUsers,
    total: formattedUsers.length,
  });
}
