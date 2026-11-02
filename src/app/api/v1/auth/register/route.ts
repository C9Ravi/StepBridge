import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validation/schemas";
import { hashPassword, generateCryptoToken, hashToken } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendNotification } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return apiError(
        "Validation failed",
        "VALIDATION_ERROR",
        422,
        result.error.flatten().fieldErrors
      );
    }

    const { name, email, password, role, institutionName, companyName } = result.data;

    // Check unique email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // PRD 12.1: Duplicate email returns a generic conflict response
      return apiError("An account with this email address already exists.", "CONFLICT", 409);
    }

    const passwordHash = await hashPassword(password);

    // Create user and tenant within a database transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          status: "ACTIVE", // Email verification is required before full student API access
        },
      });

      // Role-specific setup
      if (role === "STUDENT") {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            headline: "Aspiring Engineer",
            visibility: "INSTITUTION_ONLY",
            completionPercentage: 15,
          },
        });
      } else if (role === "COLLEGE_ADMIN" && institutionName) {
        // Pending verification tenant created (PRD 12.2)
        const institution = await tx.institution.create({
          data: {
            name: institutionName,
            domain: email.split("@")[1] || null,
            verificationStatus: "PENDING",
          },
        });
        await tx.institutionMembership.create({
          data: {
            userId: user.id,
            institutionId: institution.id,
            role: "COLLEGE_ADMIN",
            status: "ACTIVE",
            permissions: "all",
          },
        });
      } else if (role === "RECRUITER" && companyName) {
        // Pending verification company created (PRD 12.3)
        const company = await tx.company.create({
          data: {
            name: companyName,
            domain: email.split("@")[1] || null,
            verificationStatus: "PENDING",
          },
        });
        await tx.companyMembership.create({
          data: {
            userId: user.id,
            companyId: company.id,
            role: "COMPANY_ADMIN",
            status: "ACTIVE",
          },
        });
      }

      // Generate single-use verification token (24-hour expiry)
      const rawToken = generateCryptoToken();
      const tokenHash = await hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await tx.emailToken.create({
        data: {
          userId: user.id,
          tokenHash,
          purpose: "EMAIL_VERIFICATION",
          expiresAt,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "USER_REGISTER",
          resource: `User:${user.id}`,
          metadata: JSON.stringify({ role, email }),
        },
      });

      return { user, rawToken };
    });

    // Send email verification notification
    await sendNotification({
      userId: newUser.user.id,
      type: "SYSTEM_ALERT",
      title: "Verify your StepBridge.ai account",
      body: `Welcome to StepBridge.ai! Use your verification token: ${newUser.rawToken} to activate your account.`,
      sendEmail: true,
    });

    return apiSuccess(
      {
        userId: newUser.user.id,
        email: newUser.user.email,
        name: newUser.user.name,
        role: newUser.user.role,
        requiresVerification: true,
        // In local/test mode we return verificationToken for convenience
        ...(process.env.NODE_ENV !== "production" ? { debugToken: newUser.rawToken } : {}),
      },
      201
    );
  } catch (err: unknown) {
    console.error("Registration error:", err);
    return apiError("Internal server error during registration", "INTERNAL_ERROR", 500);
  }
}
