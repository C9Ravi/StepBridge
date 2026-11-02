import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { isRole, validateTenantAccess } from "@/lib/permissions/rbac";
import { registerSchema, passwordSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";

describe("Phase 0 Foundation Tests", () => {
  it("verifies password hashing and checking", async () => {
    const raw = "SuperSecret2026!";
    const hash = await hashPassword(raw);
    expect(hash).not.toBe(raw);
    const valid = await verifyPassword(raw, hash);
    expect(valid).toBe(true);
    const invalid = await verifyPassword("WrongPassword123!", hash);
    expect(invalid).toBe(false);
  });

  it("verifies JWT session creation and verification", async () => {
    const sessionPayload = {
      userId: "test-user-id",
      email: "test@stepbridge.ai",
      name: "Test User",
      role: "STUDENT" as const,
      status: "ACTIVE",
    };
    const token = await createSessionToken(sessionPayload);
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(sessionPayload.userId);
    expect(decoded?.role).toBe(sessionPayload.role);
  });

  it("enforces password complexity schema", () => {
    // Min 10 chars, uppercase, number
    expect(passwordSchema.safeParse("short1A!").success).toBe(false);
    expect(passwordSchema.safeParse("alllowercase1234").success).toBe(false);
    expect(passwordSchema.safeParse("ALLUPPERCASE1234").success).toBe(false);
    expect(passwordSchema.safeParse("ValidPass123!").success).toBe(true);
  });

  it("validates RBAC and tenant scoping rules", () => {
    const studentSession = {
      userId: "u1",
      email: "s@nitb.ac.in",
      name: "Student",
      role: "STUDENT",
      tenantId: "inst_123",
      status: "ACTIVE",
    };

    expect(isRole(studentSession, "STUDENT")).toBe(true);
    expect(isRole(studentSession, "COLLEGE_ADMIN")).toBe(false);

    // Tenant boundary checks
    expect(validateTenantAccess(studentSession, "inst_123")).toBe(true);
    expect(validateTenantAccess(studentSession, "other_inst_456")).toBe(false);

    // Super Admin can access cross-tenant
    const superAdminSession = {
      userId: "admin1",
      email: "admin@stepbridge.ai",
      name: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    };
    expect(validateTenantAccess(superAdminSession, "other_inst_456")).toBe(true);
  });

  it("verifies database connectivity and seeded data", async () => {
    const rolesCount = await prisma.role.count();
    expect(rolesCount).toBeGreaterThan(0);

    const skillsCount = await prisma.skill.count();
    expect(skillsCount).toBeGreaterThan(0);

    const admin = await prisma.user.findUnique({
      where: { email: "admin@stepbridge.ai" },
    });
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe("SUPER_ADMIN");
  });
});
