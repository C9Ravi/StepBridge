# StepBridge AI — College TPO & Recruiter Workspaces Functionality Audit

**Document:** `TPO_RECRUITER_FUNCTIONALITY_AUDIT.md`  
**Date:** November 03, 2026  
**Auditor:** StepBridge AI Engineering Team  
**Scope:** College Admin / Training & Placement Officer (TPO) Workspace, Company Recruiter Workspace, Cross-Role Data Flow, RBAC, Database Schema, and REST APIs.

---

## 1. Executive Summary

A comprehensive architectural and functional audit was conducted across the College TPO portal (`/college`, `src/app/college/page.tsx`), the Recruiter portal (`/recruiter`, `src/app/recruiter/page.tsx`), the associated API endpoints, RBAC permissions, and the Prisma database schema.

**Key Findings:**
1. **Frontend Disconnect from Real APIs:** While robust database models and backend services exist in `src/modules/institutions/collegeService.ts` and `src/app/api/v1/company/*`, the frontend pages for both `/college` and `/recruiter` were relying heavily on **hardcoded mock states**, in-memory arrays (`useState`), and unhandled tab switches.
2. **Missing UI Implementations:** 
   - In `/recruiter`, the "Post New Role" tab (`activeTab === "post"`) was declared in state types but completely missing in the JSX render body (rendering an empty page).
   - In `/college`, student CSV import, custom notifications, drive schedule management, and placement outcomes were absent from the UI.
   - Candidate discovery (searching and shortlisting students outside direct applications) was not implemented.
3. **Session & Persona Switching Disconnect:** The global navigation persona switcher (`Navbar.tsx`) updated the URL without issuing a real authentication session for that role, causing legitimate API requests to fail with `401 Unauthorized` or `403 Forbidden` if a session cookie for that role was not explicitly active.
4. **Missing Relational Entities:** Models for structured interview schedules and interview feedback existed only as text notes in `ApplicationStageEvent`, lacking dedicated scheduling timestamps, interview round types, evaluation rubrics, and feedback ratings.

---

## 2. Classification Matrix

| Subsystem / Feature | Current State | Classification | Primary Deficiency / Root Cause |
|---|---|---|---|
| **College TPO Dashboard Overview** | Mocked in `college/page.tsx` | **Mocked** | Uses hardcoded `cohortMetrics` object instead of calling `GET /api/v1/college/dashboard`. |
| **Domain Intelligence (12 Tracks)** | Integrated with API | **Fully functional** | Calls `/api/v1/college/domains`, filters by category, displays top skill gaps and avg readiness. |
| **Student Directory & Search** | 4 Mocked Students in React state | **Mocked** | Displays static 4 students; does not query `GET /api/v1/college/students` or allow search by branch/batch. |
| **Student Profile & Evidence View** | Triggers browser `alert()` | **Broken** | "View Evidence" button executes `alert()`; no student evidence drawer or modal is rendered. |
| **Student CSV Bulk Import** | Backend API exists; No UI | **Partially implemented** | API `POST /api/v1/college/students/import` exists, but there is no file upload or CSV parser UI on `/college`. |
| **Cohort CSV Export** | Backend API exists; working link | **Fully functional** | Link calls `/api/v1/college/reports/export` and streams CSV download. |
| **Drive Creation (Builder)** | Local React `useState` | **Mocked** | `handleCreateDrive` pushes to local state; does not invoke `POST /api/v1/college/drives`. Lost on reload. |
| **Drive Eligibility Preview** | Local CGPA filter | **Mocked** | Calculates `students.filter(s => s.cgpa >= minCgpa)` locally instead of calling `/api/v1/college/drives/preview`. |
| **Drive Scheduling & Registration** | Schema exists; No UI/workflow | **Partially implemented** | Students cannot be marked through drive stages, and TPO cannot record interview or selection outcomes. |
| **Placement Outcomes & Analytics** | Model `PlacementOutcome` exists; No UI | **Not implemented** | Placed vs. unplaced counts, average packages, and company placement breakdowns are not displayed. |
| **TPO Student Notifications** | Backend service exists; No TPO UI | **Not implemented** | TPO cannot broadcast drive announcements, deadline reminders, or alerts to eligible students. |
| **Recruiter Pipeline (Kanban)** | In-memory React `useState` | **Mocked** | 3 mock applicants; `moveStage` does not persist to `PATCH /api/v1/applications/[id]/stage`. |
| **Recruiter Private Notes** | In-memory React `useState` | **Mocked** | `handleAddNote` updates local state; does not persist to `POST /api/v1/applications/[id]/notes`. |
| **Recruiter "Post New Role" Tab** | Tab button exists; body missing | **Broken** | Clicking "Post New Role" sets `activeTab = "post"`, rendering nothing on screen. |
| **Recruiter Published Jobs List** | Static mock card | **Mocked** | Renders static "Junior Full Stack Engineer" without calling `GET /api/v1/company/jobs`. |
| **Candidate Talent Discovery** | Search student profiles | **Not implemented** | Recruiters have no interface or API to search verified student talent pools across colleges. |
| **Interview Scheduling & Feedback** | Notes text only | **Partially implemented** | No structured interview round scheduling (date, time, meet link) or scorecard feedback submission. |
| **Cross-Role Session Sync** | URL redirection only | **Partially implemented** | Navbar role switch does not authenticate the target demo persona, causing API 401s during switching. |

