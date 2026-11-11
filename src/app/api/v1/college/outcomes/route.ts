import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { recordPlacementOutcome } from "@/modules/institutions/collegeService";
import { z } from "zod";

const recordOutcomeSchema = z.object({
  studentId: z.string().uuid(),
  driveId: z.string().uuid().optional(),
  companyName: z.string().min(2),
  packageLpa: z.number().min(0).max(200),
  outcome: z.enum(["OFFERED", "ACCEPTED", "DECLINED"]),
  source: z.enum(["ON_CAMPUS", "OFF_CAMPUS"]).optional(),
});

export async function GET() {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const outcomes = await prisma.placementOutcome.findMany({
    where: { student: { institutionId } },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          batch: { include: { department: true } },
        },
      },
      drive: { select: { id: true, roleTitle: true, companyName: true } },
    },
    orderBy: { recordedAt: "desc" },
  });

  return apiSuccess({ outcomes });
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
  const result = recordOutcomeSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid outcome data", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  try {
    const outcome = await recordPlacementOutcome({
      institutionId,
      studentId: result.data.studentId,
      driveId: result.data.driveId,
      companyName: result.data.companyName,
      packageLpa: result.data.packageLpa,
      outcome: result.data.outcome,
      source: result.data.source,
    });

    return apiSuccess({ outcome }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record outcome";
    return apiError(msg, "BAD_REQUEST", 400);
  }
}
