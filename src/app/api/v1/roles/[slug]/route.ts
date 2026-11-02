import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getDomainDetails } from "@/modules/career/domainService";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const session = await getSession();
  let studentProfileId: string | undefined;

  if (session && session.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    studentProfileId = profile?.id;
  }

  const detail = await getDomainDetails(slug, studentProfileId);

  if (!detail) {
    return apiError(`Career domain '${slug}' not found`, "NOT_FOUND", 404);
  }

  return apiSuccess(detail);
}
