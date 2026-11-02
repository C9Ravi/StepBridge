import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { checkOpportunityEligibility } from "@/modules/opportunities/eligibilityService";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type"); // FULL_TIME, INTERNSHIP
  const search = searchParams.get("search");

  let studentProfileId: string | null = null;
  if (session && session.role === "STUDENT") {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    studentProfileId = studentProfile?.id || null;
  }

  const opportunities = await prisma.opportunity.findMany({
    where: {
      status: "PUBLISHED",
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { company: { name: { contains: search } } },
              { location: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      company: {
        select: { id: true, name: true, industry: true, website: true },
      },
      skills: {
        include: { skill: true },
      },
      eligibilityRules: true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // If viewed by student, enrich each opportunity with eligibility and match details
  const enrichedOpportunities = await Promise.all(
    opportunities.map(async (opp) => {
      let eligibilityInfo = null;
      if (studentProfileId) {
        try {
          eligibilityInfo = await checkOpportunityEligibility({
            opportunityId: opp.id,
            studentProfileId,
          });
        } catch {
          // Ignore
        }
      }

      return {
        ...opp,
        eligibility: eligibilityInfo,
      };
    })
  );

  return apiSuccess({ opportunities: enrichedOpportunities });
}
