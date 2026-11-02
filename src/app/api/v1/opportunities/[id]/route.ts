import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { checkOpportunityEligibility } from "@/modules/opportunities/eligibilityService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const { id } = await params;

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      company: true,
      skills: { include: { skill: true } },
      eligibilityRules: true,
      _count: { select: { applications: true } },
    },
  });

  if (!opportunity) {
    return apiError("Opportunity not found", "NOT_FOUND", 404);
  }

  let eligibility = null;
  let hasApplied = false;

  if (session && session.role === "STUDENT") {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
    });

    if (studentProfile) {
      try {
        eligibility = await checkOpportunityEligibility({
          opportunityId: id,
          studentProfileId: studentProfile.id,
        });

        const existingApp = await prisma.application.findUnique({
          where: {
            opportunityId_studentId: {
              opportunityId: id,
              studentId: studentProfile.id,
            },
          },
        });
        hasApplied = !!existingApp;
      } catch {
        // Ignore
      }
    }
  }

  return apiSuccess({
    opportunity: {
      ...opportunity,
      eligibility,
      hasApplied,
    },
  });
}