---

## 3. Detailed Component Audits

### 3.1 College Admin / TPO Workspace (`/college`)

#### A. College Onboarding & Profile
- **Status:** **Partially implemented**
- **Existing:** `Institution` and `InstitutionMembership` models in Prisma; institution domain and approval status tracked.
- **Deficiencies:**
  - No interface for TPO to edit college settings (allowed domains, placement season parameters, contact info).
  - No UI to invite additional department placement coordinators.

#### B. Student Management
- **Status:** **Partially implemented / Mocked in UI**
- **Existing:** `GET /api/v1/college/students` supports search and batch filtering; `POST /api/v1/college/students/import` parses CSV batches.
- **Deficiencies:**
  - `src/app/college/page.tsx` ignores `GET /api/v1/college/students` and displays 4 hardcoded students.
  - "View Evidence" button calls `alert("Opening verified evidence portfolio...")` instead of displaying the student's real skills, verified assessment scores, and GitHub project links.
  - No modal or dropzone for CSV file uploads in the UI.

#### C. Placement Drive Management
- **Status:** **Partially implemented / Mocked in UI**
- **Existing:** `PlacementDrive`, `DriveRegistration`, and `PlacementOutcome` models in Prisma. APIs for GET/POST drives, publish drive, and preview eligibility.
- **Deficiencies:**
  - Form submission does not call `POST /api/v1/college/drives`; drives disappear on page refresh.
  - No UI to view drive applicants/registrations, update drive status (Draft -> Published -> Completed), or log final placement offers (`PlacementOutcome`).

#### D. Placement Analytics
- **Status:** **Mocked in UI**
- **Existing:** `getCollegeCohortAnalytics` in `collegeService.ts` computes true readiness bands, skill-gap heatmaps, and students needing attention.
- **Deficiencies:**
  - `src/app/college/page.tsx` does not call `GET /api/v1/college/dashboard` on mount; displays static mock values (e.g. 142 students, 58 ready).

#### E. Student Communication
- **Status:** **Not implemented**
- **Existing:** `sendNotification` utility in `src/lib/email/service.ts` can deliver in-app and email notifications.
- **Deficiencies:**
  - No TPO broadcast interface to dispatch notifications to students (e.g., announcing an upcoming drive, notifying eligible students, or sending custom reminders).

#### F. Placement Reports
- **Status:** **Partially implemented**
- **Existing:** Cohort CSV export endpoint `GET /api/v1/college/reports/export`.
- **Deficiencies:**
  - Missing drive-wise placement report, domain-wise readiness distribution report, and unplaced student list export.

---

### 3.2 Recruiter Workspace (`/recruiter`)

#### A. Recruiter Onboarding & Profile
- **Status:** **Partially implemented**
- **Existing:** `Company` and `CompanyMembership` models in Prisma; verification status tracked.
- **Deficiencies:**
  - No company settings tab to update company bio, logo, website, and industry tags.

#### B. Job and Internship Management
- **Status:** **Broken / Partially implemented**
- **Existing:** Full backend CRUD in `src/app/api/v1/company/jobs/*` with transactional schema validation and skill requirements.
- **Deficiencies:**
  - The "Post New Role" tab (`activeTab === "post"`) has no JSX implementation in `src/app/recruiter/page.tsx`.
  - Recruiter cannot create or edit job listings from the UI.
  - Existing published jobs are hardcoded to 1 mock card.

#### C. Candidate Discovery
- **Status:** **Not implemented**
- **Existing:** `StudentProfile` models with `visibility: "VERIFIED_RECRUITERS"` and verified skill levels.
- **Deficiencies:**
  - No Recruiter Talent Discovery page or API to filter students by domain, skill, CGPA, or readiness.

#### D. Application Management (Pipeline)
- **Status:** **Mocked in UI**
- **Existing:** APIs `PATCH /api/v1/applications/[id]/stage` and `POST /api/v1/applications/[id]/notes` with RBAC and student notification triggers.
- **Deficiencies:**
  - Kanban board only mutates local state.
  - Drag-and-drop or stage progression buttons do not call the backend API.
  - Private recruiter notes are not saved to `ApplicationStageEvent`.

