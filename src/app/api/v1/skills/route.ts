import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("q");

    const where: Prisma.SkillWhereInput = { active: true };
    if (category) {
      where.category = category;
    }
    if (search) {
      where.canonicalName = { contains: search };
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { canonicalName: "asc" },
      select: {
        id: true,
        canonicalName: true,
        category: true,
      },
    });

    return apiSuccess({ skills, count: skills.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch skills";
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}
