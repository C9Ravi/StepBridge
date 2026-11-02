import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const roles = await prisma.role.findMany({
    where: { active: true },
    include: {
      skills: {
        include: { skill: true },
        orderBy: { importanceWeight: "desc" },
      },
    },
    orderBy: { title: "asc" },
  });

  return apiSuccess({ roles });
}
