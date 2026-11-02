import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { saveAssessmentAnswer } from "@/modules/career/assessmentService";
import { z } from "zod";

const answerSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswer: z.number().int().min(0).max(10),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  try {
    assertStudent(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const { id } = await params;
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session!.userId },
  });
  if (!profile) return apiError("Profile not found", "NOT_FOUND", 404);

  const body = await req.json();
  const result = answerSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid answer payload", "VALIDATION_ERROR", 422);
  }

  try {
    const saved = await saveAssessmentAnswer({
      attemptId: id,
      questionId: result.data.questionId,
      selectedAnswer: result.data.selectedAnswer,
      studentProfileId: profile.id,
    });
    return apiSuccess({ answer: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save answer";
    return apiError(msg, "SAVE_ANSWER_FAILED", 400);
  }
}
