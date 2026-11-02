import { SessionPayload } from "../auth/session";

export type Role =
  | "STUDENT"
  | "COLLEGE_ADMIN"
  | "PLACEMENT_OFFICER"
  | "COMPANY_ADMIN"
  | "RECRUITER"
  | "SUPER_ADMIN";

export function isRole(session: SessionPayload | null, ...allowedRoles: Role[]): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role as Role);
}

export function assertSuperAdmin(session: SessionPayload | null): void {
  if (!session || session.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN: Requires Super Administrator privileges");
  }
}

export function assertCollegeStaff(session: SessionPayload | null): string {
  if (!session || !["COLLEGE_ADMIN", "PLACEMENT_OFFICER"].includes(session.role)) {
    throw new Error("FORBIDDEN: Requires College Placement Staff privileges");
  }
  if (!session.tenantId) {
    throw new Error("FORBIDDEN: No active institution membership found");
  }
  return session.tenantId;
}

export function assertCompanyRecruiter(session: SessionPayload | null): string {
  if (!session || !["COMPANY_ADMIN", "RECRUITER"].includes(session.role)) {
    throw new Error("FORBIDDEN: Requires Company Recruiter privileges");
  }
  if (!session.tenantId) {
    throw new Error("FORBIDDEN: No active company membership found");
  }
  return session.tenantId;
}

export function assertStudent(session: SessionPayload | null): string {
  if (!session || session.role !== "STUDENT") {
    throw new Error("FORBIDDEN: Requires Student privileges");
  }
  return session.userId;
}

/**
 * Validates tenant scoping: prevents cross-tenant data leaks and IDOR.
 */
export function validateTenantAccess(
  session: SessionPayload,
  resourceTenantId: string | null | undefined
): boolean {
  if (session.role === "SUPER_ADMIN") return true;
  if (!resourceTenantId || !session.tenantId) return false;
  return session.tenantId === resourceTenantId;
}
