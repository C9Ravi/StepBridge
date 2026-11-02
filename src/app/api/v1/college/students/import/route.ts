import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { importStudentsFromCsv } from "@/modules/institutions/collegeService";
import { z } from "zod";

const importSchema = z.object({
  records: z.array(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      departmentCode: z.string().min(2),
      graduationYear: z.number().int().min(2020).max(2035),
      cgpa: z.number().min(0).max(10).optional(),
    })
  ).min(1, "At least one student record is required"),
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
  const result = importSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid import records format", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  const importResult = await importStudentsFromCsv({
    institutionId,
    records: result.data.records,
  });

  return apiSuccess({ result: importResult });
}
