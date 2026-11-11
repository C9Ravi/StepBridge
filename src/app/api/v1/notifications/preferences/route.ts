import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthenticated", "UNAUTHENTICATED", 401);
  }

  let preference = await prisma.notificationPreference.findUnique({
    where: { userId: session.userId },
  });

  if (!preference) {
    preference = await prisma.notificationPreference.create({
      data: {
        userId: session.userId,
        emailEnabled: true,
        inAppEnabled: true,
        digestSchedule: "WEEKLY",
      },
    });
  }

  return apiSuccess(preference);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthenticated", "UNAUTHENTICATED", 401);
  }

  try {
    const body = await req.json();
    const { emailEnabled, inAppEnabled, digestSchedule } = body;

    const validSchedules = ["IMMEDIATE", "DAILY", "WEEKLY"];
    const schedule = validSchedules.includes(digestSchedule) ? digestSchedule : "WEEKLY";

    const preference = await prisma.notificationPreference.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        emailEnabled: typeof emailEnabled === "boolean" ? emailEnabled : true,
        inAppEnabled: typeof inAppEnabled === "boolean" ? inAppEnabled : true,
        digestSchedule: schedule,
      },
      update: {
        ...(typeof emailEnabled === "boolean" ? { emailEnabled } : {}),
        ...(typeof inAppEnabled === "boolean" ? { inAppEnabled } : {}),
        ...(digestSchedule && validSchedules.includes(digestSchedule) ? { digestSchedule } : {}),
      },
    });

    return apiSuccess({
      preference,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error("[NOTIFICATION_PREFS_ERROR]", error);
    return apiError("Failed to update preferences", "INVALID_REQUEST", 400);
  }
}
