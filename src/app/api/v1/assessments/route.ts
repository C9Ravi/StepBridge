import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const assessments = await prisma.assessment.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      topic: true,
      durationMinutes: true,
      questionCount: true,
    },
    orderBy: { topic: "asc" },
  });

  return apiSuccess({ assessments });
}
