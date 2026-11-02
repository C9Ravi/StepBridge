import { getSession } from "@/lib/auth/session";
import { assertSuperAdmin } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSession();
  try {
    assertSuperAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const events = await prisma.aiUsageEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  let totalTokens = 0;
  let totalCost = 0;
  const featureBreakdown: Record<string, { calls: number; tokens: number; cost: number }> = {};

  for (const ev of events) {
    totalTokens += ev.tokens;
    totalCost += ev.costEstimate;

    const current = featureBreakdown[ev.feature] || { calls: 0, tokens: 0, cost: 0 };
    current.calls++;
    current.tokens += ev.tokens;
    current.cost += ev.costEstimate;
    featureBreakdown[ev.feature] = current;
  }

  return apiSuccess({
    summary: {
      totalCalls: events.length,
      totalTokens,
      totalCostEstimateUsd: Number(totalCost.toFixed(4)),
    },
    featureBreakdown,
    recentEvents: events.slice(0, 20),
  });
}
