import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyEmailSchema } from "@/lib/validation/schemas";
import { hashToken } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifyEmailSchema.safeParse(body);

    if (!result.success) {
      return apiError("Invalid verification token format", "VALIDATION_ERROR", 422);
    }

    const tokenHash = await hashToken(result.data.token);

    const emailToken = await prisma.emailToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!emailToken || emailToken.purpose !== "EMAIL_VERIFICATION") {
      return apiError("Verification token is invalid or does not exist", "INVALID_TOKEN", 400);
    }

    if (emailToken.usedAt) {
      return apiError("This verification token has already been used", "TOKEN_EXPIRED", 400);
    }

    if (new Date() > emailToken.expiresAt) {
      return apiError("This verification token has expired. Please request a new one.", "TOKEN_EXPIRED", 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: emailToken.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailToken.update({
        where: { id: emailToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          actorId: emailToken.userId,
          action: "EMAIL_VERIFIED",
          resource: `User:${emailToken.userId}`,
        },
      }),
    ]);

    return apiSuccess({ message: "Email successfully verified. You can now access your dashboard." });
  } catch (err) {
    console.error("Email verification error:", err);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
