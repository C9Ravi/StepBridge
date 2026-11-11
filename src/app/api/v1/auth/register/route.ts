import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validation/schemas";
import { hashPassword, generateCryptoToken, hashToken } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendVerificationEmail, sendNotification } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || "Invalid registration information. Please check your inputs.";
      return apiError(
        firstErrorMessage,
        "VALIDATION_ERROR",
        422,
        fieldErrors
      );
    }

    const { name, email, password, role, institutionName, companyName, city, location } = result.data;

    // Validate role-specific tenant fields
    if (role === "COLLEGE_ADMIN" && (!institutionName || institutionName.trim().length < 2)) {
      return apiError(
        "Institution name is required for College TPO accounts (minimum 2 characters).",
        "VALIDATION_ERROR",
        422,
        { institutionName: ["Institution name is required"] }
      );
    }

    if (role === "RECRUITER" && (!companyName || companyName.trim().length < 2)) {
      return apiError(
        "Company name is required for Recruiter accounts (minimum 2 characters).",
        "VALIDATION_ERROR",
        422,
        { companyName: ["Company name is required"] }
      );
    }

    // Check unique email (case-insensitive normalized)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // PRD 12.1: Duplicate email returns a clear conflict response
      return apiError("An account with this email address already exists. Please sign in instead.", "CONFLICT", 409);
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

    // Send branded verification email
    await sendVerificationEmail(newUser.user.email, newUser.user.name, newUser.rawToken);

    // Send in-app notification
    await sendNotification({
      userId: newUser.user.id,
      type: "SYSTEM_ALERT",
      title: "Verify your StepBridge.in account",
      body: `Welcome to StepBridge.in! Use your verification token: ${newUser.rawToken} to activate your account.`,
      sendEmail: false, // Already dispatched via sendVerificationEmail
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
