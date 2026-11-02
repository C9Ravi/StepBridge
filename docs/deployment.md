# StepBridge.ai — Production Deployment & DevOps Architecture Guide

## 1. Architectural Topology Overview

StepBridge.ai is built on a scalable, modern cloud-native stack adhering to zero-trust multi-tenancy:
- **Application Engine**: Next.js 16 (App Router) deployed on Vercel Enterprise or AWS ECS (Fargate) with auto-scaling.
- **Relational Database**: Managed PostgreSQL (AWS Aurora Serverless v2, Neon Serverless Postgres, or Supabase Enterprise) with connection pooling via PgBouncer / Prisma Accelerate.
- **Object Storage**: S3-compatible cloud storage (Cloudflare R2 or AWS S3) with pre-signed URLs, virus scanning, and strict MIME-type isolation.
- **Edge CDN & DDoS**: Cloudflare Enterprise with WAF rules, Bot Management, and SSL/TLS termination with HSTS.
- **AI Gateway & Fallback**: Google Gemini 2.5 Flash / Pro with rate-limiting, circuit breakers, token usage tracking, and deterministic rule-based local fallbacks.

```mermaid
graph TD
    Client[Browser / Client Apps] --> CF[Cloudflare CDN & WAF]
    CF --> Vercel[Next.js App Router Cluster]
    Vercel --> Prisma[Prisma ORM & Connection Pooler]
    Prisma --> Postgres[(PostgreSQL Primary + Replicas)]
    Vercel --> S3[(Cloudflare R2 / AWS S3 Object Storage)]
    Vercel --> AI[Google Gemini API]
    Vercel --> Fallback[Deterministic Rule Engine Fallback]
```

---

## 2. Environment Variables Configuration

Set these production environment variables in your deployment runner (Vercel, Doppler, AWS Secrets Manager):

```bash
# Core Environment
NODE_ENV="production"
PORT="3000"
NEXT_PUBLIC_APP_URL="https://app.stepbridge.ai"

# Database Connection (Switch from local SQLite dev.db to managed PostgreSQL)
DATABASE_URL="postgresql://stepbridge_user:StrongPassword123@db.prod.internal:5432/stepbridge_prod?schema=public&connection_limit=50&pool_timeout=20"
DIRECT_URL="postgresql://stepbridge_user:StrongPassword123@db.prod.internal:5432/stepbridge_prod?schema=public"

# Session & Token Security
JWT_SECRET="generate-with-openssl-rand-hex-64-minimum-entropy"
SESSION_COOKIE_NAME="__Host-stepbridge-session"
COOKIE_DOMAIN=".stepbridge.ai"

# AI Configuration
GEMINI_API_KEY="AIzaSy...your_gemini_production_key"
GEMINI_MODEL="gemini-2.5-flash"
GEMINI_FALLBACK_ENABLED="true"

# Cloud Storage (Cloudflare R2 / AWS S3)
STORAGE_PROVIDER="s3"
S3_BUCKET_NAME="stepbridge-production-resumes"
S3_REGION="auto"
S3_ACCESS_KEY_ID="r2_access_key_id"
S3_SECRET_ACCESS_KEY="r2_secret_access_key"
S3_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"

# Feature Flags
FEATURE_BILLING_ENABLED="false"
FEATURE_AI_INTERVIEW_ENABLED="true"
FEATURE_PROCTORING_ENABLED="true"

# Logging & Monitoring
LOG_LEVEL="info"
SENTRY_DSN="https://key@sentry.io/project"
```

---

## 3. Database Migration Strategy

### Zero-Downtime Migration Workflow
1. **Schema Generation**:
   Ensure `prisma/schema.prisma` datasource is switched to postgresql for production:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Apply Migrations in CI/CD Pre-Deployment Step**:
   ```bash
   npx prisma migrate deploy
   ```
3. **Seed Baseline Taxonomy**:
   ```bash
   npx prisma db seed
   ```

### Backup & Disaster Recovery
- Point-In-Time-Recovery (PITR) enabled with 30-day retention on Aurora / Neon.
- Nightly automated logical snapshots exported to an immutable, cross-region S3 backup bucket with WORM (Write Once, Read Many) retention policy.
- Recovery Time Objective (RTO): < 30 minutes.
- Recovery Point Objective (RPO): < 5 minutes.

---

## 4. Containerization (Dockerfile)

A production-optimized, multi-stage Dockerfile for containerized deployments:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 5. Security & Network Hardening

1. **Strict Transport Security (HSTS)**:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
2. **Content Security Policy (CSP)**:
   - Restrict script sources to `'self'` and trusted CDN domains.
   - Forbid `unsafe-eval` and unauthorized iframe embeds (`frame-ancestors 'none'`).
3. **Session Cookie Hardening**:
   - `HttpOnly: true` (inaccessible to browser JavaScript).
   - `Secure: true` (only transmitted over HTTPS).
   - `SameSite: Lax` (prevents cross-site request forgery while preserving top-level redirects).
   - `Path: /`
4. **Rate Limiting**:
   - Cloudflare edge rate limiting on `/api/v1/auth/login` (5 attempts per minute per IP).
   - AI assistant rate limiting: 15 messages per student per month enforced via database audit ledger.
   - Assessment start rate limiting: 24-hour retake cooldown on identical role assessments.
