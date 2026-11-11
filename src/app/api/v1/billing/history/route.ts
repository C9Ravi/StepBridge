import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getActiveSubscription } from "@/modules/billing/billingService";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  const subscription = await getActiveSubscription({
    userId: session.userId,
    institutionId: session.tenantType === "INSTITUTION" ? session.tenantId : undefined,
    companyId: session.tenantType === "COMPANY" ? session.tenantId : undefined,
  });

  return apiSuccess({
    subscription,
    hasActiveSubscription: !!subscription,
  });
}
