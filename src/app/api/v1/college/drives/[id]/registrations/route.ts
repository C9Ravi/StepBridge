import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateRegistrationSchema = z.object({
  registrationId: z.string().uuid(),
  status: z.enum(["REGISTERED", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED"]),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthenticated", "UNAUTHENTICATED", 401);

  const { id: driveId } = await params;
  const drive = await prisma.placementDrive.findUnique({
    where: { id: driveId },
    include: {
      registrations: {
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              batch: { include: { department: true } },
            },
          },
        },
      },
    },
  });

  if (!drive) return apiError("Drive not found", "NOT_FOUND", 404);

  // If college staff, verify institution scoping
  if (["COLLEGE_ADMIN", "PLACEMENT_OFFICER"].includes(session.role)) {
    if (drive.institutionId !== session.tenantId) {
      return apiError("Drive not found in your institution scope", "NOT_FOUND", 404);
    }
  }

  // Funnel counts
  const funnel = {
    registered: 0,
    shortlisted: 0,
    interview: 0,
    offered: 0,
    rejected: 0,
  };

  for (const r of drive.registrations) {
    if (r.status === "REGISTERED") funnel.registered++;
    else if (r.status === "SHORTLISTED") funnel.shortlisted++;
    else if (r.status === "INTERVIEW") funnel.interview++;
    else if (r.status === "OFFERED") funnel.offered++;
    else if (r.status === "REJECTED") funnel.rejected++;
  }

  return apiSuccess({
    driveTitle: `${drive.companyName} — ${drive.roleTitle}`,
    funnel,
    registrations: drive.registrations,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthenticated", "UNAUTHENTICATED", 401);

  const { id: driveId } = await params;
  const drive = await prisma.placementDrive.findUnique({ where: { id: driveId } });
  if (!drive || drive.status !== "PUBLISHED") {
    return apiError("Drive is not currently open for registrations", "BAD_REQUEST", 400);
  }

  // Student registration self-action
  if (session.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) return apiError("Profile not found", "NOT_FOUND", 404);

    // Verify student is member of the hosting institution
    if (profile.institutionId !== drive.institutionId) {
      return apiError("This drive is exclusive to students of the hosting institution", "FORBIDDEN", 403);
    }

    const existing = await prisma.driveRegistration.findUnique({
      where: { driveId_studentId: { driveId, studentId: profile.id } },
    });

    if (existing) {
      return apiError("You are already registered for this drive", "DUPLICATE", 409);
    }

    const reg = await prisma.driveRegistration.create({
      data: {
        driveId,
        studentId: profile.id,
        status: "REGISTERED",
        eligibilitySnapshot: JSON.stringify({ cgpa: profile.cgpa, registeredAt: new Date().toISOString() }),
      },
    });

    return apiSuccess({ registration: reg }, 201);
  }

  // Placement staff updating candidate stage in drive funnel
  if (["COLLEGE_ADMIN", "PLACEMENT_OFFICER", "SUPER_ADMIN"].includes(session.role)) {
    const body = await req.json();
    const result = updateRegistrationSchema.safeParse(body);
    if (!result.success) {
      return apiError("Invalid update payload", "VALIDATION_ERROR", 422);
    }

    const updated = await prisma.driveRegistration.update({
      where: { id: result.data.registrationId },
      data: { status: result.data.status },
    });

    return apiSuccess({ registration: updated });
  }

  return apiError("Forbidden", "FORBIDDEN", 403);
}
