import { prisma } from "@/lib/db/prisma";

export interface PlanDefinition {
  id: string;
  name: string;
  targetRole: "STUDENT" | "COLLEGE_ADMIN" | "RECRUITER";
  priceInr: number;
  interval: "MONTHLY" | "ANNUALLY";
  features: string[];
  recommended?: boolean;
}

export const BILLING_PLANS: PlanDefinition[] = [
  {
    id: "STUDENT_FREE",
    name: "Student Starter",
    targetRole: "STUDENT",
    priceInr: 0,
    interval: "MONTHLY",
    features: [
      "1 Resume Upload & Verification",
      "Access to 12 Technology Career Blueprints",
      "Core 8-Week Actionable Roadmaps",
      "Browse & Apply to Campus Placement Drives",
      "Up to 2 Skill Verification Assessments",
    ],
  },
  {
    id: "STUDENT_PREMIUM",
    name: "Student Pro Career Pass",
    targetRole: "STUDENT",
    priceInr: 499,
    interval: "MONTHLY",
    recommended: true,
    features: [
      "Unlimited Resume Revisions & Version History",
      "Full AI ATS Scoring & Real-time Gap Feedback",
      "Interactive 24/7 AI Career Guidance Assistant",
      "Unlimited Skill Verification Assessments",
      "Priority Candidate Ranking for Recruiter Discovery",
    ],
  },
  {
    id: "COLLEGE_PILOT",
    name: "Institutional Campus Placement License",
    targetRole: "COLLEGE_ADMIN",
    priceInr: 49999,
    interval: "ANNUALLY",
    recommended: true,
    features: [
      "Full Institutional TPO Placement Portal",
      "Manage Up to 1,500 Registered Engineering Students",
      "Automated CSV Student Bulk Import & Account Provisioning",
      "Drive Builder with Live Eligibility Filtering & Cutoff Preview",
      "Cohort Skill Gap Heatmaps & Confirmed Outcomes Tracker",
      "Direct In-App Student Broadcast Announcements",
    ],
  },
  {
    id: "RECRUITER_PRO",
    name: "Enterprise Talent & Campus Hiring License",
    targetRole: "RECRUITER",
    priceInr: 14999,
    interval: "MONTHLY",
    recommended: true,
    features: [
      "Candidate Talent Discovery with Verified Skill Match",
      "Filter by CGPA, Verified Level, and Institutional Match",
      "Multi-stage Recruitment Kanban Pipeline",
      "Built-in Google Meet Interview Scheduling & Evaluation Scorecards",
      "Company Confidential Recruiter Notes & Audit Trail",
      "Unlimited Active Job & Internship Postings",
    ],
  },
];

export async function getAvailablePlans(role?: string): Promise<PlanDefinition[]> {
  if (!role) return BILLING_PLANS;
  return BILLING_PLANS.filter((p) => p.targetRole === role);
}

export async function getActiveSubscription(params: {
  userId?: string;
  institutionId?: string;
  companyId?: string;
}) {
  const where: Record<string, string> = { status: "ACTIVE" };
  if (params.institutionId) where.institutionId = params.institutionId;
  else if (params.companyId) where.companyId = params.companyId;
  else if (params.userId) where.userId = params.userId;

  return prisma.subscription.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    include: { payments: { take: 5, orderBy: { createdAt: "desc" } } },
  });
}

export async function createOrUpdateSubscription(params: {
  userId?: string;
  institutionId?: string;
  companyId?: string;
  planTier: string;
  billingInterval?: "MONTHLY" | "ANNUALLY";
  providerPaymentId?: string;
}) {
  const plan = BILLING_PLANS.find((p) => p.id === params.planTier);
  if (!plan) {
    throw new Error(`Invalid plan tier: ${params.planTier}`);
  }

  const interval = params.billingInterval || plan.interval;
  const durationMonths = interval === "ANNUALLY" ? 12 : 1;
  const periodEnd = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    // Upsert subscription
    const subscription = await tx.subscription.create({
      data: {
        userId: params.userId || null,
        institutionId: params.institutionId || null,
        companyId: params.companyId || null,
        planTier: params.planTier,
        status: "ACTIVE",
        billingInterval: interval,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
    });

    // Record payment if price > 0
    if (plan.priceInr > 0) {
      await tx.paymentRecord.create({
        data: {
          subscriptionId: subscription.id,
          userId: params.userId || null,
          amount: plan.priceInr,
          currency: "INR",
          status: "SUCCESS",
          provider: "RAZORPAY",
          providerPaymentId: params.providerPaymentId || `pay_sim_${Date.now()}`,
          receiptUrl: `https://stepbridge.in/receipts/${subscription.id}`,
        },
      });
    }

    return subscription;
  });
}
