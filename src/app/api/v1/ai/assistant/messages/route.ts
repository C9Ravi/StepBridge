import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { executeAiTask } from "@/lib/ai/provider";
import { calculateStudentReadiness } from "@/modules/career/readinessService";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string().min(2).max(1000),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  try {
    assertStudent(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session!.userId },
    include: {
      user: { select: { name: true } },
      careerGoals: { where: { isPrimary: true, status: "ACTIVE" }, include: { role: true } },
    },
  });
  if (!profile) return apiError("Profile not found", "NOT_FOUND", 404);

  // PRD 13.8: Check monthly quota (15 messages / month for free student)
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlyUsageCount = await prisma.aiUsageEvent.count({
    where: {
      userId: session!.userId,
      feature: "assistant",
      createdAt: { gte: startOfMonth },
    },
  });

  const MONTHLY_LIMIT = 15;
  if (monthlyUsageCount >= MONTHLY_LIMIT) {
    return apiError(
      `Monthly AI Assistant limit reached (${MONTHLY_LIMIT}/${MONTHLY_LIMIT} messages). Quota resets on the 1st of next month.`,
      "QUOTA_EXCEEDED",
      429
    );
  }

  const body = await req.json();
  const result = messageSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid message format", "VALIDATION_ERROR", 422);
  }

  const { message } = result.data;

  // Retrieve current student context
  const readiness = await calculateStudentReadiness(profile.id);
  const targetRole = profile.careerGoals[0]?.role.title || "Software Engineer";
  const gaps = (readiness?.skillGaps || [])
    .filter((g) => g.gapSize > 0)
    .map((g) => `${g.skillName} (Current: ${g.currentEvidenceLevel}, Target: ${g.requiredLevel})`)
    .join(", ");

  const systemGrounding = `You are StepBridge AI Career Mentor, grounded directly in the student's profile:
- Student Name: ${profile.user.name}
- Target Role: ${targetRole}
- Overall Readiness Score: ${readiness?.overallScore || 0}%
- Top Skill Gaps: ${gaps || "None identified"}
- Rules: Never fabricate external job offers or guarantee hiring. Ground all advice in concrete engineering steps and measurable preparation. Keep responses concise, supportive, and actionable.`;

  const prompt = `${systemGrounding}\n\nStudent question: "${message}"\n\nProvide a clear, helpful response:`;

  const fallbackResponse = `Based on your goal of becoming a **${targetRole}** with a readiness score of **${readiness?.overallScore || 0}%**, here is actionable guidance:

1. **Focus on Verified Evidence**: Your primary skill gaps are in: ${gaps || "Core System Design and Database Architecture"}.
2. **Next Steps**:
   - Complete the targeted topic assessment to raise your verified evidence level.
   - Build a project feature that directly demonstrates these capabilities on GitHub.
   - Update your active roadmap milestones to track weekly progress.`;

  const aiResult = await executeAiTask({
    userId: session!.userId,
    feature: "assistant",
    prompt,
    deterministicFallback: () => fallbackResponse,
  });

  return apiSuccess({
    response: aiResult.data,
    quota: {
      used: monthlyUsageCount + 1,
      limit: MONTHLY_LIMIT,
      remaining: Math.max(0, MONTHLY_LIMIT - (monthlyUsageCount + 1)),
    },
    provider: aiResult.provider,
  });
}
