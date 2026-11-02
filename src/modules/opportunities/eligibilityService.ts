import { prisma } from "@/lib/db/prisma";

export interface EligibilityCheckResult {
  isEligible: boolean;
  checks: {
    ruleType: string;
    passed: boolean;
    reason: string;
  }[];
  matchExplanation: {
    matchedCount: number;
    requiredCount: number;
    matchedSkills: string[];
    missingSkills: string[];
    matchPercentage: number;
    summary: string;
  };
}

export async function checkOpportunityEligibility(params: {
  opportunityId: string;
  studentProfileId: string;
}): Promise<EligibilityCheckResult> {
  const [opportunity, profile] = await Promise.all([
    prisma.opportunity.findUnique({
      where: { id: params.opportunityId },
      include: {
        skills: { include: { skill: true } },
        eligibilityRules: true,
      },
    }),
    prisma.studentProfile.findUnique({
      where: { id: params.studentProfileId },
      include: {
        batch: { include: { department: true } },
        education: true,
        skills: { include: { skill: true } },
      },
    }),
  ]);

  if (!opportunity || !profile) {
    throw new Error("Opportunity or student profile not found");
  }

  const checks: EligibilityCheckResult["checks"] = [];
  let isEligible = true;

  // 1. Evaluate hard eligibility rules
  for (const rule of opportunity.eligibilityRules) {
    try {
      const ruleVal = JSON.parse(rule.valueJson);

      if (rule.ruleType === "MIN_CGPA") {
        const studentCgpa = profile.cgpa ?? profile.education[0]?.cgpa ?? 0;
        const minCgpa = ruleVal.minCgpa ?? 6.0;
        const passed = studentCgpa >= minCgpa;
        if (!passed) isEligible = false;

        checks.push({
          ruleType: "MIN_CGPA",
          passed,
          reason: passed
            ? `CGPA requirement met: ${studentCgpa.toFixed(2)} (minimum ${minCgpa.toFixed(2)} required).`
            : `CGPA requirement not met: current ${studentCgpa.toFixed(2)} is below minimum ${minCgpa.toFixed(2)}.`,
        });
      } else if (rule.ruleType === "ALLOWED_BATCHES") {
        const graduationYear = profile.batch?.graduationYear ?? profile.education[0]?.endYear;
        const allowedYears: number[] = ruleVal.years ?? [];
        const passed = !graduationYear || allowedYears.length === 0 || allowedYears.includes(graduationYear);
        if (!passed) isEligible = false;

        checks.push({
          ruleType: "ALLOWED_BATCHES",
          passed,
          reason: passed
            ? `Graduation year (${graduationYear}) is eligible.`
            : `Graduation year (${graduationYear}) is not in eligible batches (${allowedYears.join(", ")}).`,
        });
      } else if (rule.ruleType === "ALLOWED_DEPARTMENTS") {
        const branch = profile.batch?.department.code ?? profile.education[0]?.branch;
        const allowedBranches: string[] = ruleVal.branches ?? [];
        const passed = !branch || allowedBranches.length === 0 || allowedBranches.includes(branch);
        if (!passed) isEligible = false;

        checks.push({
          ruleType: "ALLOWED_DEPARTMENTS",
          passed,
          reason: passed
            ? `Department / branch (${branch}) is eligible.`
            : `Department (${branch}) is not in eligible list (${allowedBranches.join(", ")}).`,
        });
      }
    } catch {
      // Ignore unparseable rules gracefully
    }
  }

  // 2. Compute explainable skill match (PRD 13.5: "Matches 3 of 4 required skills")
  const requiredSkills = opportunity.skills.filter((s) => s.importance === "REQUIRED");
  const studentSkillIds = new Set(profile.skills.map((s) => s.skillId));

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const reqSkill of requiredSkills) {
    if (studentSkillIds.has(reqSkill.skillId)) {
      matchedSkills.push(reqSkill.skill.canonicalName);
    } else {
      missingSkills.push(reqSkill.skill.canonicalName);
    }
  }

  const matchedCount = matchedSkills.length;
  const requiredCount = requiredSkills.length;
  const matchPercentage = requiredCount > 0 ? Math.round((matchedCount / requiredCount) * 100) : 100;

  const summary =
    requiredCount > 0
      ? `Matches ${matchedCount} of ${requiredCount} required skills (${matchPercentage}% match)`
      : "No specific skill prerequisites required";

  return {
    isEligible,
    checks,
    matchExplanation: {
      matchedCount,
      requiredCount,
      matchedSkills,
      missingSkills,
      matchPercentage,
      summary,
    },
  };
}
