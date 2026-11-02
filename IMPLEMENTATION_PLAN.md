# StepBridge.ai — Implementation Plan & Status Tracking

This plan maps every requirement from PRD v1.0 to its implementation phase, target modules, APIs, database entities, and test suites.

## Phase Overview & Progress

| Phase | Description | Status | Quality Gate |
|---|---|---|---|
| **Phase 0** | Project Foundation, Tokens, Prisma Schema, Initial DB & Docs | COMPLETED | Next.js runs, DB schema ready, Docs produced |
| **Phase 1** | Identity & Tenant Foundation (Auth, RBAC, Multi-tenancy, Sessions) | COMPLETED | 6 roles authenticate, tenant isolation tests pass |
| **Phase 2** | Student Profile & Evidence (Onboarding, CRUD, Resume Parsing) | COMPLETED | Complete profile & safe resume upload/analysis |
| **Phase 3** | Career Intelligence (Taxonomy, Assessments, Readiness, Roadmap, AI Quotas) | COMPLETED | Role selection → Assessment → Gaps → Roadmap |
| **Phase 4** | Opportunities & Applications (Eligibility Engine, Apply, Snapshots, Notifications) | COMPLETED | Discover → Eligibility check → Apply → Track status |
| **Phase 5** | College Operations (Batches, Students, Drive Builder, Cohort Analytics) | COMPLETED | Placement cell manages drives & cohort readiness |
| **Phase 6** | Recruiter Workspace (Job Postings, Applicants, Kanban Stages, Notes) | COMPLETED | Verified recruiter reviews applicants & stages |
| **Phase 7** | Platform Admin, Moderation, Audit, AI Usage & Hardening | COMPLETED | Admin verifications, audit logs, AI cost, Production Build & E2E |

---

## Detailed Requirement Mapping (P0 MVP Requirements)

### 1. Authentication & Security (FR-AUTH)
- `FR-AUTH-01`: Register (Student, College Admin, Recruiter). Phase 1. API: `POST /api/v1/auth/register`. Entity: `User`.
- `FR-AUTH-02`: Verify email with single-use cryptographic token. Phase 1. API: `POST /api/v1/auth/verify-email`. Entity: `EmailToken`.
- `FR-AUTH-03`: Login, logout, forgot-password, reset-password. Phase 1. APIs: `POST /api/v1/auth/login`, `logout`, `forgot-password`, `reset-password`.
- `FR-AUTH-04`: Role-aware post-login dashboard routing. Phase 1. Middleware / client navigation.
- `FR-AUTH-05`: Suspended users blocked server-side. Phase 1. Auth policy check.
- `FR-AUTH-06`: Audit security-relevant authentication events. Phase 1. Entity: `AuditLog`.

### 2. Student Domain (FR-STU)
- `FR-STU-01`: Guided onboarding wizard (basics, institution, education, role, skills). Phase 2. API: `POST /api/v1/students/me`.
- `FR-STU-02`: Editable profile (education, skills, projects, certifications, links). Phase 2. API: `PATCH /api/v1/students/me`, `POST/PATCH /api/v1/students/me/projects`.
- `FR-STU-03`: Profile completion score with missing-field checklist. Phase 2. Helper & UI component.
- `FR-STU-04`: Resume upload (PDF/DOCX), validation, text extraction. Phase 2. APIs: `POST /api/v1/resumes/upload-url`, `POST /api/v1/resumes`.
- `FR-STU-05`: Resume analysis with section completeness & ATS suggestions. Phase 2. APIs: `POST /api/v1/resumes/:id/analyze`, `GET /api/v1/resumes/:id/analysis`.
- `FR-STU-06`: Select primary career goal from curated roles. Phase 3. APIs: `GET /api/v1/roles`, `POST /api/v1/students/me/goals`.
- `FR-STU-07`: MCQ skill assessments with randomized subsets & grading. Phase 3. APIs: `GET /api/v1/assessments`, `POST /attempts`, `PUT /answers`, `POST /submit`.
- `FR-STU-08`: Skill gap analysis against selected target role. Phase 3. API: `GET /api/v1/students/me/readiness`.
- `FR-STU-09`: AI 4/8/12-week roadmap generation with fallback. Phase 3. API: `POST /api/v1/roadmaps/generate`.
- `FR-STU-10`: Mark roadmap tasks complete, notes, progress. Phase 3. API: `PATCH /api/v1/roadmap-tasks/:id`.
- `FR-STU-11`: Discover opportunities with filters & eligibility checks. Phase 4. API: `GET /api/v1/opportunities`.
- `FR-STU-12`: Apply with resume snapshot & duplicate prevention. Phase 4. API: `POST /api/v1/opportunities/:id/applications`.
- `FR-STU-13`: Track application stages & status timeline. Phase 4. API: `GET /api/v1/students/me/applications`.
- `FR-STU-14`: Interactive text-based interview practice & feedback. Phase 3. APIs: `POST /api/v1/ai/interview/sessions`, `POST /answers`.
- `FR-STU-15`: Grounded AI career assistant with quotas. Phase 3. APIs: `POST /api/v1/ai/assistant/messages`.
- `FR-STU-16`: Student profile visibility controls. Phase 2. `StudentProfile.visibility`.

