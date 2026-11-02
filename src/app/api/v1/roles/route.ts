import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { getDomainCatalog } from "@/modules/career/domainService";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search")?.toLowerCase();

  const session = await getSession();
  let studentProfileId: string | undefined;

  if (session && session.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    studentProfileId = profile?.id;
  }

  let domains = await getDomainCatalog(studentProfileId);

  if (category && category !== "All") {
    domains = domains.filter((d) => d.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    domains = domains.filter(
      (d) =>
        d.title.toLowerCase().includes(search) ||
        d.description.toLowerCase().includes(search) ||
        d.topSkills.some((s) => s.toLowerCase().includes(search))
    );
  }

  return apiSuccess({
    totalCount: domains.length,
    roles: domains,
  });
}
