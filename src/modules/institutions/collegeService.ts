import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export interface CohortAnalyticsResult {
  totalStudents: number;
  averageReadinessScore: number;
  readinessBands: {
    readyForPlacement: number; // >= 75%
    nearingReadiness: number;  // 55% - 74%
    needsPreparation: number;  // < 55%
  };
  skillGapHeatmap: {
    skillName: string;
    category: string;
    averageGap: number;
    studentsNeedingHelpCount: number;
  }[];
  attentionStudents: {
    id: string;
    name: string;
    email: string;
    reason: string;
    completionPercentage: number;
  }[];
  activeDrivesCount: number;
}

export async function getCollegeCohortAnalytics(institutionId: string): Promise<CohortAnalyticsResult> {
  const students = await prisma.studentProfile.findMany({
    where: { institutionId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      skills: { include: { skill: true } },
      careerGoals: { where: { isPrimary: true }, include: { role: { include: { skills: { include: { skill: true } } } } } },
      projects: true,
      assessmentAttempts: { where: { status: "SUBMITTED" } },
    },
  });

  const totalStudents = students.length;
  let readyCount = 0;
  let nearingCount = 0;
  let needsPrepCount = 0;
  let totalScoreSum = 0;

  const skillGapsAccumulator = new Map<string, { category: string; totalGap: number; count: number }>();
  const attentionStudents: CohortAnalyticsResult["attentionStudents"] = [];

  for (const s of students) {
    // Estimated student readiness based on verified skills + projects + profile
    const verifiedSkillsCount = s.skills.filter((sk) => sk.verifiedLevel >= 3).length;
    const projectCount = s.projects.length;
    const completion = s.completionPercentage || 20;

    const estimatedReadiness = Math.min(100, Math.round(verifiedSkillsCount * 20 + projectCount * 20 + (completion * 0.4)));
    totalScoreSum += estimatedReadiness;

    if (estimatedReadiness >= 75) readyCount++;
    else if (estimatedReadiness >= 55) nearingCount++;
    else needsPrepCount++;

    // "Students needing attention" based on transparent rules (PRD 12.14)
    if (completion < 50) {
      attentionStudents.push({
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        reason: `Incomplete profile (${completion}% completed). Missing key education or project details.`,
        completionPercentage: completion,
      });
    } else if (verifiedSkillsCount === 0 && s.assessmentAttempts.length === 0) {
      attentionStudents.push({
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        reason: "Zero verified assessments completed before upcoming placement drives.",
        completionPercentage: completion,
      });
    }

    // Accumulate skill gaps from role requirements
    if (s.careerGoals.length > 0) {
      const requiredSkills = s.careerGoals[0].role.skills;
      const studentSkillMap = new Map(s.skills.map((sk) => [sk.skillId, sk.verifiedLevel]));

      for (const rs of requiredSkills) {
        const studentLevel = studentSkillMap.get(rs.skillId) || 0;
        const gap = Math.max(0, rs.requiredLevel - studentLevel);

        const current = skillGapsAccumulator.get(rs.skill.canonicalName) || {
          category: rs.skill.category,
          totalGap: 0,
          count: 0,
        };
        current.totalGap += gap;
        if (gap > 0) current.count++;
        skillGapsAccumulator.set(rs.skill.canonicalName, current);
      }
    }
  }

  const activeDrivesCount = await prisma.placementDrive.count({
    where: { institutionId, status: "PUBLISHED" },
  });

  const skillGapHeatmap = Array.from(skillGapsAccumulator.entries()).map(([skillName, data]) => ({
    skillName,
    category: data.category,
    averageGap: totalStudents > 0 ? Number((data.totalGap / totalStudents).toFixed(1)) : 0,
    studentsNeedingHelpCount: data.count,
  })).sort((a, b) => b.studentsNeedingHelpCount - a.studentsNeedingHelpCount);

  return {
    totalStudents,
    averageReadinessScore: totalStudents > 0 ? Math.round(totalScoreSum / totalStudents) : 0,
    readinessBands: {
      readyForPlacement: readyCount,
      nearingReadiness: nearingCount,
      needsPreparation: needsPrepCount,
    },
    skillGapHeatmap: skillGapHeatmap.slice(0, 8),
    attentionStudents: attentionStudents.slice(0, 10),
    activeDrivesCount,
  };
}

