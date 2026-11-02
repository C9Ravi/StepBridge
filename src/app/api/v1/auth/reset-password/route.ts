import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { hashToken, hashPassword } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return apiError(
        "Invalid reset data",
        "VALIDATION_ERROR",
        422,
        result.error.flatten().fieldErrors
      );
    }

    const { token, newPassword } = result.data;
    const tokenHash = await hashToken(token);

    const emailToken = await prisma.emailToken.findUnique({
      where: { tokenHash },
    });

    if (!emailToken || emailToken.purpose !== "PASSWORD_RESET") {
      return apiError("Invalid reset token", "INVALID_TOKEN", 400);
    }

    if (emailToken.usedAt || new Date() > emailToken.expiresAt) {
      return apiError("Reset token has expired or has already been used", "TOKEN_EXPIRED", 400);
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: emailToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      // Mark token used
      prisma.emailToken.update({
        where: { id: emailToken.id },
        data: { usedAt: new Date() },
      }),
      // PRD 12.15: Successful reset revokes active sessions
      prisma.session.updateMany({
        where: { userId: emailToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      // Audit log
      prisma.auditLog.create({
        data: {
          actorId: emailToken.userId,
          action: "PASSWORD_RESET_SUCCESS",
          resource: `User:${emailToken.userId}`,
        },
      }),
    ]);

    return apiSuccess({ message: "Password has been successfully reset. Please log in with your new credentials." });
  } catch (err) {
    console.error("Reset password error:", err);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
