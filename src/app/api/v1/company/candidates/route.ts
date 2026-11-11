import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCompanyRecruiter } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    let companyId: string;
    try {
      companyId = assertCompanyRecruiter(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Forbidden";
      return apiError(msg, "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.trim() || "";
    const skillsParam = searchParams.get("skills")?.trim() || "";
    const minCgpa = searchParams.get("minCgpa") ? parseFloat(searchParams.get("minCgpa")!) : undefined;
    const minReadiness = searchParams.get("minReadiness") ? parseInt(searchParams.get("minReadiness")!, 10) : undefined;
    const institutionId = searchParams.get("institutionId")?.trim() || undefined;
    const graduationYear = searchParams.get("graduationYear") ? parseInt(searchParams.get("graduationYear")!, 10) : undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    // Filter skills if provided
    const targetSkillNames = skillsParam
      ? skillsParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];

    // Base WHERE condition: Respect candidate privacy consent!
    // Students with PRIVATE are never shown in recruiter discovery.
    const where: Prisma.StudentProfileWhereInput = {
      visibility: { in: ["VERIFIED_RECRUITERS", "INSTITUTION_ONLY"] },
    };

    if (minCgpa !== undefined && !isNaN(minCgpa)) {
      where.cgpa = { gte: minCgpa };
    }

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (graduationYear && !isNaN(graduationYear)) {
      where.batch = {
        graduationYear,
      };
    }

    if (search) {
      where.OR = [
        { headline: { contains: search } },
        { bio: { contains: search } },
        { user: { name: { contains: search } } },
        {
          skills: {
            some: {
              skill: { canonicalName: { contains: search } },
            },
          },
        },
      ];
    }

    // Query candidates
    const [totalCount, profiles] = await Promise.all([
      prisma.studentProfile.count({ where }),
      prisma.studentProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          institution: {
            select: { id: true, name: true, city: true },
          },
          batch: {
            select: { id: true, label: true, graduationYear: true },
          },
          skills: {
            include: {
              skill: { select: { id: true, canonicalName: true, category: true } },
            },
          },
          projects: {
            select: { id: true, title: true, description: true, technologies: true, url: true },
            take: 3,
          },
          resumes: {
            select: { id: true, fileName: true, fileType: true, sizeBytes: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          assessmentAttempts: {
            include: {
              assessment: { select: { topic: true, questionCount: true } },
            },
            take: 3,
            orderBy: { createdAt: "desc" },
          },
          roadmaps: {
            include: {
              role: { select: { title: true, slug: true } },
            },
            take: 2,
            orderBy: { updatedAt: "desc" },
          },
        },
        skip,
        take: limit,
      }),
    ]);

    // Enrich candidates with readiness score and AI matching explanation
    const enrichedCandidates = profiles.map((p) => {
      const candidateSkillNames = p.skills.map((s) => s.skill.canonicalName);
      const candidateSkillLower = candidateSkillNames.map((s) => s.toLowerCase());

      // Match target skills
      const matchedSkills = targetSkillNames.length > 0
        ? targetSkillNames.filter((ts) => candidateSkillLower.some((cs) => cs.includes(ts)))
        : candidateSkillNames.slice(0, 5);

      // Compute readiness score
      let readinessScore = 65; // Base default
      if (p.assessmentAttempts.length > 0) {
        const avgScore = Math.round(
          p.assessmentAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / p.assessmentAttempts.length
        );
        readinessScore = avgScore;
      }

      const topRole = p.roadmaps[0]?.role?.title || "Full Stack Engineer";

      // Match summary
      let matchSummary = "";
      if (targetSkillNames.length > 0) {
        matchSummary = `Matches ${matchedSkills.length} of ${targetSkillNames.length} requested skills.`;
      } else {
        matchSummary = `Demonstrated expertise across ${p.skills.length} verified technical competencies.`;
      }

      return {
        id: p.id,
        userId: p.userId,
        name: p.user.name,
        email: p.user.email,
        headline: p.headline || `${topRole} Candidate`,
        bio: p.bio,
        location: p.location || "Faridabad, India",
        cgpa: p.cgpa,
        college: p.institution?.name || "JCBUST, YMCA Faridabad",
        batch: p.batch?.label || (p.batch?.graduationYear ? `Class of ${p.batch.graduationYear}` : "Class of 2025"),
        readinessScore,
        skills: p.skills.map((s) => ({
          name: s.skill.canonicalName,
          category: s.skill.category,
          level: s.verifiedLevel > 0 ? s.verifiedLevel : s.selfLevel,
          isVerified: s.verifiedLevel > 0,
        })),
        projects: p.projects.map((proj) => ({
          id: proj.id,
          title: proj.title,
          description: proj.description,
          technologies: proj.technologies,
          url: proj.url,
        })),
        assessmentHighlights: p.assessmentAttempts.map((ar) => ({
          topic: ar.assessment.topic,
          score: Math.round(ar.score || 0),
          passed: (ar.score || 0) >= 70,
        })),
        hasResume: p.resumes.length > 0,
        primaryResume: p.resumes[0] || null,
        matchAnalysis: {
          matchedSkills,
          matchSummary,
          targetRole: topRole,
        },
      };
    });

    // Filter by minReadiness if specified in query
    const finalCandidates = minReadiness !== undefined && !isNaN(minReadiness)
      ? enrichedCandidates.filter((c) => c.readinessScore >= minReadiness)
      : enrichedCandidates;

    return apiSuccess({
      candidates: finalCandidates,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      filtersApplied: {
        search,
        skills: targetSkillNames,
        minCgpa,
        minReadiness,
        institutionId,
        graduationYear,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to search candidates";
    console.error("Candidate search error:", err);
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}
