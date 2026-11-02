import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET(
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
    include: {
      registrations: {
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } },
              batch: { include: { department: true } },
            },
          },
        },
      },
      outcomes: {
        include: {
          student: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!drive || drive.institutionId !== institutionId) {
    return apiError("Placement drive not found", "NOT_FOUND", 404);
  }

  return apiSuccess({ drive });
}

export async function PATCH(
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
  const drive = await prisma.placementDrive.findUnique({ where: { id } });
  if (!drive || drive.institutionId !== institutionId) {
    return apiError("Drive not found", "NOT_FOUND", 404);
  }

  const body = await req.json();
  const updated = await prisma.placementDrive.update({
    where: { id },
    data: body,
  });

  return apiSuccess({ drive: updated });
}
