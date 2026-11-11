import { prisma } from "../db/prisma";
import {
  renderWelcomeEmail,
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderCollegeInvitationEmail,
  renderRecruiterVerificationEmail,
  renderApplicationConfirmationEmail,
  renderApplicationStatusUpdateEmail,
  renderPlacementDriveAnnouncementEmail,
  renderAccountNotificationEmail,
} from "./templates";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: "resend" | "mock_dev" | "error";
  error?: string;
}

export interface SendNotificationParams {
  userId: string;
  type: "APPLICATION_STAGE" | "DRIVE_ALERT" | "SYSTEM_ALERT" | "ROADMAP_REMINDER";
  title: string;
  body: string;
  actionUrl?: string;
  sendEmail?: boolean;
}

/**
 * Core transactional email dispatcher.
 * Integrates Resend API when RESEND_API_KEY is configured,
 * otherwise logs cleanly to the console/audit system in development.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || "StepBridge <notifications@stepbridge.in>";

  // 1. Resend API Integration
  if (apiKey && !apiKey.startsWith("mock") && apiKey.length > 10) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text || params.subject,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Resend API returned error:", errorText);
        return { success: false, provider: "error", error: errorText };
      }

      const data = await response.json();
      return { success: true, messageId: data.id, provider: "resend" };
    } catch (err: unknown) {
      console.error("Failed to send email via Resend:", err);
      return {
        success: false,
        provider: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  // 2. Development / Local Fallback Dispatcher
  const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.log(
    `\n📧 [TRANSACTIONAL EMAIL DISPATCHED] -> To: ${params.to} | Subject: "${params.subject}" (MsgId: ${mockId})`
  );
  return { success: true, messageId: mockId, provider: "mock_dev" };
}

/**
 * 1. Send Welcome Email
 */
export async function sendWelcomeEmail(to: string, name: string, role: string) {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const dashboardUrl = `${appUrl}/${role === "COLLEGE_ADMIN" ? "college" : role === "RECRUITER" ? "recruiter" : role === "SUPER_ADMIN" ? "admin" : "student"}`;
  const html = renderWelcomeEmail({ name, role, dashboardUrl });
  return sendEmail({
    to,
    subject: `Welcome to StepBridge, ${name}! 👋`,
    html,
  });
}

/**
 * 2. Send Email Verification
 */
export async function sendVerificationEmail(to: string, name: string, rawToken: string) {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;
  const html = renderVerificationEmail({ name, token: rawToken, verifyUrl });
  return sendEmail({
    to,
    subject: "Verify your StepBridge.in email address",
    html,
  });
}

/**
 * 3. Send Password Reset Email
 */
export async function sendPasswordResetEmail(to: string, name: string, rawToken: string) {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
  const html = renderPasswordResetEmail({ name, token: rawToken, resetUrl });
  return sendEmail({
    to,
    subject: "Reset your StepBridge.in password",
    html,
  });
}

/**
 * 4. Send College Invitation Email
 */
export async function sendCollegeInvitationEmail(params: {
  to: string;
  institutionName: string;
  inviterName: string;
  inviteToken: string;
  department?: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/register?invite=${params.inviteToken}`;
  const html = renderCollegeInvitationEmail({
    institutionName: params.institutionName,
    inviterName: params.inviterName,
    inviteUrl,
    department: params.department,
  });
  return sendEmail({
    to: params.to,
    subject: `Invitation to join ${params.institutionName} on StepBridge`,
    html,
  });
}

/**
 * 5. Send Recruiter Verification Update Email
 */
export async function sendRecruiterVerificationEmail(params: {
  to: string;
  companyName: string;
  status: "APPROVED" | "REJECTED";
  reason?: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const portalUrl = `${appUrl}/recruiter`;
  const html = renderRecruiterVerificationEmail({
    companyName: params.companyName,
    status: params.status,
    reason: params.reason,
    portalUrl,
  });
  return sendEmail({
    to: params.to,
    subject: `StepBridge Company Verification: ${params.status}`,
    html,
  });
}

/**
 * 6. Send Application Confirmation Email
 */
export async function sendApplicationConfirmationEmail(params: {
  to: string;
  studentName: string;
  roleTitle: string;
  companyName: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const dashboardUrl = `${appUrl}/student`;
  const html = renderApplicationConfirmationEmail({
    studentName: params.studentName,
    roleTitle: params.roleTitle,
    companyName: params.companyName,
    appliedAt: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
    dashboardUrl,
  });
  return sendEmail({
    to: params.to,
    subject: `Application Confirmed: ${params.roleTitle} at ${params.companyName}`,
    html,
  });
}

/**
 * 7. Send Application Stage Update Email
 */
export async function sendApplicationStageEmail(params: {
  to: string;
  studentName: string;
  roleTitle: string;
  companyName: string;
  newStage: string;
  note?: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const dashboardUrl = `${appUrl}/student`;
  const html = renderApplicationStatusUpdateEmail({
    studentName: params.studentName,
    roleTitle: params.roleTitle,
    companyName: params.companyName,
    newStage: params.newStage,
    note: params.note,
    dashboardUrl,
  });
  return sendEmail({
    to: params.to,
    subject: `Application Stage Update: ${params.roleTitle} (${params.newStage})`,
    html,
  });
}

/**
 * 8. Send Placement Drive Announcement Email
 */
export async function sendDriveAnnouncementEmail(params: {
  to: string;
  collegeName: string;
  companyName: string;
  roleTitle: string;
  packageLpa: number | null;
  driveDate: string;
  deadline: string;
  driveId: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const registrationUrl = `${appUrl}/student`;
  const html = renderPlacementDriveAnnouncementEmail({
    collegeName: params.collegeName,
    companyName: params.companyName,
    roleTitle: params.roleTitle,
    packageLpa: params.packageLpa,
    driveDate: params.driveDate,
    deadline: params.deadline,
    registrationUrl,
  });
  return sendEmail({
    to: params.to,
    subject: `Campus Drive Alert: ${params.companyName} at ${params.collegeName}`,
    html,
  });
}

/**
 * Backward-compatible composite notification dispatcher.
 * Creates an in-app Notification record in DB and dispatches transactional email when sendEmail is true.
 */
export async function sendNotification(params: SendNotificationParams) {
  // 1. Create in-app notification record in DB
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      actionUrl: params.actionUrl,
    },
  });

  // 2. Dispatch email if requested
  if (params.sendEmail) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      const html = renderAccountNotificationEmail({
        name: user.name,
        title: params.title,
        body: params.body,
        actionUrl: params.actionUrl,
      });

      await sendEmail({
        to: user.email,
        subject: params.title,
        html,
        text: params.body,
      });
    }
  }

  return notification;
}
