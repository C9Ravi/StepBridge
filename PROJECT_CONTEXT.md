# StepBridge.ai — Project Context & Memory

## Overview
StepBridge.ai is a multi-sided SaaS platform connecting students, engineering colleges (placement cells), and recruiters into a single career-readiness intelligence loop:
1. **Students**: Build evidence-backed profile, select target career roles, take skill assessments, discover skill gaps, follow personalized 4/8/12-week roadmaps, analyze resumes, practice interview questions, discover eligible opportunities, apply and track status.
2. **Colleges / Placement Cells**: Manage institution profile, departments, programs, batches, invite/import students, monitor cohort readiness & skill-gap distributions, create and publish placement drives with server-side eligibility checks, and track placement funnels.
3. **Recruiters / Companies**: Register & verify company, publish job/internship listings with skill requirements & eligibility rules, inspect explainable applicant matches with resume snapshots, and advance candidates through pipeline stages with private notes.
4. **Platform Super Admin**: Review and verify institutions and companies, manage taxonomy (roles & skills) and question banks, moderate listings, monitor AI costs and audit logs.

## Architectural Conventions
- **Modular Monolith**: Next.js App Router (`src/app/`), TypeScript, Server Actions and Route Handlers (`src/app/api/v1/`).
- **Domain Modules** in `src/modules/` and `src/lib/`:
  - `auth/`: Session management, JWT/cookie tokens, password hashing with bcrypt, email verification, password reset.
  - `permissions/`: Strict RBAC policy engine and tenant scoping. Deny by default.
  - `db/`: Prisma client singleton with relational schema and multi-tenant scoping.
  - `validation/`: Zod schemas for all client and API inputs.
  - `ai/`: Provider abstraction (`generateJson`, `generateText`), Gemini adapter with prompt versioning, token usage logging, and deterministic fallbacks.
  - `storage/`: Private file storage adapter (local / S3 / R2 compatible) with signed URLs.
  - `email/`: Notification / transactional email provider adapter (Resend / console fallback in dev).
- **Design System**: Calm, premium, enterprise SaaS aesthetic conforming to PRD Section 16:
  - Background `#FAFAF9`, surface `#FFFFFF`, muted surface `#F4F4F5`, border `#E4E4E7`.
  - Main text `#18181B`, muted text `#52525B`.
  - Primary indigo `#4F46E5`, hover `#4338CA`, subtle `#EEF2FF`.
  - Accent teal `#0D9488`, success `#16A34A`, warning `#D97706`, danger `#DC2626`, info `#0284C7`.
  - Typography: Inter for UI; JetBrains Mono / monospace for code and metrics.

## Key Decisions & Tenancy Rules
- **Multi-Tenancy**: Shared database with tenant scoping (`institution_id` / `company_id`). Never trust `tenantId` from client requests; always derive from verified session membership.
- **Evidence Over Claims**: Raw evidence (assessment score, verified project) is recorded distinctly from self-declared skills.
- **Explainable Eligibility**: Hard eligibility rules (CGPA, degree, batch, graduation year) return explicit pass/fail reasons.
- **Deterministic AI Fallbacks**: Every AI feature (resume parsing, gap analysis, roadmaps, interview prep) has a deterministic structured fallback if the external LLM is offline or unconfigured.
- **Audit Trails**: Security actions, status changes, drive publications, and tenant verifications write to `audit_logs`.