export async function previewDriveEligibleCount(params: {
  institutionId: string;
  minCgpa?: number;
  allowedBranches?: string[];
  graduationYears?: number[];
}) {
  const students = await prisma.studentProfile.findMany({
    where: { institutionId: params.institutionId },
    include: {
      batch: { include: { department: true } },
      education: true,
    },
  });

  let eligibleCount = 0;
  let excludedCount = 0;
  const exclusionReasons: Record<string, number> = {
    cgpaTooLow: 0,
    branchNotAllowed: 0,
    batchYearNotAllowed: 0,
  };

  for (const s of students) {
    const cgpa = s.cgpa ?? s.education[0]?.cgpa ?? 0;
    const branch = s.batch?.department.code ?? s.education[0]?.branch;
    const gradYear = s.batch?.graduationYear ?? s.education[0]?.endYear;

    let eligible = true;

    if (params.minCgpa !== undefined && cgpa < params.minCgpa) {
      eligible = false;
      exclusionReasons.cgpaTooLow++;
    }

    if (params.allowedBranches && params.allowedBranches.length > 0 && branch) {
      if (!params.allowedBranches.includes(branch)) {
        eligible = false;
        exclusionReasons.branchNotAllowed++;
      }
    }

    if (params.graduationYears && params.graduationYears.length > 0 && gradYear) {
      if (!params.graduationYears.includes(gradYear)) {
        eligible = false;
        exclusionReasons.batchYearNotAllowed++;
      }
    }

    if (eligible) {
      eligibleCount++;
    } else {
      excludedCount++;
    }
  }

  return {
    totalStudents: students.length,
    eligibleCount,
    excludedCount,
    exclusionReasons,
  };
}

export async function importStudentsFromCsv(params: {
  institutionId: string;
  records: {
    name: string;
    email: string;
    departmentCode: string;
    graduationYear: number;
    cgpa?: number;
  }[];
}) {
  const results = {
    importedCount: 0,
    skippedCount: 0,
    errors: [] as string[],
  };

  const defaultPassword = await bcrypt.hash("Student@StepBridge2026!", 10);

  for (const row of params.records) {
    try {
      const email = row.email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        results.skippedCount++;
        results.errors.push(`Email already registered: ${email}`);
        continue;
      }

      // Find or create department
      let dept = await prisma.department.findFirst({
        where: { institutionId: params.institutionId, code: row.departmentCode.toUpperCase() },
      });
      if (!dept) {
        dept = await prisma.department.create({
          data: {
            institutionId: params.institutionId,
            name: `${row.departmentCode.toUpperCase()} Department`,
            code: row.departmentCode.toUpperCase(),
          },
        });
      }

      // Find or create batch
      let batch = await prisma.batch.findFirst({
        where: {
          institutionId: params.institutionId,
          departmentId: dept.id,
          graduationYear: row.graduationYear,
        },
      });
      if (!batch) {
        batch = await prisma.batch.create({
          data: {
            institutionId: params.institutionId,
            departmentId: dept.id,
            graduationYear: row.graduationYear,
            label: `${row.departmentCode.toUpperCase()} Class of ${row.graduationYear}`,
          },
        });
      }

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: row.name,
            email,
            passwordHash: defaultPassword,
            role: "STUDENT",
            status: "ACTIVE",
          },
        });

        await tx.studentProfile.create({
          data: {
            userId: user.id,
            institutionId: params.institutionId,
            batchId: batch!.id,
            headline: `${row.departmentCode.toUpperCase()} Student`,
            cgpa: row.cgpa || 7.5,
            visibility: "INSTITUTION_ONLY",
            completionPercentage: 45,
          },
        });
      });

      results.importedCount++;
    } catch (err: unknown) {
      results.skippedCount++;
      const msg = err instanceof Error ? err.message : "Error processing row";
      results.errors.push(`Row failed for ${row.email}: ${msg}`);
    }
  }

  return results;
}
