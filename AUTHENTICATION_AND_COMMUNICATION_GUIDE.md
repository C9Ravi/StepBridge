# StepBridge.in — Production Authentication, Google OAuth & Communication Integration Guide

**Platform**: StepBridge.in — Career-Readiness Intelligence SaaS  
**Author**: Antigravity Full-Stack Product Engineering  
**Creator Attribution**: Crafted with purpose by [Ravi Chauhan](https://www.linkedin.com/in/ravi-chauhan-44ba85290/)  
**Environment**: Next.js 16 (App Router, Turbopack) • React 19 • Prisma ORM • SQLite / PostgreSQL  

---

## 1. Architectural Overview

StepBridge.in features an enterprise-grade, multi-tenant authentication and transactional communication system designed for high security, seamless user experience, and zero-downtime scalability across students, colleges, recruiters, and platform administrators.

```
                    ┌───────────────────────────────────┐
                    │      Client Browser (Next.js)     │
                    │  /login  /register  /verify-email │
                    └─────────────────┬─────────────────┘
                                      │
            ┌─────────────────────────┴────────────────────────┐
            │                                                  │
            ▼                                                  ▼
┌───────────────────────────────┐              ┌───────────────────────────────┐
│     Google OAuth 2.0 (PKCE)    │              │   Credentials Authentication  │
│  /api/auth/google             │              │  /api/v1/auth/login           │
│  /api/auth/callback/google    │              │  /api/v1/auth/register        │
└───────────────┬───────────────┘              └───────────────┬───────────────┘
                │                                              │
                ▼                                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Core Auth & Security Service                      │
│   • PKCE S256 Challenge/Verifier          • Bcrypt Password Hashing          │
│   • Account Takeover Prevention           • SHA-256 Single-Use Tokens        │
│   • Role-Based Access Enforcement         • Server Session Revocation        │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐              ┌───────────────────────────────┐
│     Prisma Database Engine    │              │ Transactional Communication   │
│  • User         • Account     │              │  • Resend API (HTTP v1)       │
│  • Session      • EmailToken  │              │  • 9 Branded HTML Templates   │
│  • Notification • Preferences │              │  • Dev Console Fallback       │
└───────────────────────────────┘              └───────────────────────────────┘
```

---

## 2. Google Cloud Console Configuration

To enable live Google authentication on local development and production, follow these steps:

### Step 2.1 — Create or Select a Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select an existing project or click **New Project** (e.g., `stepbridge-production`).

### Step 2.2 — Configure the OAuth Consent Screen
1. Go to **APIs & Services** &rarr; **OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the App Information:
   - **App name**: `StepBridge.in`
   - **User support email**: `support@stepbridge.in` (or your administrator email)
   - **Developer contact information**: `ravi.chauhan@jcbust.ac.in`
4. In the **Scopes** step, click **Add or Remove Scopes** and select:
   - `.../auth/userinfo.email` (See your primary Google Account email address)
   - `.../auth/userinfo.profile` (See your personal info, including any personal info you've made publicly available)
   - `openid` (Associate you with your personal info on Google)
   *(Do NOT request any extra permissions such as Drive, Calendar, or Gmail).*
5. Add test users (for development mode) and save.

### Step 2.3 — Create OAuth 2.0 Credentials
1. Go to **APIs & Services** &rarr; **Credentials**.
2. Click **+ Create Credentials** &rarr; **OAuth client ID**.
3. Select **Application type**: `Web application`.
4. Name: `StepBridge Web Client`.
5. **Authorized JavaScript origins**:
   - Local: `http://localhost:3000`
   - Production: `https://stepbridge.in`
6. **Authorized redirect URIs**:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://stepbridge.in/api/auth/callback/google`
7. Click **Create** to receive:
   - **Client ID** &rarr; Maps to `AUTH_GOOGLE_ID`
   - **Client Secret** &rarr; Maps to `AUTH_GOOGLE_SECRET`

---

## 3. Environment Variables Reference

Add the following to your local `.env` or production deployment dashboard (e.g., Vercel, Railway, AWS):

```bash
# Core Application
APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# Session Security (32+ character random string)
AUTH_SECRET=stepbridge_jwt_secret_development_key_32_characters_minimum_length
NEXTAUTH_SECRET=stepbridge_jwt_secret_development_key_32_characters_minimum_length

# Google OAuth 2.0
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-your-google-client-secret

# Transactional Email (Resend)
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM="StepBridge.in Notifications <notifications@stepbridge.in>"

# Lifespans
JWT_EXPIRES_IN=7d
EMAIL_VERIFY_TOKEN_EXPIRES_HOURS=24
PASSWORD_RESET_TOKEN_EXPIRES_MINUTES=30
```

> [!NOTE]
> When `AUTH_GOOGLE_ID` or `AUTH_GOOGLE_SECRET` is omitted or empty, StepBridge handles requests gracefully: clicking "Continue with Google" redirects back to `/login` with an informative banner explaining that credentials need to be configured, without throwing unhandled server exceptions.

---

## 4. Email Communication System & Templates

StepBridge integrates directly with the **Resend API** for high-deliverability transactional emails, backed by a **zero-dependency developer console fallback logger** when `RESEND_API_KEY` is not yet configured.

### The 9 Responsive Branded Templates
Every email is built with the StepBridge dark/indigo palette, clean typography, mobile-first responsive layout, and Ravi Chauhan creator attribution:

1. **Welcome Email** (`renderWelcomeEmail`): Dispatched upon registration or first Google OAuth sign-in.
2. **Email Verification** (`renderVerificationEmail`): Contains single-use 6-digit code and direct 1-click verification link to `/verify-email?token=...`.
3. **Password Reset** (`renderPasswordResetEmail`): Contains single-use security token and 30-minute expiration countdown link to `/reset-password?token=...`.
4. **College Invitation** (`renderCollegeInvitationEmail`): Sent by TPOs to invite students or department faculty.
5. **Recruiter Verification** (`renderRecruiterVerificationEmail`): Automated notice when an enterprise company is approved or rejected by Super Admin.
6. **Application Confirmation** (`renderApplicationConfirmationEmail`): Sent to student upon applying to an opportunity with immutable snapshot ID.
7. **Application Stage Update** (`renderApplicationStageEmail`): Alerts student when shortlisted, scheduled for interview, or offered.
8. **Placement Drive Announcement** (`renderDriveAnnouncementEmail`): Broadcast to eligible batch students for upcoming campus drives.
9. **Account Security Alert** (`renderNotificationEmail`): Critical login alerts and profile security updates.

### Setting Up Resend
1. Create a free account at [resend.com](https://resend.com).
2. Generate an API Key under **API Keys** &rarr; copy into `RESEND_API_KEY`.
3. Add and verify your domain under **Domains** (add the provided SPF, DKIM, and DMARC DNS records).
4. Set `EMAIL_FROM` to your verified domain (e.g., `notifications@stepbridge.in`).

---

## 5. Security & Account Linking Protections

### Account Takeover (ATO) Prevention
When a user signs in via Google OAuth with an email matching an existing account created via email/password:
- If `profile.email_verified === true`, Google has verified that the user controls that email address. Safe automatic linking occurs, creating an `Account` record and persisting the Google provider details.
- If `profile.email_verified === false`, **automatic linking is strictly blocked** with an explicit `Security alert: The Google account email is not verified`. This prevents attackers from claiming an existing account using an unverified Google account.

### Single-Use SHA-256 Cryptographic Tokens
- Password reset and email verification tokens are generated using `crypto.getRandomValues()` (256-bit entropy).
- Tokens are stored in the database **only as SHA-256 hashes** (`tokenHash`). Even with full database access, raw tokens cannot be recovered.
- Tokens expire strictly after 30 minutes (password reset) or 24 hours (verification) and are marked `usedAt: new Date()` upon single use.

### Session Revocation
- Resetting a password automatically invokes `revokeServerSessions(userId)`, invalidating all active sessions in `prisma.session`.
- Logging out invalidates the server session record, sets cookie max-age to 0, and clears sessionStorage client-side.

---

## 6. Current Implementation Status & Credentials Checklist

| Feature | Status | Verification Mechanism | Notes |
| :--- | :---: | :--- | :--- |
| **Google OAuth Flow (PKCE S256)** | ✅ Functional | Vitest + Route Handlers | Ready for live Google Client ID |
| **Account Takeover Prevention** | ✅ Verified | Automated Integration Test | Blocks unverified Google emails |
| **Email & Password Registration** | ✅ Functional | Form + API validation | Password complexity enforced |
| **Email Verification (/verify-email)** | ✅ Functional | UI + API + Token Lifecycle | Supports 1-click & manual code |
| **Password Reset (/reset-password)** | ✅ Functional | UI + API + Session Revocation | Enforces 30-min token limit |
| **9 Branded Email Templates** | ✅ Functional | Unit tests + HTML preview | Ravi Chauhan attribution included |
| **Resend Integration** | ✅ Functional | API client + Dev console mock | Operates offline / with real key |
| **In-App Notification Center** | ✅ Functional | Navbar popover + API | Unread count badge, mark all read |
| **Notification Preferences** | ✅ Functional | GET / PUT API routes | Email, in-app & digest schedules |
| **Live Google OAuth Credentials** | ⏳ Awaiting Setup | User input in `.env` | Set `AUTH_GOOGLE_ID` & Secret |
| **Live Resend API Key** | ⏳ Awaiting Setup | User input in `.env` | Set `RESEND_API_KEY` |

---

## 7. Automated Test Suite Summary

Run the comprehensive authentication and communication test suite at any time:

```bash
npx vitest run tests/integration/auth_google_communication.test.ts
```

All 66 tests across 11 test suites pass with 100% success rate:
- `auth_google_communication.test.ts` (15/15 tests passed)
- `auth_and_tenant.test.ts` (5/5 tests passed)
- `auth_and_billing_complete.test.ts` (5/5 tests passed)
- `tpo_recruiter_complete.test.ts` (11/11 tests passed)
- `career_domains.test.ts` (9/9 tests passed)
- `foundation.test.ts` (5/5 tests passed)
- `college_operations.test.ts` (4/4 tests passed)
- `career_intelligence.test.ts` (3/3 tests passed)
- `student_profile_resume.test.ts` (4/4 tests passed)
- `opportunities_applications.test.ts` (2/2 tests passed)
- `recruiter_workspace.test.ts` (3/3 tests passed)

---
*StepBridge.in — Crafted with purpose by Ravi Chauhan (JCBUST, YMCA Faridabad)*
