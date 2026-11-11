import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { createDriveSchema } from "@/lib/validation/schemas";

export async function GET() {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const drives = await prisma.placementDrive.findMany({
    where: { institutionId },
    include: {
      _count: {
        select: {
          registrations: true,
          outcomes: true,
        },
      },
    },
    orderBy: { driveDate: "asc" },
  });

  return apiSuccess({ drives });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const body = await req.json();
  const result = createDriveSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid placement drive parameters", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  const { companyName, roleTitle, packageLpa, driveDate, deadline, eligibilityRules, notes } = result.data;

  const drive = await prisma.placementDrive.create({
    data: {
      institutionId,
      companyName,
      roleTitle,
      packageLpa,
      driveDate: new Date(driveDate),
      deadline: new Date(deadline),
      status: result.data.status || "DRAFT",
      eligibilityRules: eligibilityRules ? JSON.stringify(eligibilityRules) : null,
      notes,
    },
  });

  // If published immediately, notify college students
  if (drive.status === "PUBLISHED") {
    const students = await prisma.studentProfile.findMany({
      where: { institutionId },
      select: { userId: true },
    });
    for (const s of students) {
      await prisma.notification.create({
        data: {
          userId: s.userId,
          type: "DRIVE_ANNOUNCEMENT",
          title: `New Placement Drive: ${companyName}`,
          body: `${companyName} announced a campus placement drive for '${roleTitle}' (${packageLpa ? "₹" + packageLpa + " LPA" : "Competitive"}). Apply before ${new Date(deadline).toLocaleDateString()}.`,
          actionUrl: `/college/drives`,
        },
      });
    }
  }

  return apiSuccess({ drive }, 201);
}
