import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { compareDomains } from "@/modules/career/domainService";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slugsParam = searchParams.get("slugs");

  if (!slugsParam) {
    return apiError("Please provide domain slugs to compare (e.g. ?slugs=fde,ai-ml,backend)", "VALIDATION_ERROR", 400);
  }

  const slugs = slugsParam.split(",").map((s) => s.trim()).filter(Boolean);

  if (slugs.length < 2 || slugs.length > 4) {
    return apiError("Please select between 2 and 4 domains to compare", "VALIDATION_ERROR", 400);
  }

  const session = await getSession();
  let studentProfileId: string | undefined;

  if (session && session.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    studentProfileId = profile?.id;
  }

  const comparison = await compareDomains(slugs, studentProfileId);

  return apiSuccess(comparison);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slugs = Array.isArray(body.slugs) ? body.slugs : [];

    if (slugs.length < 2 || slugs.length > 4) {
      return apiError("Please select between 2 and 4 domains to compare", "VALIDATION_ERROR", 400);
    }

    const session = await getSession();
    let studentProfileId: string | undefined;

    if (session && session.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      studentProfileId = profile?.id;
    }

    const comparison = await compareDomains(slugs, studentProfileId);
    return apiSuccess(comparison);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return apiError(msg, "BAD_REQUEST", 400);
  }
}
