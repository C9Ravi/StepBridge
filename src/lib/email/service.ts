import { prisma } from "../db/prisma";

export interface SendNotificationParams {
  userId: string;
  type: "APPLICATION_STAGE" | "DRIVE_ALERT" | "SYSTEM_ALERT" | "ROADMAP_REMINDER";
  title: string;
  body: string;
  actionUrl?: string;
  sendEmail?: boolean;
}

export async function sendNotification(params: SendNotificationParams) {
  // 1. Create in-app notification record
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      actionUrl: params.actionUrl,
    },
  });

  // 2. Dispatch email if enabled
  if (params.sendEmail) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, name: true },
    });

    if (user) {
      if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("mock")) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || "notifications@stepbridge.ai",
              to: user.email,
              subject: params.title,
              text: params.body,
            }),
          });
        } catch (err) {
          console.error("Failed to send transactional email via Resend:", err);
        }
      } else {
        console.log(`[EMAIL NOTIFICATION TO: ${user.email}] Subject: ${params.title} | ${params.body}`);
      }
    }
  }

  return notification;
}
