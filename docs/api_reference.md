# StepBridge.ai — Comprehensive REST API Reference

All API routes follow standard RESTful conventions, prefixed with `/api/v1`.
All mutating routes strictly require CSRF token validation and authenticated bearer/session cookies.

---

## 1. Authentication & Session Endpoints (`/api/v1/auth/*`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/v1/auth/register` | `POST` | Public | Registers a new student, college admin, or recruiter. Hashes password with bcrypt. |
| `/api/v1/auth/login` | `POST` | Public | Authenticates credentials and returns a secure HTTP-only signed session cookie. |
| `/api/v1/auth/logout` | `POST` | Authenticated | Revokes active session token and clears cookie. |
| `/api/v1/auth/me` | `GET` | Authenticated | Returns current authenticated user context, role, and tenant memberships. |
| `/api/v1/auth/forgot-password` | `POST` | Public | Generates a 1-hour secure password reset token without leaking user existence. |
| `/api/v1/auth/reset-password` | `POST` | Public | Validates reset token and updates password hash. |
| `/api/v1/auth/verify-email` | `POST` | Public | Marks user email as verified via cryptographic token. |
| `/api/v1/auth/resend-verification` | `POST` | Public | Re-dispatches verification email. |
| `/api/v1/auth/sessions` | `GET` | Authenticated | Lists all active device sessions for current user. |
| `/api/v1/auth/sessions/:id` | `DELETE` | Authenticated | Terminates a specific device session. |

---

## 2. Student Profile & Resume Endpoints (`/api/v1/students/*`, `/api/v1/resumes/*`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/v1/students/me` | `GET` | Student | Fetches full profile, education, skills, projects, and calculated completion score (0-100%). |
| `/api/v1/students/me` | `PUT` | Student | Updates student bio, phone, LinkedIn, GitHub, and academic CGPA. |
| `/api/v1/students/projects` | `POST` | Student | Adds an academic/personal project with skills tags and live URLs. |
| `/api/v1/students/projects/:id` | `PUT` | Student | Updates project title, description, or repository link. |
| `/api/v1/students/projects/:id` | `DELETE` | Student | Removes an owned project. |
| `/api/v1/students/skills` | `POST` | Student | Associates verified or self-reported taxonomy skills with proficiency levels. |
| `/api/v1/resumes/upload` | `POST` | Student | Validates (<5MB, PDF/DOCX) and stores parsed resume file. |
| `/api/v1/resumes/parse` | `POST` | Student | Triggers ATS scanner engine extracting skills, contact, education, and ATS score. |
| `/api/v1/resumes/:id` | `GET` | Student / Recruiter | Returns ATS extraction report and download URL. |

---

## 3. Career Intelligence & Assessments (`/api/v1/assessments/*`, `/api/v1/roadmaps/*`, `/api/v1/ai/*`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/v1/roles` | `GET` | Public / Student | Lists all standardized industry taxonomy roles and required skills. |
| `/api/v1/students/me/goals` | `POST` | Student | Sets primary target role goal and archives outdated roadmaps. |
| `/api/v1/students/me/readiness` | `GET` | Student | Returns readiness score (0-100), mastered skills, and identified skill gaps. |
| `/api/v1/assessments/start` | `POST` | Student | Starts randomized MCQ attempt (shielding `answerKey`) with 24-hr retake cooldown. |
| `/api/v1/assessments/:id/submit` | `POST` | Student | Grades assessment answers server-side, updates skills verified flag, and calculates score. |
| `/api/v1/roadmaps/generate` | `POST` | Student | Generates personalized 4/8/12-week preparation roadmap with actionable tasks. |
| `/api/v1/roadmap-tasks/:id` | `PATCH` | Student | Toggles task completion state (`PENDING` <-> `COMPLETED`). |
| `/api/v1/ai/interview/sessions` | `POST` | Student | Initializes structured AI technical/behavioral interview practice session. |
| `/api/v1/ai/interview/sessions/:id/turn` | `POST` | Student | Sends answer turn and receives next interview question or rubric feedback. |
| `/api/v1/ai/assistant/messages` | `POST` | Student | Career AI copilot query; enforces 15 messages/month quota ledger. |

