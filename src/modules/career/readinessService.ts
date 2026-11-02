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

export async function calculateStudentReadiness(studentProfileId: string): Promise<ReadinessResult | null> {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      careerGoals: {
        where: { isPrimary: true, status: "ACTIVE" },
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
    },
  });

  if (!profile || profile.careerGoals.length === 0) {
    return null;
  }

  const primaryGoal = profile.careerGoals[0];
  const role = primaryGoal.role;
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

  // Calculate component breakdown
  const coveragePercentage = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
  const projectScore = Math.min(100, profile.projects.length * 35);
  const profileScore = profile.completionPercentage || 50;
  const verifiedScore = roleSkills.length > 0 ? Math.round((verifiedCount / roleSkills.length) * 100) : 0;
  const selfScore = profile.skills.length > 0 ? 80 : 20;

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
