import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { previewDriveEligibleCount } from "@/modules/institutions/collegeService";
import { z } from "zod";

const previewSchema = z.object({
  minCgpa: z.number().min(0).max(10).optional(),
  allowedBranches: z.array(z.string()).optional(),
  graduationYears: z.array(z.number()).optional(),
});

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
  const result = previewSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid preview criteria", "VALIDATION_ERROR", 422);
  }

  const preview = await previewDriveEligibleCount({
    institutionId,
    minCgpa: result.data.minCgpa,
    allowedBranches: result.data.allowedBranches,
    graduationYears: result.data.graduationYears,
  });

  return apiSuccess({ preview });
}
