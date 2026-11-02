import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCompanyRecruiter } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function POST(
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

  // PRD 12.3: Verification gate
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || company.verificationStatus !== "APPROVED") {
    return apiError(
      "Your company account is pending verification. Only verified companies can publish active opportunities.",
      "UNVERIFIED_COMPANY",
      403
    );
  }

  const job = await prisma.opportunity.findUnique({ where: { id } });
  if (!job || job.companyId !== companyId) {
    return apiError("Job posting not found", "NOT_FOUND", 404);
  }

  const published = await prisma.opportunity.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session!.userId,
      tenantType: "COMPANY",
      tenantId: companyId,
      action: "PUBLISH_JOB",
      resource: `Opportunity:${id}`,
      metadata: JSON.stringify({ title: job.title }),
    },
  });

  return apiSuccess({ job: published });
}
