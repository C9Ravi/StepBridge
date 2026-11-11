import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { broadcastCollegeNotification } from "@/modules/institutions/collegeService";
import { z } from "zod";

const broadcastSchema = z.object({
  title: z.string().min(3).max(150),
  body: z.string().min(5).max(1000),
  type: z.enum(["CAMPUS_ANNOUNCEMENT", "DRIVE_ALERT"]).optional(),
  actionUrl: z.string().optional(),
  batchId: z.string().uuid().optional(),
  minCgpa: z.number().min(0).max(10).optional(),
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
  const result = broadcastSchema.safeParse(body);
  if (!result.success) {
    return apiError("Invalid notification broadcast payload", "VALIDATION_ERROR", 422, result.error.flatten().fieldErrors);
  }

  try {
    const res = await broadcastCollegeNotification({
      institutionId,
      title: result.data.title,
      body: result.data.body,
      type: result.data.type,
      actionUrl: result.data.actionUrl,
      batchId: result.data.batchId,
      minCgpa: result.data.minCgpa,
    });

    return apiSuccess({ result: res }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Broadcast failed";
    return apiError(msg, "BAD_REQUEST", 400);
  }
}
