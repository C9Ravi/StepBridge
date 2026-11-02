import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertSuperAdmin } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateFlagSchema = z.object({
  enabled: z.boolean(),
  configJson: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getSession();
  try {
    assertSuperAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const { key } = await params;
  const body = await req.json();
  const result = updateFlagSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid flag parameters", "VALIDATION_ERROR", 422);
  }

  const flag = await prisma.featureFlag.upsert({
    where: { key },
    update: {
      enabled: result.data.enabled,
      configJson: result.data.configJson,
    },
    create: {
      key,
      enabled: result.data.enabled,
      configJson: result.data.configJson,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session!.userId,
      action: "UPDATE_FEATURE_FLAG",
      resource: `FeatureFlag:${key}`,
      metadata: JSON.stringify(result.data),
    },
  });

  return apiSuccess({ flag });
}
