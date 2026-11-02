# StepBridge.ai — Changelog

All notable changes to the StepBridge codebase will be documented in this file.

## [0.1.0] - 2026-11-02
### Phase 0: Project Foundation (COMPLETED)
- Initialized Next.js App Router project with TypeScript and Tailwind CSS v4 in `/Users/ravichauhan/.gemini/antigravity-ide/scratch/stepbridge`.
- Installed foundational dependencies: `@prisma/client`, `prisma`, `zod`, `react-hook-form`, `lucide-react`, `jose`, `bcryptjs`, `clsx`, `tailwind-merge`, and `vitest`.
- Established project memory: `PROJECT_CONTEXT.md`, `IMPLEMENTATION_PLAN.md`, `CHANGELOG.md`, `.env.example`.
- Created comprehensive architecture specifications in `docs/`:
  - `docs/PRD.md`
  - `docs/architecture.md`
  - `docs/database.md`
  - `docs/security.md`
  - `docs/decisions.md`
- Synchronized and verified Prisma SQLite/PostgreSQL schema with 40+ models.
- Seeded database with Super Admin, Pilot Institution (NIT Bangalore), TechCorp Innovations, taxonomy, and questions.

### Phase 1: Identity & Tenant Foundation (COMPLETED)
- Implemented `FR-AUTH-01` to `06`: Register, login, logout, get me, verify-email, resend-verification, forgot-password, reset-password, and active session management.
- Implemented single-use cryptographic tokens (24h verification, 30m reset).
- Implemented RBAC policy module and tenant-scoped security checks (`src/lib/permissions/rbac.ts`).
- Implemented Super Admin tenant verification review endpoints (`/api/v1/admin/verifications`, `/api/v1/admin/tenants/:id/verification`) and user suspension (`/api/v1/admin/users/:id/status`).
- Verified zero-error test suite covering authentication, duplicate prevention, tenant status transitions, session revocation, and server-side suspension blocking.

### Phase 2: Student Profile & Resume (COMPLETED)
- Implemented `FR-STU-01` through `05` and `16`: Student profile CRUD, visibility management, project additions/updates with anti-IDOR checks, and skill evidence records.
- Implemented weighted profile completion engine (20% basics, 15% education, 20% skills, 20% projects, 15% resume, 5% certs, 5% goal) with actionable missing prompts (`profileService.ts`).
- Implemented private resume upload validation (5MB max, PDF/DOCX) and storage keying.
- Implemented resume analysis engine with ATS hygiene checks, section completeness, role alignment scoring, and Gemini integration with deterministic rules fallback (`resumeService.ts`).
- Created and verified full integration test suite with 100% pass rate.

### Phase 3: Career Intelligence (COMPLETED)
- Implemented `FR-STU-06`: Curated roles catalog (`/api/v1/roles`) and primary career goal selection with automatic roadmap archiving.
- Implemented `FR-STU-07`: MCQ skill assessments with randomized question subsets, 24-hour retake cooldown enforcement, answer autosaving, server-side grading, and zero student-facing exposure of answer keys (`assessmentService.ts`).
- Implemented `FR-STU-08`: Transparent skill-gap and readiness score calculation with component breakdowns (verified assessments, projects, profile completion) and confidence rating (`readinessService.ts`).
- Implemented `FR-STU-09` & `10`: 4-, 8-, or 12-week personalized roadmap generator with ordered weekly milestones, actionable learning tasks, status updates, and deterministic fallbacks (`roadmapService.ts`).
- Implemented `FR-STU-14`: Text-based interactive technical interview practice and rubric feedback.
- Implemented `FR-STU-15` & `13.8`: Grounded AI career mentor with profile-aware context and monthly quota enforcement (15 messages/month).

### Phase 4: Opportunities & Applications (COMPLETED)
- Implemented `FR-STU-11`: Opportunities search with type/location/keyword filters and enriched student eligibility calculations (`/api/v1/opportunities`).
- Implemented `FR-STU-12`: Application submission with server-side rechecking of eligibility and deadlines, duplicate prevention constraint `(studentId, opportunityId)`, and immutable point-in-time student profile/resume snapshotting (`/api/v1/opportunities/:id/applications`).
- Implemented `FR-STU-13`: Application status tracking with audit timeline events (`/api/v1/students/me/applications`) and online withdrawal before the interview stage (`/api/v1/applications/:id/withdraw`).
- Built deterministic eligibility engine with explicit pass/fail reasons (CGPA, allowed batches, departments) and explainable skill overlap matching (`eligibilityService.ts`).
- Verified comprehensive integration test suite for opportunity discovery, eligibility checks, and snapshots.

