import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { generateCryptoToken, hashToken } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendNotification } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return apiError("Invalid email address", "VALIDATION_ERROR", 422);
    }

    const { email } = result.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // PRD 12.15: Forgot password response must not reveal whether an email exists
    if (user && user.status !== "SUSPENDED") {
      const rawToken = generateCryptoToken();
      const tokenHash = await hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await prisma.emailToken.create({
        data: {
          userId: user.id,
          tokenHash,
          purpose: "PASSWORD_RESET",
          expiresAt,
        },
      });

      await sendNotification({
        userId: user.id,
        type: "SYSTEM_ALERT",
        title: "StepBridge.ai Password Reset Request",
        body: `Use this single-use code to reset your password: ${rawToken} (Valid for 30 minutes).`,
        sendEmail: true,
      });

      if (process.env.NODE_ENV !== "production") {
        return apiSuccess({
          message: "If this email exists in our system, password reset instructions have been sent.",
          debugToken: rawToken,
        });
      }
    }

    return apiSuccess({
      message: "If this email exists in our system, password reset instructions have been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
