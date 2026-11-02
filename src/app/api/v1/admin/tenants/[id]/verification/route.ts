import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertSuperAdmin } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const verifyTenantSchema = z.object({
  tenantType: z.enum(["INSTITUTION", "COMPANY"]),
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  try {
    assertSuperAdmin(session);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return apiError(message, "FORBIDDEN", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const result = verifyTenantSchema.safeParse(body);

  if (!result.success) {
    return apiError("Invalid verification parameters", "VALIDATION_ERROR", 422);
  }

  const { tenantType, action, reason } = result.data;
  if (action === "REJECT" && !reason) {
    return apiError("A rejection reason is required", "VALIDATION_ERROR", 422);
  }

  const verificationStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  if (tenantType === "INSTITUTION") {
    const institution = await prisma.institution.findUnique({ where: { id } });
    if (!institution) return apiError("Institution not found", "NOT_FOUND", 404);

    const updated = await prisma.institution.update({
      where: { id },
      data: {
        verificationStatus,
        rejectionReason: reason || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session!.userId,
        tenantType: "INSTITUTION",
        tenantId: id,
        action: `TENANT_${verificationStatus}`,
        resource: `Institution:${id}`,
        metadata: JSON.stringify({ reason }),
      },
    });

    return apiSuccess({ institution: updated });
  } else {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return apiError("Company not found", "NOT_FOUND", 404);

    const updated = await prisma.company.update({
      where: { id },
      data: {
        verificationStatus,
        rejectionReason: reason || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session!.userId,
        tenantType: "COMPANY",
        tenantId: id,
        action: `TENANT_${verificationStatus}`,
        resource: `Company:${id}`,
        metadata: JSON.stringify({ reason }),
      },
    });

    return apiSuccess({ company: updated });
  }
}
