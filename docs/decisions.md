# StepBridge.ai — Architecture Decisions & Defaults (ADR)

## Decision Log

### OD-01: First Pilot Institution
- **Decision**: Modeled after a tier-1/tier-2 Indian Engineering Institution (e.g., "National Institute of Technology, Bangalore" / Computer Science & Electronics departments).
- **Rationale**: Represents the core persona described in PRD Part I & IV.

### OD-02: Student Membership Multi-Tenancy
- **Decision**: Students belong to one active primary institution for MVP. Independent learners have a `NULL` institution ID and retain full access to standard readiness and direct recruiter opportunities.
- **Rationale**: Simplifies cohort queries while strictly honoring tenant isolation.

### OD-03: Authentication Architecture
- **Decision**: Lightweight, robust, cookie-backed JWT authentication using `jose` and `bcryptjs`.
- **Rationale**: Completely self-contained, no external auth lock-in, zero runtime edge failures, fully compatible with Next.js App Router and server actions.

### OD-04: Database Storage Strategy
- **Decision**: Prisma ORM with SQLite for zero-setup local dev/test execution, switchable directly to PostgreSQL via `DATABASE_URL` in staging and production.
- **Rationale**: Immediate reliable execution across any environment without waiting for external cloud database provisioning.

### OD-05: Private File Storage
- **Decision**: Abstracted Storage Adapter with local secure disk storage in development (`storage/uploads`) and S3/R2 presigned URLs in production.
- **Rationale**: Zero external credentials needed for local testing while matching S3 API contracts.

### OD-06: Background AI & Job Queue
- **Decision**: In-process durable job orchestrator with fallback for Next.js, with DB-persisted `ai_jobs` table.
- **Rationale**: Allows immediate processing and UI polling/progress feedback without external redis/worker dependencies.

### OD-07: AI Provider & Fallbacks
- **Decision**: Gemini API adapter behind a unified provider interface with complete deterministic fallbacks for resume analysis, skill-gap calculations, roadmap generation, and interview feedback.
- **Rationale**: Ensures the application remains 100% operational and testable even without an active external API key.

### OD-08: Readiness Formula
- **Decision**:
  - Skill coverage (40% weight based on verified assessments & projects)
  - Project evidence (30% weight based on technology relevance)
  - Profile completeness & resume hygiene (20% weight)
  - Self-declared baseline (10% weight)
  - Confidence factor adjusts overall score based on evidence recency.
- **Rationale**: Transparent, deterministic, and non-discriminatory as required by PRD Section 12.8 & 19.3.
