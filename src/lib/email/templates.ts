/**
 * StepBridge.in — Transactional Responsive HTML Email Templates
 * Branded with StepBridge visual identity, modern typography, and Ravi Chauhan creator attribution.
 */

export function baseEmailLayout(contentHtml: string, previewText: string = "StepBridge Notification"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StepBridge.in</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F4F4F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181B; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; margin-top: 32px; margin-bottom: 32px; border: 1px solid #E4E4E7; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #09090B 0%, #18181B 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #27272A; }
    .logo { font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; text-decoration: none; }
    .logo span { color: #818CF8; }
    .content { padding: 36px 32px; }
    .footer { background-color: #FAFAF9; padding: 24px 32px; text-align: center; border-top: 1px solid #F4F4F5; font-size: 12px; color: #71717A; line-height: 1.5; }
    .btn { display: inline-block; background-color: #4F46E5; color: #FFFFFF !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; text-align: center; }
    .btn:hover { background-color: #4338CA; }
    .code-box { background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px; padding: 16px; text-align: center; font-family: monospace; font-size: 24px; font-weight: 700; color: #3730A3; letter-spacing: 4px; margin: 20px 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-primary { background-color: #EEF2FF; color: #4F46E5; }
    .badge-success { background-color: #ECFDF5; color: #059669; }
    .badge-warning { background-color: #FFFBEB; color: #D97706; }
    .creator-tag { font-size: 11px; color: #A1A1AA; margin-top: 12px; }
    .creator-tag a { color: #6366F1; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <!-- Hidden preview text for email clients -->
  <div style="display:none;font-size:1px;color:#F4F4F5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>

  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F4F4F5;">
    <tr>
      <td align="center">
        <div class="wrapper">
          <!-- Header -->
          <div class="header">
            <a href="https://stepbridge.in" class="logo">Step<span>Bridge</span>.in</a>
            <p style="margin: 6px 0 0 0; color: #A1A1AA; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
              Career Readiness & Placement SaaS
            </p>
          </div>

          <!-- Body Content -->
          <div class="content">
            ${contentHtml}
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0;">
              © ${new Date().getFullYear()} <strong>StepBridge.in</strong>. All rights reserved.
            </p>
            <p style="margin: 4px 0 0 0;">
              Bridging ambition with opportunity across students, colleges, and recruiters.
            </p>
            <div class="creator-tag">
              Crafted with purpose by <a href="https://www.linkedin.com/in/ravi-chauhan-44ba85290/" target="_blank" rel="noopener noreferrer">Ravi Chauhan</a>
            </div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Welcome Email
 */
export function renderWelcomeEmail(params: { name: string; role: string; dashboardUrl: string }) {
  const roleLabels: Record<string, string> = {
    STUDENT: "Student Candidate",
    COLLEGE_ADMIN: "College Training & Placement Officer",
    RECRUITER: "Verified Enterprise Recruiter",
    SUPER_ADMIN: "Platform Administrator",
  };

  const label = roleLabels[params.role] || "Member";

  const content = `
    <h1 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #18181B;">
      Welcome to StepBridge, ${params.name}! 👋
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      Your StepBridge account has been successfully initialized as a <span class="badge badge-primary">${label}</span>.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      StepBridge delivers personalized 12-domain career blueprints, transparent ATS resume scoring, placement drive automation, and recruiter talent discovery.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${params.dashboardUrl}" class="btn">Launch Your Workspace</a>
    </div>
    <p style="font-size: 13px; color: #71717A; line-height: 1.5;">
      Need help getting started? Check out the interactive blueprints or reply directly to this message.
    </p>
  `;

  return baseEmailLayout(content, `Welcome to StepBridge, ${params.name}!`);
}

/**
 * 2. Email Verification Email
 */
export function renderVerificationEmail(params: { name: string; token: string; verifyUrl: string }) {
  const content = `
    <h1 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #18181B;">
      Verify Your Email Address ✉️
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      Hi ${params.name}, thank you for registering with StepBridge. Please verify your email address to activate your full career-readiness workspace and placement drive access.
    </p>
    <div class="code-box">
      ${params.token}
    </div>
    <p style="font-size: 13px; color: #71717A; text-align: center;">
      This single-use verification token is valid for 24 hours.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${params.verifyUrl}" class="btn">Verify Email Online</a>
    </div>
    <p style="font-size: 12px; color: #A1A1AA; line-height: 1.4;">
      If you did not create a StepBridge account, you can safely ignore this email.
    </p>
  `;

  return baseEmailLayout(content, "Verify your StepBridge email address");
}

/**
 * 3. Password Reset Email
 */
export function renderPasswordResetEmail(params: { name: string; token: string; resetUrl: string }) {
  const content = `
    <h1 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #18181B;">
      Reset Your Password 🔒
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      Hello ${params.name}, we received a request to reset your StepBridge account password. Use the security token below or click the button to set a new password:
    </p>
    <div class="code-box">
      ${params.token}
    </div>
    <p style="font-size: 13px; color: #D97706; text-align: center; font-weight: 600;">
      ⏱️ For your security, this token expires in 30 minutes.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${params.resetUrl}" class="btn">Reset My Password</a>
    </div>
    <p style="font-size: 12px; color: #A1A1AA; line-height: 1.4;">
      If you did not request this password reset, please contact security immediately. Your account remains safe.
    </p>
  `;

  return baseEmailLayout(content, "Reset your StepBridge account password");
}

/**
 * 4. College Invitation Email
 */
export function renderCollegeInvitationEmail(params: {
  institutionName: string;
  inviterName: string;
  inviteUrl: string;
  department?: string;
}) {
  const content = `
    <h1 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #18181B;">
      You're Invited to Join ${params.institutionName} on StepBridge 🎓
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      ${params.inviterName} from <strong>${params.institutionName}</strong> has invited you to join the institutional placement and career readiness portal${
        params.department ? ` for the ${params.department} department` : ""
      }.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      Joining gives you immediate access to campus placement drives, domain roadmaps, verified skill assessments, and recruiter job listings.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${params.inviteUrl}" class="btn">Accept Invitation & Register</a>
    </div>
  `;

  return baseEmailLayout(content, `Invitation to join ${params.institutionName} on StepBridge`);
}

/**
 * 5. Recruiter Verification Status Update Email
 */
export function renderRecruiterVerificationEmail(params: {
  companyName: string;
  status: "APPROVED" | "REJECTED";
  reason?: string;
  portalUrl: string;
}) {
  const isApproved = params.status === "APPROVED";
  const content = `
    <h1 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #18181B;">
      Company Verification Update: ${params.companyName}
    </h1>
    <div style="margin: 16px 0;">
      <span class="badge ${isApproved ? "badge-success" : "badge-warning"}">
        ${isApproved ? "Verification Approved" : "Verification Rejected"}
      </span>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      ${
        isApproved
          ? `Congratulations! Your company <strong>${params.companyName}</strong> has been officially verified on StepBridge. You can now publish job opportunities, discover authorized student profiles, and manage placement drives.`
          : `We were unable to verify your company account for <strong>${params.companyName}</strong> at this time.`
      }
    </p>
    ${
      params.reason
        ? `<div style="background-color: #FAFAF9; border-left: 4px solid #71717A; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #3F3F46;">
            <strong>Administrator Note:</strong> ${params.reason}
          </div>`
        : ""
    }
    <div style="text-align: center; margin: 24px 0;">
      <a href="${params.portalUrl}" class="btn">Go to Recruiter Portal</a>
    </div>
  `;

  return baseEmailLayout(content, `Company Verification Status: ${params.status}`);
}

/**
 * 6. Application Confirmation Email
 */
export function renderApplicationConfirmationEmail(params: {
  studentName: string;
  roleTitle: string;
  companyName: string;
  appliedAt: string;
  dashboardUrl: string;
}) {
  const content = `
    <h1 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #18181B;">
      Application Submitted Successfully 🚀
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      Hi ${params.studentName}, your application for <strong>${params.roleTitle}</strong> at <strong>${params.companyName}</strong> has been submitted with your verified profile and resume snapshot.
    </p>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <div style="font-size: 13px; color: #64748B;">Applied Position: <strong style="color: #0F172A;">${params.roleTitle}</strong></div>
      <div style="font-size: 13px; color: #64748B; margin-top: 4px;">Company: <strong style="color: #0F172A;">${params.companyName}</strong></div>
      <div style="font-size: 13px; color: #64748B; margin-top: 4px;">Date: <strong style="color: #0F172A;">${params.appliedAt}</strong></div>
      <div style="font-size: 13px; color: #64748B; margin-top: 4px;">Initial Status: <strong style="color: #4F46E5;">APPLIED</strong></div>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${params.dashboardUrl}" class="btn">Track Application Stage</a>
    </div>
  `;

  return baseEmailLayout(content, `Application Confirmed: ${params.roleTitle} at ${params.companyName}`);
}

/**
 * 7. Application Stage Update Email
 */
export function renderApplicationStatusUpdateEmail(params: {
  studentName: string;
  roleTitle: string;
  companyName: string;
  newStage: string;
  note?: string;
  dashboardUrl: string;
}) {
  const stageLabels: Record<string, { label: string; badge: string }> = {
    SHORTLISTED: { label: "Profile Shortlisted", badge: "badge-success" },
    INTERVIEW: { label: "Interview Scheduled", badge: "badge-primary" },
    OFFERED: { label: "Offer Received 🎉", badge: "badge-success" },
    HIRED: { label: "Hired 🎉", badge: "badge-success" },
    REJECTED: { label: "Application Update", badge: "badge-warning" },
    WITHDRAWN: { label: "Application Withdrawn", badge: "badge-warning" },
  };

  const stageMeta = stageLabels[params.newStage] || { label: params.newStage, badge: "badge-primary" };

  const content = `
    <h1 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #18181B;">
      Application Update: ${params.roleTitle}
    </h1>
    <div style="margin: 16px 0;">
      <span class="badge ${stageMeta.badge}">${stageMeta.label}</span>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      Hi ${params.studentName}, your application for <strong>${params.roleTitle}</strong> at <strong>${params.companyName}</strong> has transitioned to stage: <strong>${params.newStage}</strong>.
    </p>
    ${
      params.note
        ? `<div style="background-color: #F8FAFC; border-left: 4px solid #4F46E5; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #334155;">
            <strong>Recruiter Message:</strong> ${params.note}
          </div>`
        : ""
    }
    <div style="text-align: center; margin: 24px 0;">
      <a href="${params.dashboardUrl}" class="btn">View Timeline & Next Steps</a>
    </div>
  `;

  return baseEmailLayout(content, `Update on your application at ${params.companyName}`);
}

/**
 * 8. Placement Drive Announcement Email
 */
export function renderPlacementDriveAnnouncementEmail(params: {
  collegeName: string;
  companyName: string;
  roleTitle: string;
  packageLpa: number | null;
  driveDate: string;
  deadline: string;
  registrationUrl: string;
}) {
  const content = `
    <h1 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #18181B;">
      New Campus Placement Drive Announced 📢
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      <strong>${params.collegeName}</strong> Training & Placement Cell has published a new campus recruitment drive with <strong>${params.companyName}</strong>.
    </p>
    <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <div style="font-size: 14px; font-weight: 700; color: #1E1B4B;">${params.companyName} — ${params.roleTitle}</div>
      <div style="font-size: 13px; color: #3730A3; margin-top: 6px;">CTC Package: <strong>₹${params.packageLpa || "Competitive"} LPA</strong></div>
      <div style="font-size: 13px; color: #3730A3; margin-top: 4px;">Drive Date: <strong>${params.driveDate}</strong></div>
      <div style="font-size: 13px; color: #DC2626; margin-top: 4px;">Registration Deadline: <strong>${params.deadline}</strong></div>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${params.registrationUrl}" class="btn">Register for Drive</a>
    </div>
  `;

  return baseEmailLayout(content, `New Placement Drive: ${params.companyName} at ${params.collegeName}`);
}

/**
 * 9. Account & Security Notification Email
 */
export function renderAccountNotificationEmail(params: {
  name: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionText?: string;
}) {
  const content = `
    <h1 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #18181B;">
      ${params.title}
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      Hi ${params.name},
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      ${params.body}
    </p>
    ${
      params.actionUrl
        ? `<div style="text-align: center; margin: 24px 0;">
            <a href="${params.actionUrl}" class="btn">${params.actionText || "View Details"}</a>
          </div>`
        : ""
    }
  `;

  return baseEmailLayout(content, params.title);
}
