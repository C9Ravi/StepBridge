import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createOrUpdateSubscription } from "@/modules/billing/billingService";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  try {
    const body = await req.json();
    const { planTier, billingInterval, providerPaymentId } = body;

    if (!planTier) {
      return apiError("Missing planTier parameter", "VALIDATION_ERROR", 422);
    }

    const sub = await createOrUpdateSubscription({
      userId: session.userId,
      institutionId: session.tenantType === "INSTITUTION" ? session.tenantId : undefined,
      companyId: session.tenantType === "COMPANY" ? session.tenantId : undefined,
      planTier,
      billingInterval,
      providerPaymentId,
    });

    return apiSuccess({
      subscription: sub,
      message: `Successfully subscribed to ${planTier}!`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return apiError(message, "CHECKOUT_ERROR", 400);
  }
}
