import { prisma } from "@/lib/db/prisma";
import { DOMAIN_CATALOG, getDomainBySlug, DomainBlueprint } from "./domainCatalog";
import { calculateStudentReadiness, ReadinessResult } from "./readinessService";

export interface DomainSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  overview: string;
  skillsCount: number;
  projectsCount: number;
  topSkills: string[];
  careerOpportunities: string[];
  isEnrolled?: boolean;
  isPrimary?: boolean;
  readinessScore?: number;
}

export interface DomainDetailedView {
  domain: DomainBlueprint & { id: string };
  studentReadiness?: ReadinessResult | null;
  enrolledStatus?: {
    isEnrolled: boolean;
    isPrimary: boolean;
    status: string;
  };
}

export interface DomainComparisonResult {
  domains: Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    description: string;
    coreCsSubjects: string[];
    requiredSkills: Array<{ name: string; level: number; importance: number }>;
    careerOpportunities: string[];
    sampleProjects: Array<{ title: string; difficulty: string }>;
    readinessScore?: number;
  }>;
  commonSkills: string[];
  uniqueSkillsByDomain: Record<string, string[]>;
}

/**
 * Get all available career domains with active metadata and student-specific enrollment state.
 */
export async function getDomainCatalog(studentProfileId?: string): Promise<DomainSummary[]> {
  const roles = await prisma.role.findMany({
    where: { active: true },
    include: {
      skills: {
        include: { skill: true },
        orderBy: { importanceWeight: "desc" },
      },
      careerGoals: studentProfileId
        ? {
            where: { studentProfileId, status: "ACTIVE" },
          }
        : false,
    },
    orderBy: { title: "asc" },
  });

  const summaries: DomainSummary[] = [];

  for (const r of roles) {
    const blueprint = DOMAIN_CATALOG.find((d) => d.slug === r.slug || d.title === r.title);
    const enrolledGoal = studentProfileId && r.careerGoals ? r.careerGoals[0] : null;

    let readinessScore: number | undefined;
    if (studentProfileId && enrolledGoal) {
      const readiness = await calculateStudentReadiness(studentProfileId, r.id);
      readinessScore = readiness?.overallScore;
    }

    summaries.push({
      id: r.id,
      slug: r.slug || blueprint?.slug || r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      overview: r.overview || blueprint?.overview || r.description,
      skillsCount: r.skills.length || blueprint?.skills.length || 0,
      projectsCount: blueprint?.projects.length || 3,
      topSkills: r.skills.slice(0, 4).map((s) => s.skill.canonicalName),
      careerOpportunities: blueprint?.careerOpportunities || [],
      isEnrolled: !!enrolledGoal,
      isPrimary: enrolledGoal?.isPrimary || false,
      readinessScore,
    });
  }

  return summaries;
}

/**
 * Get comprehensive details for a single domain including curriculum, roadmap, and student readiness.
 */
export async function getDomainDetails(slugOrId: string, studentProfileId?: string): Promise<DomainDetailedView | null> {
  const normalized = slugOrId.toLowerCase();
  const role = await prisma.role.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId },
        { title: slugOrId },
        { title: { contains: slugOrId } },
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
        orderBy: { importanceWeight: "desc" },
      },
      careerGoals: studentProfileId
        ? {
            where: { studentProfileId, status: "ACTIVE" },
          }
        : false,
    },
  });

  if (!role) return null;

  const blueprint = DOMAIN_CATALOG.find((d) => d.slug === role.slug || d.title === role.title);
  if (!blueprint) return null;

  let studentReadiness: ReadinessResult | null = null;
  if (studentProfileId) {
    studentReadiness = await calculateStudentReadiness(studentProfileId, role.id);
  }

  const enrolledGoal = studentProfileId && role.careerGoals ? role.careerGoals[0] : null;

  return {
    domain: {
      ...blueprint,
      id: role.id,
    },
    studentReadiness,
    enrolledStatus: {
      isEnrolled: !!enrolledGoal,
      isPrimary: enrolledGoal?.isPrimary || false,
      status: enrolledGoal?.status || "NOT_ENROLLED",
    },
  };
}

/**
 * Side-by-side comparison of 2-3 domains.
 */
