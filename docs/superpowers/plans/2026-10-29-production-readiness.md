# BleidApp Production Readiness Implementation Plan

> **Status:** COMPLETED & VERIFIED ON `dev`
> **Total Commits on `dev`:** 9 commits
> **Backend Tests:** 50/50 passing (0 failures)
> **Frontend Build:** 15/15 static and dynamic routes compiled, 0 ESLint errors, 0 TypeScript errors

**Goal:** Elevate BleidApp from a working developer MVP to a hardened, resilient, production-ready release for deployment on Render and mobile PWA.

**Architecture:** ASP.NET Core 10 Web API (Clean Architecture with PostgreSQL EF Core, dynamic timezone resolution, database-backed health checks, secure forwarded proxy handling) and Next.js 14 PWA (Warm Editorial design, resilient empty states, active workout unload safeguards, and production SEO/PWA metadata).

**Tech Stack:** .NET 10, Entity Framework Core, PostgreSQL, Next.js 14 (App Router), TypeScript, Tailwind CSS, Workbox PWA, xUnit.

**Spec:** [`docs/superpowers/specs/2026-10-27-codebase-audit-findings.md`](file:///C:/Users/User/Downloads/BleidAppTrainning/docs/superpowers/specs/2026-10-27-codebase-audit-findings.md)

## Global Constraints

- Must run on branch `dev` with continuous autonomous execution.
- Zero regressions: all 50 backend unit tests must pass (`dotnet test bleid-api/BleidAppTraining.sln`).
- Next.js production build (`npm run build`) must succeed with 0 TypeScript/ESLint errors and generate all 15 static/dynamic routes.
- Strict security: JWT Secret must be enforced to >= 32 characters in Production; stack traces and internal exceptions must never leak to API consumers.
- No breakages to existing JSON contracts used by mobile/web clients.

## Review Focus

1. Users training in timezones other than UTC-3 must have their workouts, streaks, and bodyweight dates attributed to their actual local calendar day.
2. Production health check at `GET /health` must verify PostgreSQL database connectivity before reporting healthy to the container orchestrator.
3. Users behind reverse proxies (Render, Cloudflare) must not have their authentication rate-limiting pooled under a single IP partition.
4. Users navigating away from an active workout with unsaved sets must receive a browser confirmation prompt to avoid data loss.
5. All PWA metadata, manifest icons, and search engine tags must be valid and conform to WCAG contrast standards.

---

### Task 1: Dynamic Client Timezone Resolution in Backend Metrics

**Files:**
- Modify: `bleid-api/BleidAppTraining.Application/Services/ProgressService.cs`
- Modify: `bleid-api/BleidAppTraining.Application/Services/BodyWeightService.cs`
- Modify: `bleid-api/BleidAppTraining.API/Controllers/ProgressController.cs`
- Modify: `bleid-api/BleidAppTraining.API/Controllers/BodyWeightController.cs`
- Modify: `bleid-api/BleidAppTraining.API/Controllers/AuthenticatedControllerBase.cs`
- Modify: `bleid-web/lib/api/client.ts`
- Test: `bleid-api/BleidAppTraining.Application.Tests/ProgressServiceTests.cs`

- [x] **Step 1: Write failing test in `ProgressServiceTests.cs` for timezone offset support**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement dynamic timezone in `ProgressService` and `BodyWeightService`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit** (`8ad4389`)

---

### Task 2: Database-Backed Production Health Check & Proxy Rate Limiting

**Files:**
- Modify: `bleid-api/BleidAppTraining.API/Program.cs`
- Modify: `bleid-api/BleidAppTraining.API/BleidAppTraining.API.csproj`

- [x] **Step 1: Add Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore to API**
- [x] **Step 2: Configure DbContext health check and robust rate limiting in `Program.cs`**
- [x] **Step 3: Run backend tests to verify compilation and no regressions**
- [x] **Step 4: Commit** (`ae579e0`)

---

### Task 3: Unsaved Changes Guard in Active Workout Session

**Files:**
- Modify: `bleid-web/app/(app)/workout/[sessionId]/page.tsx`

- [x] **Step 1: Add `beforeunload` hook in active workout page**
- [x] **Step 2: Clean up listener on unmount or session finish**
- [x] **Step 3: Run web checks**
- [x] **Step 4: Commit** (`9a94918`)

---

### Task 4: Hardened Production Empty States & Metric Guidance

**Files:**
- Modify: `bleid-web/app/(app)/progress/page.tsx`
- Modify: `bleid-web/app/(app)/dashboard/page.tsx`

- [x] **Step 1: Protect `Math.max` calls against empty arrays**
- [x] **Step 2: Add editorial empty state banners when volume or weight history is empty**
- [x] **Step 3: Run web checks (`npm run lint` & `npx tsc --noEmit`)**
- [x] **Step 4: Commit** (`8339824`)

---

### Task 5: Production SEO, PWA Manifest, and Security Dependencies

**Files:**
- Modify: `bleid-web/app/layout.tsx`
- Modify: `bleid-web/package-lock.json`

- [x] **Step 1: Update metadata in `app/layout.tsx` with OpenGraph, keywords, metadataBase and mobile viewport restrictions**
- [x] **Step 2: Resolve npm security vulnerabilities with safe `npm audit fix`**
- [x] **Step 3: Verify full production build (`npm run build`)**
- [x] **Step 4: Commit** (`e97cf92`)

---

### Task 6: Full Solution End-to-End Verification

**Files:**
- Solution-wide verification

- [x] **Step 1: Run complete backend test suite (`dotnet test bleid-api/BleidAppTraining.sln`)** -> 50/50 passing.
- [x] **Step 2: Run complete frontend build (`cd bleid-web && npm run build`)** -> 15/15 routes generated with zero errors.
- [x] **Step 3: Verify git tree on `dev`** -> Working tree clean.

---

## Git Execution Log on `dev`

1. `15ee89c`: `fix(profile): sync SessionMin validation with database constraint and improve error resilience`
2. `3b3e1dd`: `feat(db): enforce unique index on BodyWeightEntries (UserId, Date) and add concurrency handling`
3. `354269c`: `feat(validation): add command validators, forward headers ordering and expose live error messages`
4. `09aa0ef`: `test(onboarding): add comprehensive unit test suite for OnboardingService`
5. `8ad4389`: `feat(api): support dynamic client timezone offsets for streaks, volume and bodyweight`
6. `ae579e0`: `feat(health): integrate EF Core database check into /health and harden rate limiting`
7. `9a94918`: `feat(web): add unload warning guard for in-progress workout sessions`
8. `8339824`: `feat(ui): harden metric calculations and enhance empty states with Warm Editorial guidance`
9. `e97cf92`: `feat(seo): configure production open graph, keywords and mobile viewport restrictions`
