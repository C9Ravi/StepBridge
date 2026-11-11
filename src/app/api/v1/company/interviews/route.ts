import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCompanyRecruiter } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { sendNotification } from "@/lib/email/service";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const scheduleInterviewSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  roundTitle: z.string().min(2, "Round title is required").max(100),
  scheduledAt: z.string().min(4, "Schedule date/time is required"),
  durationMinutes: z.number().min(15).max(180).default(45),
  meetingUrl: z.string().max(500).optional(),
  interviewerName: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

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
    const applicationId = searchParams.get("applicationId");
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status");

    const where: Prisma.InterviewScheduleWhereInput = {
      application: {
        opportunity: {
          companyId,
          ...(jobId ? { id: jobId } : {}),
        },
        ...(applicationId ? { id: applicationId } : {}),
      },
      ...(status ? { status } : {}),
    };

    const interviews = await prisma.interviewSchedule.findMany({
      where,
      include: {
        application: {
          include: {
            opportunity: { select: { id: true, title: true, type: true } },
            student: {
              include: {
                user: { select: { name: true, email: true } },
                institution: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return apiSuccess({
      interviews: interviews.map((iv) => ({
        id: iv.id,
        applicationId: iv.applicationId,
        roundTitle: iv.roundTitle,
        scheduledAt: iv.scheduledAt,
        durationMinutes: iv.durationMinutes,
        meetingUrl: iv.meetingUrl,
        interviewerName: iv.interviewerName,
        notes: iv.notes,
        status: iv.status,
        feedback: iv.feedback,
        rating: iv.rating,
        recommendation: iv.recommendation,
        candidateName: iv.application.student.user.name,
        candidateEmail: iv.application.student.user.email,
        college: iv.application.student.institution?.name || "Independent",
        jobTitle: iv.application.opportunity.title,
        jobId: iv.application.opportunity.id,
        createdAt: iv.createdAt,
      })),
      count: interviews.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch interviews";
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    let companyId: string;
    try {
      companyId = assertCompanyRecruiter(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Forbidden";
      return apiError(msg, "FORBIDDEN", 403);
    }

    const body = await req.json();
    const result = scheduleInterviewSchema.safeParse(body);
    if (!result.success) {
      return apiError("Invalid interview parameters", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
    }

    const { applicationId, roundTitle, scheduledAt, durationMinutes, meetingUrl, interviewerName, notes } = result.data;

    // Verify application belongs to this company
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        opportunity: { include: { company: true } },
        student: { select: { userId: true, user: { select: { name: true } } } },
      },
    });

    if (!application || application.opportunity.companyId !== companyId) {
      return apiError("Application not found in your company scope", "NOT_FOUND", 404);
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return apiError("Invalid date/time format for scheduledAt", "VALIDATION_ERROR", 422);
    }

    const interview = await prisma.$transaction(async (tx) => {
      // 1. Create interview schedule
      const iv = await tx.interviewSchedule.create({
        data: {
          applicationId,
          roundTitle,
          scheduledAt: scheduledDate,
          durationMinutes,
          meetingUrl: meetingUrl || null,
          interviewerName: interviewerName || "TechCorp Hiring Panel",
          notes: notes || null,
          status: "SCHEDULED",
        },
      });

      // 2. Advance application stage to INTERVIEW if needed
      const previousStage = application.stage;
      if (previousStage === "APPLIED" || previousStage === "SHORTLISTED") {
        await tx.application.update({
          where: { id: applicationId },
          data: { stage: "INTERVIEW" },
        });

        await tx.applicationStageEvent.create({
          data: {
            applicationId,
            actorId: session!.userId,
            fromStage: previousStage,
            toStage: "INTERVIEW",
            note: `Interview scheduled: ${roundTitle} on ${scheduledDate.toLocaleDateString()}`,
          },
        });
      }

      // 3. Create Audit Log
      await tx.auditLog.create({
        data: {
          actorId: session!.userId,
          tenantType: "COMPANY",
          tenantId: companyId,
          action: "INTERVIEW_SCHEDULED",
          resource: `InterviewSchedule:${iv.id}`,
          metadata: JSON.stringify({
            applicationId,
            roundTitle,
            scheduledAt: scheduledDate.toISOString(),
          }),
        },
      });

      return iv;
    });

    // 4. Notify student
    await sendNotification({
      userId: application.student.userId,
      type: "APPLICATION_STAGE",
      title: `Interview Scheduled: ${roundTitle}`,
      body: `Your interview for ${application.opportunity.title} at ${application.opportunity.company.name} has been scheduled for ${scheduledDate.toLocaleString()}.`,
      actionUrl: `/applications`,
      sendEmail: true,
    });

    return apiSuccess({ interview }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to schedule interview";
    console.error("Schedule interview error:", err);
    return apiError(message, "INTERNAL_ERROR", 500);
  }
}