export async function compareDomains(slugs: string[], studentProfileId?: string): Promise<DomainComparisonResult> {
  const domainsToCompare: DomainComparisonResult["domains"] = [];
  const skillSets: Record<string, Set<string>> = {};

  for (const slug of slugs) {
    const detail = await getDomainDetails(slug, studentProfileId);
    if (detail) {
      const skillNames = detail.domain.skills.map((s) => s.skillName);
      skillSets[detail.domain.slug] = new Set(skillNames);

      domainsToCompare.push({
        id: detail.domain.id,
        slug: detail.domain.slug,
        title: detail.domain.title,
        category: detail.domain.category,
        description: detail.domain.description,
        coreCsSubjects: detail.domain.coreCsSubjects,
        requiredSkills: detail.domain.skills.map((s) => ({
          name: s.skillName,
          level: s.requiredLevel,
          importance: s.importanceWeight,
        })),
        careerOpportunities: detail.domain.careerOpportunities,
        sampleProjects: detail.domain.projects.map((p) => ({
          title: p.title,
          difficulty: p.difficulty,
        })),
        readinessScore: detail.studentReadiness?.overallScore,
      });
    }
  }

  // Find common skills
  const slugKeys = Object.keys(skillSets);
  let commonSkills: string[] = [];
  if (slugKeys.length > 0) {
    const firstSet = skillSets[slugKeys[0]];
    commonSkills = Array.from(firstSet).filter((skill) =>
      slugKeys.every((key) => skillSets[key].has(skill))
    );
  }

  // Find unique skills per domain
  const uniqueSkillsByDomain: Record<string, string[]> = {};
  for (const slug of slugKeys) {
    const otherKeys = slugKeys.filter((k) => k !== slug);
    uniqueSkillsByDomain[slug] = Array.from(skillSets[slug]).filter(
      (skill) => otherKeys.every((otherKey) => !skillSets[otherKey].has(skill))
    );
  }

  return {
    domains: domainsToCompare,
    commonSkills,
    uniqueSkillsByDomain,
  };
}

/**
 * Enroll student in domain as primary target or secondary interest without losing progress.
 */
export async function enrollStudentDomain(params: {
  studentProfileId: string;
  roleId: string;
  isPrimary: boolean;
  targetDate?: Date;
}) {
  const { studentProfileId, roleId, isPrimary, targetDate } = params;

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error("Career domain not found");

  if (isPrimary) {
    // If setting as primary: demote prior primary to secondary active goal
    await prisma.careerGoal.updateMany({
      where: { studentProfileId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  // Check if student already has a goal record for this role
  const existingGoal = await prisma.careerGoal.findFirst({
    where: { studentProfileId, roleId },
  });

  if (existingGoal) {
    await prisma.careerGoal.update({
      where: { id: existingGoal.id },
      data: {
        isPrimary,
        status: "ACTIVE",
        targetDate: targetDate || existingGoal.targetDate,
      },
    });
  } else {
    await prisma.careerGoal.create({
      data: {
        studentProfileId,
        roleId,
        isPrimary,
        targetDate: targetDate || null,
        status: "ACTIVE",
      },
    });
  }

  return {
    roleTitle: role.title,
    isPrimary,
    status: "ACTIVE",
    message: isPrimary
      ? `Primary career goal updated to ${role.title}.`
      : `Added ${role.title} to your career interests.`,
  };
}

/**
 * Get all career interests enrolled by the student (both primary and secondary).
 */
export async function getStudentEnrolledDomains(studentProfileId: string) {
  const goals = await prisma.careerGoal.findMany({
    where: { studentProfileId, status: "ACTIVE" },
    include: {
      role: {
        include: {
          skills: { include: { skill: true } },
        },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  const enrolledWithMetrics = [];

  for (const g of goals) {
    const readiness = await calculateStudentReadiness(studentProfileId, g.roleId);
    enrolledWithMetrics.push({
      id: g.id,
      goalId: g.id,
      roleId: g.roleId,
      slug: g.role.slug,
      roleSlug: g.role.slug,
      title: g.role.title,
      roleTitle: g.role.title,
      category: g.role.category,
      isPrimary: g.isPrimary,
      status: g.status,
      targetDate: g.targetDate,
      readiness,
    });
  }

  return enrolledWithMetrics;
}