#### E. Interview Scheduling & Feedback
- **Status:** **Partially implemented**
- **Existing:** Recruiter notes stored as raw strings in `ApplicationStageEvent`.
- **Deficiencies:**
  - No structured interview scheduling modal (date, round name, Google Meet / Zoom link).
  - No evaluation rubric / rating input (1-5 stars, technical competency score, hire recommendation).

#### F. Recruiter Analytics
- **Status:** **Not implemented**
- **Existing:** Database has counts of opportunities and applications.
- **Deficiencies:**
  - No recruiter KPI metrics (Time-to-Hire, Funnel Conversion %, Total Applications vs. Shortlisted).

---

## 4. Cross-Role Integration & Security

1. **Authentication Session Switching:**
   - Navigating via the Navbar switcher does not issue a JWT session cookie for the selected role.
   - When a user on `/student` selects "College TPO", they land on `/college` but API calls fail with `403 Forbidden` because their JWT token still has `role: "STUDENT"`.
   - **Fix Required:** Add a seamless role-switch handler that logs in as the demo persona or preserves authenticated sessions with proper redirect tokens.

2. **Audit Logging & Notifications:**
   - State changes made in the UI must produce audit logs in `AuditLog` and in-app notifications in `Notification`.
   - When a recruiter moves an applicant to `SHORTLISTED` or `INTERVIEW`, the student must immediately see this under their Notifications.
   - When a TPO publishes a drive, eligible students must receive a `DRIVE_ALERT` notification.

3. **Tenant Scoping:**
   - Colleges must only see their own students, batches, and drives (`institutionId`).
   - Recruiters must only see applications for their company's jobs (`companyId`).
   - Private recruiter notes must never be exposed to students or colleges.

---

## 5. Architectural Implementation Roadmap

### Phase 2: College TPO Workspace
1. **Connect Dashboard to Real Analytics:** Fetch `GET /api/v1/college/dashboard` on load; render genuine cohort metrics, readiness bands, and real attention lists.
2. **Real Student Directory:** Fetch `GET /api/v1/college/students` with search query, branch filter, and batch filter.
3. **Student Evidence Modal:** Render complete student portfolio (verified skills, projects, certifications, resume details).
4. **CSV Bulk Import:** Implement file dropzone and client-side CSV parser calling `POST /api/v1/college/students/import`.
5. **Real Drive Builder & Preview:** Call `POST /api/v1/college/drives/preview` on input change; call `POST /api/v1/college/drives` on submit to persist placement drives.
6. **Drive Schedule & Outcomes:** Enable TPO to track drive registrations and record student placement offers (`PlacementOutcome`).
7. **Broadcast Communications:** Implement student announcement/notification modal.
8. **Comprehensive Reports:** Provide domain-wise, drive-wise, and cohort placement reports with CSV download.

### Phase 3: Recruiter Workspace
1. **Real Job Management:** Build the complete "Post New Role" form and job list fetching `GET /api/v1/company/jobs` and `POST /api/v1/company/jobs`.
2. **Real Pipeline Kanban:** Fetch `GET /api/v1/company/jobs/[id]/applicants`; wire stage transitions to `PATCH /api/v1/applications/[id]/stage` and notes to `POST /api/v1/applications/[id]/notes`.
3. **Candidate Discovery Hub:** Create a dedicated talent pool tab searching verified students with `visibility: "VERIFIED_RECRUITERS"`.
4. **Interview Scheduling & Feedback:** Add interview scheduling modal and score feedback form.
5. **Recruiter KPI Analytics:** Display live counts of active listings, applicants, interviewees, and offers.

### Phase 4 & 5: Ecosystem Connectivity & Backend
1. Ensure session switching and demo account switching properly authenticates and sets session cookies.
2. Verify all notifications flow from Recruiter/TPO actions to student portals.
3. Add missing API routes:
   - `POST /api/v1/college/notifications/broadcast`
   - `GET /api/v1/college/outcomes` & `POST /api/v1/college/outcomes`
   - `GET /api/v1/company/candidates`
   - `POST /api/v1/company/interviews`
4. Update database schema if required for interview scheduling and ensure complete data integrity.

### Phase 6 & 7: Quality Assurance & Testing
1. Unit and integration tests covering TPO workflows, Recruiter workflows, and cross-role notification delivery.
2. Ensure `npx vitest run`, `npm run lint`, and `npm run build` pass with zero errors.

---

*This audit document serves as the authoritative blueprint for Phase 2 through Phase 8 execution.*
