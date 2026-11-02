import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { sendNotification } from "@/lib/email/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const { id } = await params;
  const drive = await prisma.placementDrive.findUnique({
    where: { id },
  });

  if (!drive || drive.institutionId !== institutionId) {
    return apiError("Drive not found", "NOT_FOUND", 404);
  }

  const publishedDrive = await prisma.$transaction(async (tx) => {
    const updated = await tx.placementDrive.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    await tx.auditLog.create({
      data: {
        actorId: session!.userId,
        tenantType: "INSTITUTION",
        tenantId: institutionId,
        action: "PUBLISH_DRIVE",
        resource: `PlacementDrive:${id}`,
        metadata: JSON.stringify({ companyName: drive.companyName, roleTitle: drive.roleTitle }),
      },
    });

    return updated;
  });

  // Notify all students in this institution (PRD 12.13)
  const students = await prisma.studentProfile.findMany({
    where: { institutionId },
    select: { userId: true },
  });

  for (const s of students) {
    await sendNotification({
      userId: s.userId,
      type: "DRIVE_ALERT",
      title: `New Placement Drive: ${drive.companyName}`,
      body: `${drive.companyName} is hiring for "${drive.roleTitle}" at ₹${drive.packageLpa || "Competitive"} LPA. Check your eligibility and register now!`,
      actionUrl: `/college/drives/${drive.id}`,
      sendEmail: true,
    });
  }

  return apiSuccess({
    drive: publishedDrive,
    notifiedStudentCount: students.length,
  });
}
