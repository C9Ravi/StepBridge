# StepBridge.in — Local Development & Setup Guide

Welcome to **StepBridge** (`StepBridge.in`), an AI-powered Career Readiness Intelligence and Campus Placement SaaS platform.

Crafted with purpose by **Ravi Chauhan** ([LinkedIn Profile](https://www.linkedin.com/in/ravi-chauhan-44ba85290/)).

---

## 1. System Prerequisites

- **Operating System:** macOS, Linux, or Windows (WSL recommended).
- **Node.js:** v18.18.0 or higher (v20+ LTS recommended).
- **Package Manager:** `npm` (v9+) or `pnpm`.
- **Database:** Local SQLite database included out of the box (`prisma/dev.db`), compatible with PostgreSQL via Prisma migrations.

---

## 2. Quickstart: 1-Command Startup

To run StepBridge locally on your development machine:

```bash
cd /Users/ravichauhan/.gemini/antigravity-ide/scratch/stepbridge
npm run dev
```

Open your browser to:
**[http://localhost:3000](http://localhost:3000)**

---

## 3. Verified Seed Accounts & Credentials

The local database has been pre-seeded with complete institutional data, placement drives, recruiter jobs, resumes, candidate applications, and SaaS subscriptions.

| User Role | Seed Email Address | Password | Workspace URL | Tenant / Organization |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `ravi.chauhan@jcbust.ac.in` | `Student@StepBridge2026!` | `/student` | JCBUST, YMCA Faridabad |
| **College Admin / TPO** | `tpo@jcbust.ac.in` | `College@StepBridge2026!` | `/college` | JCBUST, YMCA Faridabad |
| **Recruiter** | `ananya.recruiter@techcorp-innovations.io` | `Recruiter@StepBridge2026!` | `/recruiter` | TechCorp Innovations |
| **Super Admin** | `admin@stepbridge.in` | `Admin@StepBridge2026!` | `/admin` | Global Platform Control |

> **Note:** For legacy compatibility, `admin@stepbridge.ai`, `tpo@nitb.ac.in`, and `aarav.patel@nitb.ac.in` are also active and resolve to the same test workspaces.

---

## 4. Key Workspaces & URLs

- **Public Landing Page:** `http://localhost:3000/`
  - Featuring dark themed 2.1-second branded intro animation (`IntroAnimation.tsx`), hero actions, 12 career domains showcase, and institutional features.
- **Unified Login:** `http://localhost:3000/login`
  - Auto-fills demo credentials with 1-click role selection. Includes `?logged_out=true` feedback banner upon session termination.
- **Student Registration:** `http://localhost:3000/register`
- **Password Recovery:** `http://localhost:3000/forgot-password`
- **Student Workspace:** `http://localhost:3000/student`
  - Readiness & skill gaps across 12 domains, personalized 8-week roadmap, skill assessments, resume ATS analysis engine, opportunities & drive applications, interview practice simulator, and 24/7 AI Career Mentor.
- **12 Technology Domains Hub:** `http://localhost:3000/student/domains`
  - Full syllabus, tools, portfolio benchmarks, and milestones for 12 technology engineering tracks.
- **College TPO Workspace:** `http://localhost:3000/college`
  - Student directory, CSV bulk import, drive builder with live eligibility preview, confirmed outcomes recorder, broadcast notifications, and placement analytics.
- **Recruiter Portal:** `http://localhost:3000/recruiter`
  - Job management, verified candidate discovery search, interactive Kanban pipeline (Shortlist, Interview, Offer, Reject), interview scheduler, and hiring analytics.
- **Super Administrator Dashboard:** `http://localhost:3000/admin`
  - Tenant verification queue (Institutions & Companies), user directory with instant suspension toggle, AI token & cost analytics, SaaS subscription plans, and security audit trail.

---

## 5. Database Commands

StepBridge uses **Prisma ORM** with SQLite locally (`file:./dev.db`) and PostgreSQL in production.

```bash
# Push schema changes to database (sync models)
npx prisma db push

# Re-seed test accounts, catalog, domains, and sample data
npx tsx prisma/seed.ts

# Inspect and edit database records visually via Prisma Studio
npx prisma studio
```

---

## 6. Running Tests & Quality Verification

All 10 test suites (51 unit & integration tests) pass with 100% success rate:

```bash
# Run Vitest integration and unit test suite
npx vitest run

# Type check the entire codebase (zero errors)
npx tsc --noEmit

# Run ESLint quality checks (zero errors)
npm run lint

# Build production Next.js package
npm run build
```

---

## 7. Security & Architecture Details

1. **Authentication & Session Revocation:**
   - On `POST /api/v1/auth/logout`, the server actively revokes all active session records in `prisma.session` matching the user's ID, clears the `stepbridge_session` cookie across `path: "/"`, sets `maxAge: 0, expires: new Date(0)`.
   - Client-side `sessionStorage` tokens are cleared and the user is redirected to `/login?logged_out=true`.
2. **Back-Button & BF-Cache Prevention:**
   - In Next.js middleware (`src/middleware.ts`), all protected dashboard routes (`/student`, `/college`, `/recruiter`, `/admin`) emit strict `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate` and `Pragma: no-cache` headers, ensuring sensitive workspace data is never retained in browser history after logging out.
3. **Multi-Tenant Isolation:**
   - Institution and Company models maintain isolated workspace boundaries enforced at the database level. Queries filter by `tenantId` and verify role permissions server-side.
4. **Creator Attribution:**
   - Every dashboard and footer features creator attribution: *"Crafted with purpose by Ravi Chauhan"* linking directly to [LinkedIn](https://www.linkedin.com/in/ravi-chauhan-44ba85290/) (`target="_blank"`).
