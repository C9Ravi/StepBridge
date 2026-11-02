import { prisma } from "@/lib/db/prisma";

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  category: string;
  requiredLevel: number; // 1-5
  currentEvidenceLevel: number; // 0-5
  gapSize: number; // required - current
  evidenceSource: "ASSESSMENT_VERIFIED" | "PROJECT_BACKED" | "SELF_DECLARED" | "MISSING_EVIDENCE";
  importanceWeight: number; // 1-5
  suggestedAction: string;
}

export interface ReadinessResult {
  roleId: string;
  roleTitle: string;
  overallScore: number; // 0-100
  confidence: "HIGH" | "MEDIUM" | "LOW";
  coveragePercentage: number;
  skillsCompleted: number;
  skillsRemaining: number;
  roadmapCompletionPercentage: number;
  assessmentScore: number;
  projectCount: number;
  interviewReadiness: number;
  componentScores: {
    verifiedAssessmentScore: number;
    projectEvidenceScore: number;
    profileCompletenessScore: number;
    selfDeclaredScore: number;
  };
  skillGaps: SkillGapItem[];
  missingEvidenceCount: number;
  generatedAt: string;
}

export async function calculateStudentReadiness(
  studentProfileId: string,
  roleIdOrSlug?: string
): Promise<ReadinessResult | null> {
  // 1. Fetch student profile and career goals
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      careerGoals: {
        where: { status: "ACTIVE" },
        include: {
          role: {
            include: {
              skills: {
                include: { skill: true },
              },
            },
          },
        },
      },
      skills: {
        include: { skill: true },
      },
      projects: true,
      assessmentAttempts: {
        where: { status: "SUBMITTED" },
        include: { results: true },
      },
      roadmaps: {
        where: { status: "ACTIVE" },
        include: {
          milestones: {
            include: { tasks: true },
          },
        },
      },
    },
  });

  if (!profile) return null;

  // 2. Resolve target role
  let targetRole = null;

  if (roleIdOrSlug) {
    const normalized = roleIdOrSlug.toLowerCase();
    targetRole = await prisma.role.findFirst({
      where: {
        OR: [
          { id: roleIdOrSlug },
          { slug: roleIdOrSlug },
          { title: { contains: roleIdOrSlug } },
          ...(normalized.endsWith("-engineer")
            ? [{ slug: normalized.replace(/-engineer$/, "") }]
            : []),
          ...(normalized === "forward-deployed-engineer" ? [{ slug: "fde" }] : []),
          ...(normalized === "fde" ? [{ slug: "forward-deployed-engineer" }] : []),
        ],
        active: true,
      },
      include: {
        skills: {
          include: { skill: true },
        },
      },
    });
  } else {
    // Default to primary active goal, or first active goal
    const primaryGoal = profile.careerGoals.find((g) => g.isPrimary) || profile.careerGoals[0];
    if (primaryGoal) {
      targetRole = primaryGoal.role;
    }
  }

  if (!targetRole) {
    return null;
  }

  const role = targetRole;
  const roleSkills = role.skills;

  const studentSkillMap = new Map(profile.skills.map((s) => [s.skillId, s]));

  let totalWeight = 0;
  let achievedWeight = 0;
  let verifiedCount = 0;
  let missingEvidenceCount = 0;

  const skillGaps: SkillGapItem[] = [];

  for (const rs of roleSkills) {
    const studentSkill = studentSkillMap.get(rs.skillId);
    let currentEvidenceLevel = 0;
    let evidenceSource: SkillGapItem["evidenceSource"] = "MISSING_EVIDENCE";

    if (studentSkill) {
      if (studentSkill.verifiedLevel > 0) {
        currentEvidenceLevel = studentSkill.verifiedLevel;
        evidenceSource = "ASSESSMENT_VERIFIED";
        verifiedCount++;
      } else if (studentSkill.selfLevel > 0) {
        currentEvidenceLevel = Math.min(studentSkill.selfLevel, 2); // Cap self-declared evidence level to 2
        evidenceSource = "SELF_DECLARED";
      }
    }

    // Check project mentions
    const skillNameLower = rs.skill.canonicalName.toLowerCase();
    const isProjectBacked = profile.projects.some(
      (p) => p.technologies.toLowerCase().includes(skillNameLower) || p.description.toLowerCase().includes(skillNameLower)
    );

    if (isProjectBacked && currentEvidenceLevel < 3) {
      currentEvidenceLevel = Math.max(currentEvidenceLevel, 3);
      if (evidenceSource !== "ASSESSMENT_VERIFIED") {
        evidenceSource = "PROJECT_BACKED";
      }
    }

    if (evidenceSource === "MISSING_EVIDENCE") {
      missingEvidenceCount++;
    }

    const gapSize = Math.max(0, rs.requiredLevel - currentEvidenceLevel);
    totalWeight += rs.importanceWeight * rs.requiredLevel;
    achievedWeight += rs.importanceWeight * Math.min(currentEvidenceLevel, rs.requiredLevel);

    let suggestedAction = "Maintain skill proficiency through ongoing practice.";
    if (gapSize > 0) {
      if (evidenceSource === "MISSING_EVIDENCE") {
        suggestedAction = `Complete the ${rs.skill.canonicalName} assessment to establish verified baseline evidence.`;
      } else if (evidenceSource === "SELF_DECLARED") {
        suggestedAction = `Validate self-declared ${rs.skill.canonicalName} skill with a standardized MCQ assessment or project.`;
      } else {
        suggestedAction = `Follow target roadmap tasks to level up ${rs.skill.canonicalName} from level ${currentEvidenceLevel} to ${rs.requiredLevel}.`;
      }
    }

    skillGaps.push({
      skillId: rs.skillId,
      skillName: rs.skill.canonicalName,
      category: rs.skill.category,
      requiredLevel: rs.requiredLevel,
      currentEvidenceLevel,
      gapSize,
      evidenceSource,
      importanceWeight: rs.importanceWeight,
      suggestedAction,
    });
  }

  // Calculate real domain metrics
  const skillsCompleted = skillGaps.filter((g) => g.gapSize === 0).length;
  const skillsRemaining = skillGaps.filter((g) => g.gapSize > 0).length;

  // Active roadmap for this role
  const roleRoadmap = profile.roadmaps.find((r) => r.roleId === role.id);
  let totalTasks = 0;
  let completedTasks = 0;
  if (roleRoadmap) {
    for (const m of roleRoadmap.milestones) {
      for (const t of m.tasks) {
        totalTasks++;
        if (t.status === "COMPLETED") completedTasks++;
      }
    }
  }
  const roadmapCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Average assessment performance
  const submittedAttempts = profile.assessmentAttempts.filter((a) => a.score !== null);
  const avgAssessmentScore =
    submittedAttempts.length > 0
      ? Math.round(
          submittedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / submittedAttempts.length
        )
      : 0;

  // Calculate component breakdown
  const coveragePercentage = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
  const projectScore = Math.min(100, profile.projects.length * 35);
  const profileScore = profile.completionPercentage || 50;
  const verifiedScore = roleSkills.length > 0 ? Math.round((verifiedCount / roleSkills.length) * 100) : 0;
  const selfScore = profile.skills.length > 0 ? 80 : 20;

  // Interview readiness formula: weighted blend of verified assessments & CS fundamentals
  const interviewReadiness = Math.min(
    100,
    Math.round(verifiedScore * 0.5 + Math.min(100, profile.projects.length * 25) * 0.3 + (coveragePercentage > 50 ? 20 : 10))
  );

  // Weighted overall readiness formula (PRD 12.8, 19.3, ADR OD-08)
  const overallScore = Math.min(
    100,
    Math.round(
      coveragePercentage * 0.4 +
      projectScore * 0.3 +
      profileScore * 0.2 +
      selfScore * 0.1
    )
  );

  let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (verifiedCount >= 3 || (verifiedCount >= 2 && profile.projects.length >= 2)) {
    confidence = "HIGH";
  } else if (verifiedCount >= 1 || profile.projects.length >= 1) {
    confidence = "MEDIUM";
  }

  return {
    roleId: role.id,
    roleTitle: role.title,
    overallScore,
    confidence,
    coveragePercentage,
    skillsCompleted,
    skillsRemaining,
    roadmapCompletionPercentage,
    assessmentScore: avgAssessmentScore,
    projectCount: profile.projects.length,
    interviewReadiness,
    componentScores: {
      verifiedAssessmentScore: verifiedScore,
      projectEvidenceScore: projectScore,
      profileCompletenessScore: profileScore,
      selfDeclaredScore: selfScore,
    },
    skillGaps,
    missingEvidenceCount,
    generatedAt: new Date().toISOString(),
  };
}
