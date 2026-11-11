import { NextRequest } from "next/server";
import { getAvailablePlans } from "@/modules/billing/billingService";
import { apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || undefined;

  const plans = await getAvailablePlans(role);
  return apiSuccess({ plans });
}
