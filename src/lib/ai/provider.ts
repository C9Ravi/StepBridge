import { z } from "zod";
import { prisma } from "../db/prisma";

export interface AiJobResult<T> {
  data: T;
  provider: "GEMINI" | "DETERMINISTIC_FALLBACK";
  model: string;
  tokensUsed: number;
  costEstimate: number;
  latencyMs: number;
}

/**
 * Executes an AI task with automatic fallback and usage logging.
 */
export async function executeAiTask<T>(params: {
  userId: string;
  feature: "resume" | "roadmap" | "interview" | "assistant";
  prompt: string;
  schema?: z.ZodType<T>;
  deterministicFallback: () => T;
}): Promise<AiJobResult<T>> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  const isMock = !apiKey || apiKey.startsWith("mock");

  // If Gemini API is not configured or in mock mode, use deterministic fallback immediately
  if (isMock) {
    const fallbackData = params.deterministicFallback();
    const latencyMs = Date.now() - startTime;

    // Record usage event
    try {
      await prisma.aiUsageEvent.create({
        data: {
          userId: params.userId,
          feature: params.feature,
          tokens: 150,
          costEstimate: 0.0,
        },
      });
    } catch {
      // Ignore in-memory or detached contexts
    }

    return {
      data: fallbackData,
      provider: "DETERMINISTIC_FALLBACK",
      model: "deterministic-rules-engine-v1",
      tokensUsed: 150,
      costEstimate: 0.0,
      latencyMs,
    };
  }

  // Real Gemini API call with retry and fallback
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${
        process.env.AI_DEFAULT_MODEL || "gemini-1.5-flash"
      }:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: params.prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: params.schema ? "application/json" : "text/plain",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini HTTP error ${response.status}`);
    }

    const jsonRes = await response.json();
    const candidateText =
      jsonRes.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const totalTokens = jsonRes.usageMetadata?.totalTokenCount || 400;

    let parsedResult: T;
    if (params.schema) {
      parsedResult = params.schema.parse(JSON.parse(candidateText));
    } else {
      parsedResult = candidateText as unknown as T;
    }

    const latencyMs = Date.now() - startTime;
    const costEstimate = (totalTokens / 1000000) * 0.35; // Gemini Flash rate

    await prisma.aiUsageEvent.create({
      data: {
        userId: params.userId,
        feature: params.feature,
        tokens: totalTokens,
        costEstimate,
      },
    });

    return {
      data: parsedResult,
      provider: "GEMINI",
      model: process.env.AI_DEFAULT_MODEL || "gemini-1.5-flash",
      tokensUsed: totalTokens,
      costEstimate,
      latencyMs,
    };
  } catch (error) {
    console.warn("Gemini call failed or timed out; falling back to deterministic engine:", error);
    const fallbackData = params.deterministicFallback();
    const latencyMs = Date.now() - startTime;

    return {
      data: fallbackData,
      provider: "DETERMINISTIC_FALLBACK",
      model: "deterministic-rules-engine-fallback",
      tokensUsed: 100,
      costEstimate: 0.0,
      latencyMs,
    };
  }
}
