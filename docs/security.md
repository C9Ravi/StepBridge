# StepBridge.ai — Security & Authorization Specification

## 1. Authorization Principles
- **Deny by Default**: Any endpoint without explicit role authorization rejects requests with 401 Unauthenticated or 403 Forbidden.
- **Server-Side Enforcement**: UI route guards are strictly for UX convenience; all security checks execute on the server.
- **Tenant Scoping**: Tenant IDs (`institution_id`, `company_id`) are derived strictly from the authenticated user's active membership record, never trusted from query parameters or request bodies.
- **Anti-IDOR (Insecure Direct Object Reference)**: Every query verifying access to a resource verifies that `resource.tenant_id == session.tenant_id` or `resource.student_id == session.user_id`. When accessing out-of-scope resources, a generic 404 is returned to avoid enumeration.

## 2. Role-Based Access Control (RBAC) Matrix

| Resource / Action | STUDENT | PLACEMENT_OFFICER | COLLEGE_ADMIN | RECRUITER | COMPANY_ADMIN | SUPER_ADMIN |
|---|---|---|---|---|---|---|
| View / Edit Own Profile | YES | YES | YES | YES | YES | YES |
| View Other Student Profile | NO | YES (in cohort) | YES (in institution) | YES (applicant only) | YES (applicant only) | YES (audited) |
| Create Placement Drive | NO | IF PERMITTED | YES | NO | NO | YES |
| Create Job Posting | NO | NO | NO | YES (own company) | YES (own company) | YES |
| Apply to Job / Drive | YES (if eligible) | NO | NO | NO | NO | NO |
| Update Applicant Stage | NO | DRIVE FUNNEL ONLY | DRIVE FUNNEL ONLY | YES (own job) | YES (own job) | YES (audited) |
| Manage College Batches | NO | IF PERMITTED | YES | NO | NO | YES |
| Manage Company Team | NO | NO | NO | NO | YES | YES |
| Approve/Reject Tenants | NO | NO | NO | NO | NO | YES |
| Access AI Usage & Audit | NO | NO | NO | NO | NO | YES |

## 3. Session Management & Password Security
- **Cookies**: HTTP-only, SameSite=Lax (Strict where appropriate), Secure in production.
- **Tokens**: JWT signed with HS256/EdDSA using `AUTH_SECRET`, with claims `{ sub: user_id, role, tenant_id, status }`.
- **Passwords**: Hashed with bcrypt (salt rounds = 12) or Argon2id. Passwords require min 10 characters, at least 1 number, and 1 uppercase letter.
- **Email Verification**: Cryptographically random 256-bit token stored hashed in `email_tokens`, single-use, 24-hour expiration.
- **Password Reset**: Cryptographically random token, single-use, 30-minute expiration. Successful password reset revokes all existing active sessions.
- **Rate Limiting**: Applied to `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/resumes/*/analyze`, and AI assistant endpoints.
