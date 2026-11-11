import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCompanyRecruiter } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    let companyId: string;
    try {
      companyId = assertCompanyRecruiter(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Forbidden";
      return apiError(msg, "FORBIDDEN", 403);
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        domain: true,
        description: true,
        verificationStatus: true,
      },
    });

    if (!company) {
      return apiError("Company not found", "NOT_FOUND", 404);
    }

    // Fetch all opportunities for this company
    const jobs = await prisma.opportunity.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { applications: true },
        },
        applications: {
          select: {
            id: true,
            stage: true,
            appliedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute metrics
    const totalJobsCount = jobs.length;
    const activeJobsCount = jobs.filter((j) => j.status === "PUBLISHED").length;
    const draftJobsCount = jobs.filter((j) => j.status === "DRAFT").length;
    const closedJobsCount = jobs.filter((j) => j.status === "CLOSED").length;

    let totalApplicationsCount = 0;
    let newApplicantsCount = 0; // APPLIED
    let shortlistedCount = 0; // SHORTLISTED
    let interviewStageCount = 0; // INTERVIEW
    let offersCount = 0; // OFFERED or HIRED
    let rejectedCount = 0; // REJECTED

    const jobStats = jobs.map((j) => {
      const apps = j.applications;
      totalApplicationsCount += apps.length;

      const stageBreakdown = {
        applied: apps.filter((a) => a.stage === "APPLIED").length,
        shortlisted: apps.filter((a) => a.stage === "SHORTLISTED").length,
        interview: apps.filter((a) => a.stage === "INTERVIEW").length,
        offered: apps.filter((a) => a.stage === "OFFERED" || a.stage === "HIRED").length,
        rejected: apps.filter((a) => a.stage === "REJECTED").length,
      };

      newApplicantsCount += stageBreakdown.applied;
      shortlistedCount += stageBreakdown.shortlisted;
      interviewStageCount += stageBreakdown.interview;
      offersCount += stageBreakdown.offered;
      rejectedCount += stageBreakdown.rejected;

      return {
        id: j.id,
        title: j.title,
        type: j.type,
        location: j.location,
        salaryRange: j.salaryRange,
        status: j.status,
        deadline: j.deadline,
        createdAt: j.createdAt,
        totalApplications: apps.length,
        stages: stageBreakdown,
      };
    });

    // Interviews scheduled count and upcoming
    const totalInterviewsCount = await prisma.interviewSchedule.count({
      where: {
        application: {
          opportunity: { companyId },
        },
      },
    });

    const upcomingInterviews = await prisma.interviewSchedule.findMany({
      where: {
        application: {
          opportunity: { companyId },
        },
        status: "SCHEDULED",
      },
      include: {
        application: {
          include: {
            opportunity: { select: { title: true } },
            student: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    });

    // Recent applications
    const recentApplications = await prisma.application.findMany({
      where: {
        opportunity: { companyId },
      },
      include: {
        opportunity: { select: { id: true, title: true } },
        student: {
          include: {
            user: { select: { name: true, email: true } },
            institution: { select: { name: true } },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
      take: 6,
    });

    return apiSuccess({
      company,
      metrics: {
        totalJobsCount,
        activeJobsCount,
        draftJobsCount,
        closedJobsCount,
        totalApplicationsCount,
        newApplicantsCount,
        shortlistedCount,
        interviewStageCount,
        totalInterviewsCount,
        offersCount,
        rejectedCount,
      },
      jobStats,
      upcomingInterviews: upcomingInterviews.map((iv) => ({
        id: iv.id,
        roundTitle: iv.roundTitle,
        scheduledAt: iv.scheduledAt,
        durationMinutes: iv.durationMinutes,
        meetingUrl: iv.meetingUrl,
        candidateName: iv.application.student.user.name,
        candidateEmail: iv.application.student.user.email,
        jobTitle: iv.application.opportunity.title,
        status: iv.status,
      })),
      recentApplications: recentApplications.map((app) => ({
        id: app.id,
        candidateName: app.student.user.name,
        candidateEmail: app.student.user.email,
        college: app.student.institution?.name || "Independent",
        jobTitle: app.opportunity.title,
        stage: app.stage,
        appliedAt: app.appliedAt,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load recruiter analytics";
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}
