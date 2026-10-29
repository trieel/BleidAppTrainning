# BleidApp Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (chosen by user for autonomous inline execution on `dev`) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate BleidApp from a working developer MVP to a hardened, resilient, production-ready release for deployment on Render and mobile PWA.

**Architecture:** ASP.NET Core 10 Web API (Clean Architecture with PostgreSQL EF Core, dynamic timezone resolution, database-backed health checks, secure forwarded proxy handling) and Next.js 14 PWA (Warm Editorial design, resilient empty states, active workout unload safeguards, and production SEO/PWA metadata).

**Tech Stack:** .NET 10, Entity Framework Core, PostgreSQL, Next.js 14 (App Router), TypeScript, Tailwind CSS, Workbox PWA, xUnit, FluentAssertions.

**Spec:** [`docs/superpowers/specs/2026-10-27-codebase-audit-findings.md`](file:///C:/Users/User/Downloads/BleidAppTrainning/docs/superpowers/specs/2026-10-27-codebase-audit-findings.md)

## Global Constraints

- Must run on branch `dev` with continuous autonomous execution.
- Zero regressions: all 49 existing backend unit tests must pass (`dotnet test bleid-api/BleidAppTraining.sln`).
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
- Modify: `bleid-api/BleidAppTraining.Application/Services/ProgressService.cs:9-65`
- Modify: `bleid-api/BleidAppTraining.Application/Services/BodyWeightService.cs:11-30`
- Modify: `bleid-api/BleidAppTraining.API/Controllers/ProgressController.cs:10-40`
- Modify: `bleid-api/BleidAppTraining.API/Controllers/BodyWeightController.cs:15-35`
- Test: `bleid-api/BleidAppTraining.Application.Tests/ProgressServiceTests.cs`
- Modify: `bleid-web/lib/api/client.ts:15-25`

**Interfaces:**
- Consumes: Header `X-Timezone-Offset` (integer minutes from UTC, e.g. -180 for GMT-3, +60 for GMT+1) or query parameter.
- Produces: Correct date aggregation for streak, weekly volume, and bodyweight history according to caller's local timezone.

- [ ] **Step 1: Write failing test in `ProgressServiceTests.cs` for timezone offset support**

```csharp
[Fact]
public async Task GetStreakAsync_WithCustomTimezoneOffset_CalculatesAccordingToCallerTimezone()
{
    using var db = TestDbContextFactory.Create(nameof(GetStreakAsync_WithCustomTimezoneOffset_CalculatesAccordingToCallerTimezone));
    var userId = Guid.NewGuid();
    var session = new WorkoutSession
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        RoutineDayId = Guid.NewGuid(),
        StartedAt = DateTime.UtcNow,
        FinishedAt = DateTime.UtcNow
    };
    db.WorkoutSessions.Add(session);
    await db.SaveChangesAsync();

    var service = new ProgressService(db);
    // Calling with Tokyo time (+09:00, 540 min)
    var result = await service.GetStreakAsync(userId, timezoneOffsetMinutes: 540);

    Assert.NotNull(result);
    Assert.Equal(1, result.CurrentStreak);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `$env:DOTNET_ROOT="C:\Users\User\AppData\Local\Microsoft\dotnet"; & "$env:DOTNET_ROOT\dotnet.exe" test bleid-api/BleidAppTraining.sln --filter "FullyQualifiedName~GetStreakAsync_WithCustomTimezoneOffset"`
Expected: FAIL (method signature does not accept timezoneOffsetMinutes parameter)

- [ ] **Step 3: Implement dynamic timezone in `ProgressService` and `BodyWeightService`**

Allow an optional `int? timezoneOffsetMinutes` (defaulting to -180 for backwards compatibility) in:
- `IProgressService`: `GetVolumeAsync`, `GetStreakAsync`, `GetExerciseProgressAsync`, `GetLatestPerformanceAsync`
- `IBodyWeightService`: `LogAsync`, `GetHistoryAsync`
In controllers, read header `X-Timezone-Offset` (parsed as `int`) and forward to services.
In `bleid-web/lib/api/client.ts`, automatically append `headers.set("X-Timezone-Offset", String(-new Date().getTimezoneOffset()))`.

- [ ] **Step 4: Run test to verify it passes**

Run: `$env:DOTNET_ROOT="C:\Users\User\AppData\Local\Microsoft\dotnet"; & "$env:DOTNET_ROOT\dotnet.exe" test bleid-api/BleidAppTraining.sln --filter "FullyQualifiedName~GetStreakAsync_WithCustomTimezoneOffset"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add bleid-api/ bleid-web/lib/api/client.ts
git commit -m "feat(api): support dynamic client timezone offsets for streaks, volume and bodyweight"
```

---

### Task 2: Database-Backed Production Health Check & Proxy Rate Limiting

**Files:**
- Modify: `bleid-api/BleidAppTraining.API/Program.cs:45-66,155-163`
- Modify: `bleid-api/BleidAppTraining.API/BleidAppTraining.API.csproj`
- Test: Manual curl / integration test

**Interfaces:**
- Consumes: EF Core `BleidDbContext`
- Produces: `GET /health` returns HTTP 200 `{"status": "healthy", "database": "healthy"}` when DB is reachable, HTTP 503 when DB fails.
- Fixes rate limiter partition key to handle proxy forwarded IPs safely without falling back to a single shared "unknown" bucket.

- [ ] **Step 1: Add Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore to API**

Add PackageReference `Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore` version `10.0.14` (or compatible .NET 10 version).

- [ ] **Step 2: Configure DbContext health check and robust rate limiting in `Program.cs`**

In `Program.cs`:
1. Register `builder.Services.AddHealthChecks().AddDbContextCheck<BleidDbContext>("database");`
2. Update `app.MapHealthChecks("/health")` with JSON response showing status.
3. Update `AuthPolicy` rate limiter:
   If `context.Connection.RemoteIpAddress` is null, check header `X-Forwarded-For` before defaulting. If still unresolved, partition by user email in request body if available or connection ID, preventing denial of service against other athletes.

- [ ] **Step 3: Run backend tests to verify compilation and no regressions**

Run: `$env:DOTNET_ROOT="C:\Users\User\AppData\Local\Microsoft\dotnet"; & "$env:DOTNET_ROOT\dotnet.exe" test bleid-api/BleidAppTraining.sln`
Expected: 50/50 PASS

- [ ] **Step 4: Commit**

```bash
git add bleid-api/BleidAppTraining.API/
git commit -m "feat(health): integrate EF Core database check into /health and harden rate limiting"
```

---

### Task 3: Unsaved Changes Guard in Active Workout Session

**Files:**
- Modify: `bleid-web/app/(app)/workout/[sessionId]/page.tsx:30-100`

**Interfaces:**
- Consumes: Browser `beforeunload` event and React Router navigation.
- Produces: Warning prompt if user tries to close the tab or navigate back while an active workout has sets logged but has not been finished with `endSession()`.

- [ ] **Step 1: Add `beforeunload` hook in active workout page**

When `session && !session.finishedAt && session.sets.length > 0`, attach a `window.addEventListener("beforeunload", handler)` that warns the athlete that their workout session is currently active.

- [ ] **Step 2: Clean up listener on unmount or session finish**

Ensure listener is cleanly removed when `session.finishedAt` is set or when completing `finish()`.

- [ ] **Step 3: Run web checks**

Run: `cd bleid-web && npm run lint && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add bleid-web/app/\(app\)/workout/\[sessionId\]/page.tsx
git commit -m "feat(web): add unload warning guard for in-progress workout sessions"
```

---

### Task 4: Hardened Production Empty States & Metric Guidance

**Files:**
- Modify: `bleid-web/app/(app)/progress/page.tsx:80-160`
- Modify: `bleid-web/app/(app)/dashboard/page.tsx:140-220`

**Interfaces:**
- Consumes: Empty `volume` array (`[]`) or `history` (`[]`).
- Produces: Helpful, beautifully styled empty states in *Warm Editorial* aesthetic with clear call-to-action buttons ("Comenzar primer entrenamiento", "Registrar pesaje inicial") instead of blank graphs or broken math calculations (`Math.max(...[]) = -Infinity`).

- [ ] **Step 1: Protect `Math.max` calls against empty arrays**

In `progress/page.tsx` and `dashboard/page.tsx`:
Change `Math.max(...volume.map(v => v.totalVolumeKg), 1)` to handle empty collections safely without `NaN` or `-Infinity`.

- [ ] **Step 2: Add editorial empty state banners when volume or weight history is empty**

Provide an encouraging message explaining that volume trends will populate automatically after completing their first workout.

- [ ] **Step 3: Run web checks**

Run: `cd bleid-web && npm run lint && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add bleid-web/app/\(app\)/progress/page.tsx bleid-web/app/\(app\)/dashboard/page.tsx
git commit -m "feat(web): add robust empty states and safe volume calculations for new athletes"
```

---

### Task 5: Production SEO, PWA Manifest, and Security Headers Verification

**Files:**
- Modify: `bleid-web/app/layout.tsx:1-40`
- Modify: `bleid-web/app/manifest.ts`
- Modify: `bleid-web/package.json` (audit fix)

**Interfaces:**
- Consumes: Next.js metadata API
- Produces: Complete OpenGraph tags, canonical tags, theme colors, athletic favicon, and vulnerability-free npm tree.

- [ ] **Step 1: Update metadata in `app/layout.tsx`**

Include:
- `title`: `BleidApp — Entrenamiento y Sobrecarga Progresiva Inteligente`
- `description`: `Plataforma inteligente de entrenamiento de fuerza adaptada a tus articulaciones y objetivos biomecánicos.`
- `keywords`: `["fitness", "entrenamiento", "fuerza", "hipertrofia", "sobrecarga progresiva", "rutina"]`
- `themeColor`: `#18181B`
- `viewport`: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no` (prevents iOS double-tap zoom on inputs).

- [ ] **Step 2: Resolve npm security vulnerabilities**

Run `cd bleid-web && npm audit fix` (avoiding breaking `--force` upgrades that break Next 14 app router).

- [ ] **Step 3: Verify full production build**

Run: `cd bleid-web && npm run build`
Expected: Compiled successfully, all 15 routes generated with optimized PWA service worker.

- [ ] **Step 4: Commit**

```bash
git add bleid-web/
git commit -m "feat(seo): configure production PWA metadata, viewport lock and resolve npm audit dependencies"
```

---

### Task 6: Full Solution End-to-End Verification

**Files:**
- Verify: Full repository test and build suites.

- [ ] **Step 1: Run complete backend test suite**

Run: `$env:DOTNET_ROOT="C:\Users\User\AppData\Local\Microsoft\dotnet"; & "$env:DOTNET_ROOT\dotnet.exe" test bleid-api/BleidAppTraining.sln`
Expected: 50+ tests passing, 0 failures.

- [ ] **Step 2: Run complete frontend build**

Run: `cd bleid-web && npm run build`
Expected: Compiled successfully with zero errors.

- [ ] **Step 3: Verify git tree on `dev`**

Run: `git status`
Expected: Working tree clean on branch `dev`.
