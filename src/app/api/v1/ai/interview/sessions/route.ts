import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { executeAiTask } from "@/lib/ai/provider";
import { z } from "zod";

const createInterviewSchema = z.object({
  topic: z.string().min(2).max(100),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("INTERMEDIATE"),
});

const interviewQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      topic: z.string(),
      focusArea: z.string(),
      hints: z.array(z.string()),
    })
  ),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  try {
    assertStudent(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const body = await req.json();
  const result = createInterviewSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid interview parameters", "VALIDATION_ERROR", 422);
  }

  const { topic, difficulty } = result.data;

  const prompt = `Generate 3 realistic technical interview questions for a junior engineering candidate on topic: "${topic}" at difficulty level "${difficulty}".
Output format JSON adhering to schema:
{
  "questions": [
    {
      "id": "q1",
      "question": string,
      "topic": "${topic}",
      "focusArea": string,
      "hints": string[]
    }
  ]
}`;

  const fallbackQuestions = [
    {
      id: "q1",
      question: `How does asynchronous execution work in Node.js event loop, and what happens when you block the main thread?`,
      topic,
      focusArea: "Concurrency & Runtime",
      hints: ["Mention libuv thread pool", "Explain timers, I/O polling, and microtask queues"],
    },
    {
      id: "q2",
      question: `Explain how indexing improves database read query performance in PostgreSQL and what are the trade-offs on writes.`,
      topic,
      focusArea: "Data Storage & Query Optimization",
      hints: ["B-Tree structure", "Write amplification / overhead on INSERT and UPDATE"],
    },
    {
      id: "q3",
      question: `Describe how you prevent Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) in a modern web application.`,
      topic,
      focusArea: "Application Security",
      hints: ["Output sanitization & React automatic escaping", "SameSite Same-Origin cookies and CSRF tokens"],
    },
  ];

  const aiResult = await executeAiTask({
    userId: session!.userId,
    feature: "interview",
    prompt,
    schema: interviewQuestionsSchema,
    deterministicFallback: () => ({ questions: fallbackQuestions }),
  });

  // Store in ai_jobs as session reference
  const aiJob = await prisma.aiJob.create({
    data: {
      userId: session!.userId,
      jobType: "INTERVIEW_FEEDBACK",
      status: "COMPLETED",
      resultJson: JSON.stringify(aiResult.data.questions),
    },
  });

  return apiSuccess({
    sessionId: aiJob.id,
    topic,
    difficulty,
    questions: aiResult.data.questions,
    provider: aiResult.provider,
  }, 201);
}
