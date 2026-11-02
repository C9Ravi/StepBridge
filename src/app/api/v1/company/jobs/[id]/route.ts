import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCompanyRecruiter } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  let companyId: string;
  try {
    companyId = assertCompanyRecruiter(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const { id } = await params;
  const job = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      skills: { include: { skill: true } },
      eligibilityRules: true,
      _count: { select: { applications: true } },
    },
  });

  // Cross-company access check (PRD 11.2)
  if (!job || job.companyId !== companyId) {
    return apiError("Job posting not found in your company scope", "NOT_FOUND", 404);
  }

  return apiSuccess({ job });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  let companyId: string;
  try {
    companyId = assertCompanyRecruiter(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const { id } = await params;
  const job = await prisma.opportunity.findUnique({ where: { id } });
  if (!job || job.companyId !== companyId) {
    return apiError("Job posting not found", "NOT_FOUND", 404);
  }

  const body = await req.json();
  const updated = await prisma.opportunity.update({
    where: { id },
    data: {
      title: body.title !== undefined ? body.title : job.title,
      description: body.description !== undefined ? body.description : job.description,
      location: body.location !== undefined ? body.location : job.location,
      salaryRange: body.salaryRange !== undefined ? body.salaryRange : job.salaryRange,
      deadline: body.deadline ? new Date(body.deadline) : job.deadline,
    },
  });

  return apiSuccess({ job: updated });
}
