import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { executeAiTask } from "@/lib/ai/provider";
import { z } from "zod";

const submitAnswerSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  answerText: z.string().min(10, "Please provide a more detailed answer"),
});

const feedbackSchema = z.object({
  score: z.number().min(0).max(100),
  rubric: z.object({
    technicalCorrectness: z.enum(["EXCELLENT", "GOOD", "ADEQUATE", "NEEDS_IMPROVEMENT"]),
    structureAndClarity: z.enum(["EXCELLENT", "GOOD", "ADEQUATE", "NEEDS_IMPROVEMENT"]),
    depthOfExplanation: z.enum(["EXCELLENT", "GOOD", "ADEQUATE", "NEEDS_IMPROVEMENT"]),
  }),
  positivePoints: z.array(z.string()),
  missingConcepts: z.array(z.string()),
  constructiveAdvice: z.string(),
  exampleBetterResponse: z.string(),
});

export async function POST(
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
  const body = await req.json();
  const result = submitAnswerSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid answer submission", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  const { questionText, answerText } = result.data;

  const prompt = `You are a friendly, senior engineering interview mentor. Evaluate this candidate's interview answer.
Question: "${questionText}"
Candidate's Answer: "${answerText}"

Provide constructive feedback strictly adhering to this JSON schema:
{
  "score": number (0-100),
  "rubric": {
    "technicalCorrectness": "EXCELLENT" | "GOOD" | "ADEQUATE" | "NEEDS_IMPROVEMENT",
    "structureAndClarity": "EXCELLENT" | "GOOD" | "ADEQUATE" | "NEEDS_IMPROVEMENT",
    "depthOfExplanation": "EXCELLENT" | "GOOD" | "ADEQUATE" | "NEEDS_IMPROVEMENT"
  },
  "positivePoints": string[],
  "missingConcepts": string[],
  "constructiveAdvice": string,
  "exampleBetterResponse": string
}
Never claim to be a final hiring authority; focus purely on constructive learning.`;

  const fallbackFeedback = {
    score: Math.min(90, Math.max(50, 40 + answerText.length / 10)),
    rubric: {
      technicalCorrectness: "GOOD" as const,
      structureAndClarity: "GOOD" as const,
      depthOfExplanation: "ADEQUATE" as const,
    },
    positivePoints: [
      "Directly tackled the core question without straying off-topic.",
      "Clear explanation of the high-level mechanism and components.",
    ],
    missingConcepts: [
      "Could elaborate further on edge cases, failure scenarios, and performance trade-offs.",
      "Provide a concrete 1-line real-world engineering example from personal projects.",
    ],
    constructiveAdvice: "Use the STAR method (Situation, Task, Action, Result) even in conceptual questions by relating theory to practical systems you have built.",
    exampleBetterResponse: "Structure your response into 3 parts: definition, underlying mechanism, and real-world system trade-offs.",
  };

  const aiResult = await executeAiTask({
    userId: session!.userId,
    feature: "interview",
    prompt,
    schema: feedbackSchema,
    deterministicFallback: () => fallbackFeedback,
  });

  return apiSuccess({
    sessionId: id,
    feedback: aiResult.data,
    provider: aiResult.provider,
  });
}
