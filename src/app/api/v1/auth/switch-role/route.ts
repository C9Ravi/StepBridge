import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSessionToken, setSessionCookie, hashToken } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role } = body;

    if (!role || !["COLLEGE_ADMIN", "RECRUITER", "STUDENT", "SUPER_ADMIN"].includes(role)) {
      return apiError("Invalid target role for demo session switch", "VALIDATION_ERROR", 400);
    }

    let user = null;

    if (role === "COLLEGE_ADMIN") {
      user = await prisma.user.findFirst({
        where: {
          role: "COLLEGE_ADMIN",
          email: { in: ["tpo@jcbust.ac.in", "tpo@nitb.ac.in"] },
        },
        include: { institutionMemberships: true },
      });
      if (!user) {
        user = await prisma.user.findFirst({
          where: { role: "COLLEGE_ADMIN" },
          include: { institutionMemberships: true },
        });
      }
    } else if (role === "RECRUITER") {
      user = await prisma.user.findFirst({
        where: {
          role: "RECRUITER",
          email: "ananya.recruiter@techcorp-innovations.io",
        },
        include: { companyMemberships: true },
      });
      if (!user) {
        user = await prisma.user.findFirst({
          where: { role: "RECRUITER" },
          include: { companyMemberships: true },
        });
      }
    } else if (role === "STUDENT") {
      user = await prisma.user.findFirst({
        where: {
          role: "STUDENT",
          email: { in: ["ravi.chauhan@jcbust.ac.in", "aarav.patel@nitb.ac.in"] },
        },
        include: { studentProfile: true },
      });
      if (!user) {
        user = await prisma.user.findFirst({
          where: { role: "STUDENT" },
          include: { studentProfile: true },
        });
      }
    } else if (role === "SUPER_ADMIN") {
      user = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
      });
    }

    if (!user) {
      return apiError(`No active account found for role ${role}`, "NOT_FOUND", 404);
    }

    // Derive tenant context
    let tenantId: string | undefined = undefined;
    let tenantType: "INSTITUTION" | "COMPANY" | "NONE" = "NONE";

    const instMemberships = (user as unknown as { institutionMemberships?: Array<{ institutionId: string }> }).institutionMemberships;
    const compMemberships = (user as unknown as { companyMemberships?: Array<{ companyId: string }> }).companyMemberships;
    const stdProfile = (user as unknown as { studentProfile?: { institutionId?: string } }).studentProfile;

    if (instMemberships && instMemberships.length > 0) {
      tenantId = instMemberships[0].institutionId;
      tenantType = "INSTITUTION";
    } else if (compMemberships && compMemberships.length > 0) {
      tenantId = compMemberships[0].companyId;
      tenantType = "COMPANY";
    } else if (stdProfile?.institutionId) {
      tenantId = stdProfile.institutionId;
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

    // Save session in DB
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        deviceInfo: req.headers.get("user-agent") || "demo-switcher",
      },
    });

    const destination =
      role === "STUDENT"
        ? "/student"
        : role === "COLLEGE_ADMIN"
        ? "/college"
        : role === "RECRUITER"
        ? "/recruiter"
        : "/admin";

    return apiSuccess({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId,
      },
      destination,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Role switch failed";
    return apiError(msg, "INTERNAL_ERROR", 500);
  }
}
