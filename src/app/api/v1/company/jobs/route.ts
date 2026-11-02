import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCompanyRecruiter } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { createJobSchema } from "@/lib/validation/schemas";

export async function GET() {
  const session = await getSession();
  let companyId: string;
  try {
    companyId = assertCompanyRecruiter(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const jobs = await prisma.opportunity.findMany({
    where: { companyId },
    include: {
      skills: { include: { skill: true } },
      eligibilityRules: true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ jobs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  let companyId: string;
  try {
    companyId = assertCompanyRecruiter(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const body = await req.json();
  const result = createJobSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid job parameters", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  const { title, type, description, location, salaryRange, deadline, skills, eligibilityRules } = result.data;

  const job = await prisma.$transaction(async (tx) => {
    const opp = await tx.opportunity.create({
      data: {
        companyId,
        title,
        type,
        description,
        location,
        salaryRange,
        deadline: deadline ? new Date(deadline) : null,
        status: "DRAFT",
      },
    });

    for (const sk of skills) {
      await tx.opportunitySkill.create({
        data: {
          opportunityId: opp.id,
          skillId: sk.skillId,
          requiredLevel: sk.requiredLevel,
          importance: sk.importance,
        },
      });
    }

    if (eligibilityRules) {
      for (const rule of eligibilityRules) {
        await tx.eligibilityRule.create({
          data: {
            opportunityId: opp.id,
            ruleType: rule.ruleType,
            operator: rule.operator,
            valueJson: rule.valueJson,
          },
        });
      }
    }

    return opp;
  });

  return apiSuccess({ job }, 201);
}
