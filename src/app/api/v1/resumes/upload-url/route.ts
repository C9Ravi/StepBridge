import { getSession } from "@/lib/auth/session";
import { assertStudent } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST() {
  const session = await getSession();
  try {
    assertStudent(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const uploadId = "upload_" + Math.random().toString(36).substring(2, 10);
  const key = `resumes/${session!.userId}/${uploadId}.pdf`;

  return apiSuccess({
    uploadUrl: `/api/v1/resumes`,
    storageKey: key,
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB (PRD 12.5)
    allowedMimeTypes: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  });
}