### 3. College & Placement Features (FR-COL)
- `FR-COL-01`: Register institution & submit verification details. Phase 1 & 5. API: `POST /api/v1/admin/verifications`.
- `FR-COL-02`: Manage institution profile, departments, batches. Phase 5. APIs: `GET/POST /api/v1/college/batches`.
- `FR-COL-03`: Invite students (email, CSV). Phase 5. API: `POST /api/v1/college/students/import`.
- `FR-COL-04`: Manage student membership and batch assignments. Phase 5. API: `GET /api/v1/college/students`.
- `FR-COL-05`: View authorized student profile within institution scope. Phase 5. API: `GET /api/v1/college/students/:id`.
- `FR-COL-06`: View cohort readiness distribution & skill-gap heatmap. Phase 5. API: `GET /api/v1/college/analytics/readiness`.
- `FR-COL-07`: Create placement drive with eligibility rules. Phase 5. API: `POST /api/v1/college/drives`.
- `FR-COL-08`: Preview eligible student count before publishing drive. Phase 5. API: `POST /api/v1/college/drives/preview`.
- `FR-COL-09`: Publish drive & notify eligible students. Phase 5. API: `POST /api/v1/college/drives/:id/publish`.
- `FR-COL-10`: Track registrations, shortlists, offers & manual outcomes. Phase 5. API: `GET /api/v1/college/drives/:id/registrations`.

### 4. Recruiter & Company Features (FR-REC)
- `FR-REC-01`: Register company & verification status. Phase 1 & 6. API: `POST /api/v1/company`.
- `FR-REC-02`: Create, edit, preview, and publish job postings. Phase 6. APIs: `GET/POST/PATCH /api/v1/company/jobs`.
- `FR-REC-03`: Define skills, description, type, location & eligibility. Phase 6.
- `FR-REC-04`: View applicants with resume & match explanation. Phase 6. API: `GET /api/v1/company/jobs/:id/applicants`.
- `FR-REC-05`: Move applicants through Applied -> Shortlisted -> Interview -> Offered -> Hired / Rejected. Phase 6. API: `PATCH /api/v1/applications/:id/stage`.
- `FR-REC-06`: Add private recruiter notes. Phase 6. API: `POST /api/v1/applications/:id/notes`.
- `FR-REC-07`: Notify students on stage change. Phase 6. Notifications engine.

### 5. Super Admin Features (FR-ADM)
- `FR-ADM-01`: Review, approve/reject tenant verifications with reason. Phase 7. API: `PATCH /api/v1/admin/tenants/:id/verification`.
- `FR-ADM-02`: Suspend/restore users and tenants. Phase 7. API: `PATCH /api/v1/admin/users/:id/status`.
- `FR-ADM-03`: Taxonomy & Question bank editor. Phase 7. APIs: `/api/v1/admin/roles`, `/skills`, `/questions`.
- `FR-ADM-04`: Abuse reports and posting moderation. Phase 7. API: `/api/v1/admin/moderation`.
- `FR-ADM-05`: Platform metrics, health, AI token/cost logs. Phase 7. API: `/api/v1/admin/ai-usage`.
