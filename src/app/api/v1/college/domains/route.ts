import { getSession } from "@/lib/auth/session";
import { assertCollegeStaff } from "@/lib/permissions/rbac";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getCollegeDomainAnalytics } from "@/modules/institutions/collegeService";

export async function GET() {
  const session = await getSession();
  let institutionId: string;
  try {
    institutionId = assertCollegeStaff(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return apiError(msg, "FORBIDDEN", 403);
  }

  const domainAnalytics = await getCollegeDomainAnalytics(institutionId);

  return apiSuccess({
    totalDomains: domainAnalytics.length,
    domains: domainAnalytics,
  });
}
