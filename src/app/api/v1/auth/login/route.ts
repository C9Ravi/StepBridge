import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/schemas";
import { verifyPassword, createSessionToken, setSessionCookie, hashToken } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return apiError(
        "Invalid credentials",
        "VALIDATION_ERROR",
        422,
        result.error.flatten().fieldErrors
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        institutionMemberships: true,
        companyMemberships: true,
        studentProfile: true,
      },
    });

    if (!user) {
      return apiError("Invalid email or password", "UNAUTHORIZED", 401);
    }

    // FR-AUTH-05: Suspended users are blocked server-side
    if (user.status === "SUSPENDED") {
      return apiError("Your account has been suspended. Please contact support.", "ACCOUNT_SUSPENDED", 403);
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return apiError("Invalid email or password", "UNAUTHORIZED", 401);
    }

    // Derive tenant context from active membership
    let tenantId: string | undefined = undefined;
    let tenantType: "INSTITUTION" | "COMPANY" | "NONE" = "NONE";

    if (user.institutionMemberships.length > 0) {
      tenantId = user.institutionMemberships[0].institutionId;
      tenantType = "INSTITUTION";
    } else if (user.companyMemberships.length > 0) {
      tenantId = user.companyMemberships[0].companyId;
      tenantType = "COMPANY";
    } else if (user.studentProfile?.institutionId) {
      tenantId = user.studentProfile.institutionId;
      tenantType = "INSTITUTION";
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId,
      tenantType,
      status: user.status,
    };

    const token = await createSessionToken(sessionPayload);
    await setSessionCookie(token);

    // Save session in database for revocation tracking
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        deviceInfo: req.headers.get("user-agent") || "unknown",
      },
    });

    // Audit log authentication event
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_LOGIN",
        resource: `User:${user.id}`,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return apiSuccess({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: !!user.emailVerifiedAt,
        tenantId,
        tenantType,
      },
      token,
    });
  } catch (err: unknown) {
    console.error("Login error:", err);
    return apiError("Internal server error during login", "INTERNAL_ERROR", 500);
  }
}