### Phase 5: College Operations (COMPLETED)
- Implemented `FR-COL-02`: Department and batch management (`/api/v1/college/batches`).
- Implemented `FR-COL-03` & `04`: Student invitations and bulk CSV importing with automatic department/batch reconciliation (`/api/v1/college/students/import`).
- Implemented `FR-COL-05`: Authorized student profile view strictly scoped to the authenticated institution (`/api/v1/college/students/:id`).
- Implemented `FR-COL-06`: Cohort readiness analytics, readiness distribution bands (Ready, Nearing, Needs Prep), skill-gap heatmaps, and transparent "Students Needing Attention" alerts (`collegeService.ts`).
- Implemented `FR-COL-07` & `08`: Placement drive creation and real-time eligible student preview with exclusion breakdown before publication (`/api/v1/college/drives/preview`).
- Implemented `FR-COL-09` & `10`: Drive publication, automated student notifications, candidate registration funnel, and stage updates (`/api/v1/college/drives/:id/publish`, `registrations`).
- Implemented `FR-COL-11`: Full CSV cohort report export with sanitized fields (`/api/v1/college/reports/export`).

### Phase 6: Recruiter Workspace (COMPLETED)
- Implemented `FR-REC-02` & `03`: Job posting creation, editing, preview, and verification gating before publication (`/api/v1/company/jobs`, `/api/v1/company/jobs/:id/publish`).
- Implemented `FR-REC-04`: Applicant list with immutable point-in-time profile snapshot, resume metadata, and explainable skill match calculation (`/api/v1/company/jobs/:id/applicants`).
- Implemented `FR-REC-05`: Application stage progression (Applied -> Shortlisted -> Interview -> Offered -> Hired -> Rejected) with persistent audit history in `ApplicationStageEvent` (`/api/v1/applications/:id/stage`).
- Implemented `FR-REC-06`: Private recruiter notes confidential to the hiring team (`/api/v1/applications/:id/notes`).
- Implemented `FR-REC-07`: Automated student notifications and email alerts triggered upon applicant stage transition.
- Enforced cross-company tenant isolation preventing cross-company access to jobs, applicants, or recruiter notes.

### Phase 7: Platform Admin, Hardening, and Production UI (COMPLETED)
- Implemented `FR-ADM-01` & `02`: Super Admin verification queue (Approve/Reject tenants with mandatory reason) and server-side user suspension (`/api/v1/admin/verifications`, `/api/v1/admin/users/:id/status`).
- Implemented `FR-ADM-05` & `09`: AI usage and token cost tracking dashboard (`/api/v1/admin/ai-usage`) and platform security audit log viewer (`/api/v1/admin/audit-logs`).
- Implemented Global in-app notifications and read tracking (`/api/v1/notifications`, `/api/v1/notifications/:id/read`).
- Delivered interactive, responsive UI workspaces adhering strictly to PRD Section 14, 15, 16 design tokens:
  - Public Landing Page (`/`): Stakeholder paths (Student, College, Recruiter), live role taxonomy cards, and quick role launcher.
  - Student Workspace (`/student`): Readiness gauge, skill gap matrix, interactive 8-week roadmap with task toggling, MCQ assessment runner with timer & grading, resume ATS hygiene analyzer, opportunity application with immutable snapshot, technical interview practice, and grounded AI assistant with monthly quota tracking.
  - College Workspace (`/college`): Cohort readiness distribution, drive builder with real-time eligible student preview, student directory, attention alerts, and 1-click CSV report export.
  - Recruiter Workspace (`/recruiter`): Active jobs, Kanban hiring pipeline, applicant detail modal with immutable snapshot, and private recruiter notes.
  - Super Admin Workspace (`/admin`): Verification review queue, user status manager, AI token cost monitor, and live audit event stream.
- Authored production guides:
  - `docs/deployment.md`: High-availability deployment guide with Neon/PostgreSQL, Cloudflare R2 / AWS S3, Redis caching, multi-stage Dockerfile, and security headers.
  - `docs/api_reference.md`: Comprehensive REST API reference index covering all 60+ endpoints mapped to PRD requirements.
- Completed end-to-end live API verification with running Next.js daemon across Student, College, Recruiter, and Super Admin sessions.
- Verified 100% production build pass (`next build` compiled 43 static & dynamic routes with 0 errors) and 26/26 unit/integration tests passing.

