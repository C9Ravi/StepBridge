import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCompanyRecruiter } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    let companyId: string;
    try {
      companyId = assertCompanyRecruiter(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Forbidden";
      return apiError(msg, "FORBIDDEN", 403);
    }

    const { id: jobId } = await params;
    const job = await prisma.opportunity.findUnique({
      where: { id: jobId },
      include: {
        skills: { include: { skill: true } },
      },
    });

    // Cross-company access check (PRD 11.2)
    if (!job || job.companyId !== companyId) {
      return apiError("Job not found in your company scope", "NOT_FOUND", 404);
    }

    const applications = await prisma.application.findMany({
      where: { opportunityId: jobId },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            institution: { select: { name: true } },
            batch: { select: { label: true } },
          },
        },
        resume: {
          select: { id: true, fileName: true, fileType: true, sizeBytes: true },
        },
        stageEvents: {
          include: { actor: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        interviews: {
          orderBy: { scheduledAt: "desc" },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    // Parse snapshot and match explanation for each applicant
    const requiredSkillNames = job.skills
      .filter((s) => s.importance === "REQUIRED")
      .map((s) => s.skill.canonicalName.toLowerCase());

    const enrichedApplicants = applications.map((app) => {
      let parsedSnapshot: Record<string, unknown> = {};
      try {
        parsedSnapshot = JSON.parse(app.profileSnapshot);
      } catch {
        // Ignore
      }

      const candidateSkills: string[] = Array.isArray(parsedSnapshot.skills)
        ? (parsedSnapshot.skills as unknown[])
            .map((s) => {
              if (typeof s === "string") return s.toLowerCase();
              if (typeof s === "object" && s !== null) {
                const rec = s as { skill?: string; skillName?: string; canonicalName?: string };
                return (rec.skill || rec.skillName || rec.canonicalName || "").toLowerCase();
              }
              return "";
            })
            .filter(Boolean)
        : [];

      const matched = requiredSkillNames.filter((r) => candidateSkills.includes(r));
      const matchPercentage =
        requiredSkillNames.length > 0
          ? Math.round((matched.length / requiredSkillNames.length) * 100)
          : 100;

      return {
        applicationId: app.id,
        stage: app.stage,
        appliedAt: app.appliedAt,
        candidate: {
          name: app.student.user.name,
          email: app.student.user.email,
          institution: app.student.institution?.name || "Independent Learner",
          batch: app.student.batch?.label || "N/A",
          headline: app.student.headline,
          cgpa: app.student.cgpa,
        },
        resume: app.resume,
        profileSnapshot: parsedSnapshot,
        match: {
          matchedCount: matched.length,
          requiredCount: requiredSkillNames.length,
          matchPercentage,
          summary: `Matches ${matched.length} of ${requiredSkillNames.length} required skills`,
        },
        notes: app.stageEvents.filter((e) => e.note).map((e) => ({
          author: e.actor?.name || "Recruiter",
          note: e.note,
          createdAt: e.createdAt,
        })),
        interviews: app.interviews,
        stageHistory: app.stageEvents,
      };
    });

    return apiSuccess({
      jobTitle: job.title,
      applicantCount: enrichedApplicants.length,
      applicants: enrichedApplicants,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Error in applicants route:", err);
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}