---

## 4. Opportunities & Applications (`/api/v1/opportunities/*`, `/api/v1/applications/*`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/v1/opportunities` | `GET` | Student / College | Lists verified jobs & internships with match percentage and eligibility badges. |
| `/api/v1/opportunities/:id` | `GET` | Authenticated | Details job responsibilities, skills, compensation, and eligibility criteria. |
| `/api/v1/opportunities/:id/applications`| `POST` | Student | Submits application; snapshots student profile/resume; prevents duplicates. |
| `/api/v1/students/me/applications` | `GET` | Student | Lists student's application history with live pipeline stages. |
| `/api/v1/applications/:id/withdraw` | `POST` | Student | Withdraws active application if not already hired or rejected. |

---

## 5. College Placement Cell Endpoints (`/api/v1/college/*`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/v1/college/dashboard` | `GET` | College Admin | Cohort readiness distribution, total placed students, and skill-gap heatmaps. |
| `/api/v1/college/batches` | `GET` / `POST` | College Admin | Manages department batches (e.g. 2026 CS, 2026 ECE). |
| `/api/v1/college/students` | `GET` | College Admin | Scoped student directory with readiness scores, verified skills, and search filters. |
| `/api/v1/college/students/import` | `POST` | College Admin | Bulk CSV import with transaction rollbacks and validation error reporting. |
| `/api/v1/college/drives` | `POST` | College Admin | Creates campus placement drive with CGPA, batch, and branch eligibility rules. |
| `/api/v1/college/drives/preview` | `POST` | College Admin | Real-time preview of eligible student count before publishing drive. |
| `/api/v1/college/reports/export` | `GET` | College Admin | Generates instant CSV export of all student readiness scores and placement states. |

---

## 6. Recruiter Pipeline Endpoints (`/api/v1/company/*`, `/api/v1/applications/*`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/v1/company/jobs` | `GET` / `POST` | Recruiter | Lists and creates company job postings. |
| `/api/v1/company/jobs/:id/publish` | `POST` | Recruiter | Publishes job (verification-gated: company must be verified by super admin). |
| `/api/v1/company/jobs/:id/applicants` | `GET` | Recruiter | Fetches applicants for job with immutable profile snapshots and match scores. |
| `/api/v1/applications/:id/stage` | `PATCH` | Recruiter | Transitions applicant stage (`APPLIED` -> `SCREENING` -> `INTERVIEW` -> `OFFER` -> `HIRED`/`REJECTED`). |
| `/api/v1/applications/:id/notes` | `GET` / `POST` | Recruiter | Adds private internal recruiter evaluation notes on an application. |

---

## 7. Platform Administration & Security (`/api/v1/admin/*`, `/api/v1/notifications/*`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/v1/admin/verifications` | `GET` | Super Admin | Lists pending institution and company verification queues. |
| `/api/v1/admin/tenants/:id/verification`| `PATCH` | Super Admin | Approves or rejects tenant credentials with audit logging. |
| `/api/v1/admin/users/:id/status` | `PATCH` | Super Admin | Suspends or activates user accounts. |
| `/api/v1/admin/ai-usage` | `GET` | Super Admin | Aggregate AI token usage and operational expenditure tracking. |
| `/api/v1/admin/audit-logs` | `GET` | Super Admin | Tamper-evident security audit trail with IP, actor, action, and target. |
| `/api/v1/admin/feature-flags/:key` | `PATCH` | Super Admin | Toggles global system feature flags dynamically without restarts. |
| `/api/v1/notifications` | `GET` | Authenticated | Lists in-app notifications for authenticated user. |
| `/api/v1/notifications/:id/read` | `PATCH` | Authenticated | Marks notification as read. |
