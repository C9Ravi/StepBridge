import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getCollegeCohortAnalytics } from "@/modules/institutions/collegeService";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true, name: true, city: true, state: true, verificationStatus: true },
  });

  const analytics = await getCollegeCohortAnalytics(institutionId);

  return apiSuccess({
    institution,
    analytics,
  });
}
