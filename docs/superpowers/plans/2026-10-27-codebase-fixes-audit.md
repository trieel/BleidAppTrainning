# Codebase Audit Fixes & Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all high and medium severity vulnerabilities, database constraint crashes, data desync issues, and error handling bugs identified in the comprehensive codebase audit.

**Architecture:** Systematic remediation across .NET 9 Clean Architecture (Application service validation, EF Core navigation fixups, exception middleware) and Next.js 14 frontend (API validation problem parsing, fresh session synchronization, resilient 404 routing, JWT expiry guards).

**Tech Stack:** ASP.NET Core 9, Entity Framework Core, PostgreSQL, xUnit, FluentAssertions, Next.js 14 (App Router), TypeScript.

**Spec:** [`docs/superpowers/specs/2026-10-27-codebase-audit-findings.md`](file:///home/catriel/RiderProjects/BleidApp/docs/superpowers/specs/2026-10-27-codebase-audit-findings.md)

## Global Constraints

- Preserve all existing public contracts and JSON schemas for frontend-backend compatibility.
- Zero regressions in existing 29 unit tests (`dotnet test bleid-api/BleidAppTraining.sln`).
- Next.js production build (`npm run build`) must succeed with 0 TypeScript/ESLint errors.
- Do not introduce dark islands or violate the established Warm Editorial design system tokens.

## Review Focus

1. Deleting a routine day that has existing workout sessions must return 400 Bad Request with a clear message, not a 500 foreign key crash.
2. Registering an invalid body weight must return 400 Bad Request with field detail, not 500 Internal Server Error.
3. Adding a new routine day must immediately update `routine.DaysPerWeek` to the accurate count.
4. Refreshing or returning to an active workout session must display all previously logged sets from the database, not stale sessionStorage cache.
5. Transient network or 500 errors on the progress or workout pages must not unexpectedly kick authenticated users to the onboarding flow.

---

### Task 1: Routine Day Deletion Foreign Key Protection (DONE)

**Files:**
- Modify: `bleid-api/BleidAppTraining.Application/Services/RoutineService.cs:105-136`
- Test: `bleid-api/BleidAppTraining.Application.Tests/RoutineServiceTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext.WorkoutSessions`, `ServiceValidationException`
- Produces: Handled `ServiceValidationException` when deleting a day with existing workout sessions

- [x] **Step 1: Write failing unit test in `RoutineServiceTests.cs`**

```csharp
[Fact]
public async Task DeleteDayAsync_WhenDayHasWorkoutSessions_ThrowsServiceValidationException()
{
    // Arrange: routine with day and an associated workout session
    var (context, service) = CreateService();
    var userId = Guid.NewGuid();
    var routine = CreateRoutineWithDays(userId, 2);
    context.Routines.Add(routine);
    var dayId = routine.Days.First().Id;
    context.WorkoutSessions.Add(new WorkoutSession { UserId = userId, RoutineDayId = dayId });
    await context.SaveChangesAsync();

    // Act & Assert
    var act = () => service.DeleteDayAsync(userId, routine.Id, dayId);
    await act.Should().ThrowAsync<ServiceValidationException>()
        .WithMessage("*sesiones de entrenamiento registradas*");
}
```

- [x] **Step 2: Run test to verify it fails**

Run: `dotnet test bleid-api/BleidAppTraining.sln --filter "FullyQualifiedName~DeleteDayAsync_WhenDayHasWorkoutSessions"`
Expected: FAIL (either throws unexpected exception or deletes without error)

- [x] **Step 3: Implement session check in `RoutineService.DeleteDayAsync`**

In `RoutineService.cs`:
```csharp
var hasSessions = await db.WorkoutSessions
    .AnyAsync(s => s.RoutineDayId == dayId, cancellationToken);
if (hasSessions)
    throw new ServiceValidationException("No es posible eliminar un día que ya tiene sesiones de entrenamiento registradas.");
```

- [x] **Step 4: Run test to verify it passes**

Run: `dotnet test bleid-api/BleidAppTraining.sln --filter "FullyQualifiedName~DeleteDayAsync_WhenDayHasWorkoutSessions"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add bleid-api/BleidAppTraining.Application/Services/RoutineService.cs bleid-api/BleidAppTraining.Application.Tests/RoutineServiceTests.cs
git commit -m "fix(api): prevent foreign key crash on routine day deletion with sessions"
```

---

### Task 2: Body Weight Validation & Middleware Exception Normalization (DONE)

**Files:**
- Modify: `bleid-api/BleidAppTraining.Application/Services/BodyWeightService.cs:17-19`
- Modify: `bleid-api/BleidAppTraining.API/Middleware/ExceptionMiddleware.cs:25-42`
- Test: `bleid-api/BleidAppTraining.Application.Tests/BodyWeightServiceTests.cs`

**Interfaces:**
- Consumes: `ServiceValidationException`
- Produces: HTTP 400 Bad Request with validation message instead of 500 error

- [x] **Step 1: Write failing test in `BodyWeightServiceTests.cs`**

```csharp
[Theory]
[InlineData(0)]
[InlineData(-5)]
[InlineData(600)]
public async Task LogAsync_WhenWeightIsInvalid_ThrowsServiceValidationException(decimal invalidWeight)
{
    var (context, service) = CreateService();
    var userId = Guid.NewGuid();
    var act = () => service.LogAsync(userId, new LogBodyWeightCommand(invalidWeight, null, null));
    await act.Should().ThrowAsync<ServiceValidationException>();
}
```

- [x] **Step 2: Run test to verify it fails**

Run: `dotnet test bleid-api/BleidAppTraining.sln --filter "FullyQualifiedName~LogAsync_WhenWeightIsInvalid"`
Expected: FAIL with `ArgumentException` instead of `ServiceValidationException`

- [x] **Step 3: Update `BodyWeightService.cs` and `ExceptionMiddleware.cs`**

In `BodyWeightService.cs`:
```csharp
if (command.WeightKg <= 0 || command.WeightKg > 500)
    throw new ServiceValidationException("El peso corporal debe ser mayor a 0 kg y menor a 500 kg.");
```

In `ExceptionMiddleware.cs`:
Add `ArgumentException argEx => (StatusCodes.Status400BadRequest, "The request is invalid.", argEx.Message),` to the switch expression as defense in depth.

- [x] **Step 4: Run test to verify it passes**

Run: `dotnet test bleid-api/BleidAppTraining.sln --filter "FullyQualifiedName~LogAsync_WhenWeightIsInvalid"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add bleid-api/BleidAppTraining.Application/Services/BodyWeightService.cs bleid-api/BleidAppTraining.API/Middleware/ExceptionMiddleware.cs bleid-api/BleidAppTraining.Application.Tests/BodyWeightServiceTests.cs
git commit -m "fix(api): normalize body weight validation to ServiceValidationException"
```

---

### Task 3: Routine DaysPerWeek Count Synchronization (DONE)

**Files:**
- Modify: `bleid-api/BleidAppTraining.Application/Services/RoutineService.cs:80-103`
- Test: `bleid-api/BleidAppTraining.Application.Tests/RoutineServiceTests.cs`

**Interfaces:**
- Consumes: `routine.Days`
- Produces: Correct `DaysPerWeek` value matching `routine.Days.Count`

- [x] **Step 1: Write failing test in `RoutineServiceTests.cs`**

```csharp
[Fact]
public async Task AddDayAsync_IncrementsDaysPerWeekCorrectly()
{
    var (context, service) = CreateService();
    var userId = Guid.NewGuid();
    var routine = CreateRoutineWithDays(userId, 3);
    context.Routines.Add(routine);
    await context.SaveChangesAsync();

    var result = await service.AddDayAsync(userId, routine.Id, new AddRoutineDayCommand("Día 04"));

    result.DaysPerWeek.Should().Be(4);
    result.Days.Should().HaveCount(4);
}
```

- [x] **Step 2: Run test to verify it fails**

Run: `dotnet test bleid-api/BleidAppTraining.sln --filter "FullyQualifiedName~AddDayAsync_IncrementsDaysPerWeekCorrectly"`
Expected: FAIL (`result.DaysPerWeek` is 3 instead of 4)

- [x] **Step 3: Fix `DaysPerWeek` assignment in `RoutineService.AddDayAsync`**

In `RoutineService.cs`:
```csharp
routine.Days.Add(newDay);
db.RoutineDays.Add(newDay);
routine.DaysPerWeek = routine.Days.Count;
```

- [x] **Step 4: Run test to verify it passes**

Run: `dotnet test bleid-api/BleidAppTraining.sln --filter "FullyQualifiedName~AddDayAsync_IncrementsDaysPerWeekCorrectly"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add bleid-api/BleidAppTraining.Application/Services/RoutineService.cs bleid-api/BleidAppTraining.Application.Tests/RoutineServiceTests.cs
git commit -m "fix(api): synchronize DaysPerWeek count on AddDayAsync"
```

---

### Task 4: Auto-Closure of Stale Unfinished Workout Sessions (DONE)

**Files:**
- Modify: `bleid-api/BleidAppTraining.Application/Services/WorkoutService.cs:28-47`
- Test: `bleid-api/BleidAppTraining.Application.Tests/WorkoutServiceTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext.WorkoutSessions`
- Produces: Single active workout session per user by cleanly auto-finishing any previous stale session

- [x] **Step 1: Write failing test in `WorkoutServiceTests.cs`**

```csharp
[Fact]
public async Task StartSessionAsync_WhenPriorSessionUnfinishedForDifferentDay_ClosesPriorSession()
{
    var (context, service) = CreateService();
    var userId = Guid.NewGuid();
    var routine = CreateRoutineWithDays(userId, 2);
    context.Routines.Add(routine);
    var day1Id = routine.Days.ElementAt(0).Id;
    var day2Id = routine.Days.ElementAt(1).Id;

    var priorSession = new WorkoutSession { UserId = userId, RoutineDayId = day1Id, StartedAt = DateTime.UtcNow.AddDays(-1) };
    context.WorkoutSessions.Add(priorSession);
    await context.SaveChangesAsync();

    var newSession = await service.StartSessionAsync(userId, new StartSessionCommand(day2Id));

    newSession.RoutineDayId.Should().Be(day2Id);
    var oldSessionInDb = await context.WorkoutSessions.FindAsync(priorSession.Id);
    oldSessionInDb!.FinishedAt.Should().NotBeNull();
}
```

- [x] **Step 2: Run test to verify it fails**

Run: `dotnet test bleid-api/BleidAppTraining.sln --filter "FullyQualifiedName~StartSessionAsync_WhenPriorSessionUnfinished"`
Expected: FAIL (`FinishedAt` is null)

- [x] **Step 3: Implement auto-closure in `WorkoutService.StartSessionAsync`**

In `WorkoutService.cs`:
```csharp
var priorActiveSessions = await db.WorkoutSessions
    .Where(item => item.UserId == userId && item.FinishedAt == null)
    .ToListAsync(cancellationToken);

foreach (var prior in priorActiveSessions)
{
    if (prior.RoutineDayId == command.RoutineDayId)
    {
        return await GetSessionAsync(userId, prior.Id, cancellationToken);
    }
    prior.FinishedAt = DateTime.UtcNow;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `dotnet test bleid-api/BleidAppTraining.sln --filter "FullyQualifiedName~StartSessionAsync_WhenPriorSessionUnfinished"`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add bleid-api/BleidAppTraining.Application/Services/WorkoutService.cs bleid-api/BleidAppTraining.Application.Tests/WorkoutServiceTests.cs
git commit -m "fix(api): auto-close prior unclosed workout sessions when starting a new day"
```

---

### Task 5: Upgrade Vulnerable Transitive NuGet Package (DONE)

**Files:**
- Modify: `bleid-api/BleidAppTraining.API/BleidAppTraining.API.csproj`
- Modify: `bleid-api/BleidAppTraining.Infrastructure/BleidAppTraining.Infrastructure.csproj`

- [x] **Step 1: Check existing vulnerable packages**

Run: `dotnet list bleid-api/BleidAppTraining.sln package --vulnerable`
Expected: High severity warning NU1903 for `System.Security.Cryptography.Pkcs` 9.0.0

- [x] **Step 2: Add direct package reference with patched version**

Add `<PackageReference Include="System.Security.Cryptography.Pkcs" Version="9.0.22" />` to both csproj files.

- [x] **Step 3: Run vulnerability audit to verify resolution**

Run: `dotnet list bleid-api/BleidAppTraining.sln package --vulnerable`
Expected: 0 vulnerable packages found

- [x] **Step 4: Run all unit tests**

Run: `dotnet test bleid-api/BleidAppTraining.sln`
Expected: All tests pass

- [x] **Step 5: Commit**

```bash
git add bleid-api/BleidAppTraining.API/BleidAppTraining.API.csproj bleid-api/BleidAppTraining.Infrastructure/BleidAppTraining.Infrastructure.csproj
git commit -m "sec(deps): upgrade System.Security.Cryptography.Pkcs to 9.0.22 to fix GHSA-846f-f764-76mx"
```

---

### Task 6: Frontend API Validation Details Parser & JWT Expiry Check (DONE)

**Files:**
- Modify: `bleid-web/lib/api/client.ts:37-41`
- Modify: `bleid-web/lib/auth.ts:16-18`

**Interfaces:**
- Consumes: `ValidationProblemDetails` JSON body with `errors` dictionary
- Produces: Human-readable `ApiError.message` containing field error messages

- [x] **Step 1: Update `client.ts` to extract validation details**

In `bleid-web/lib/api/client.ts`:
```typescript
if (!response.ok) {
  const body = await response.json().catch(() => null);
  let errorMessage = body?.detail;
  if (!errorMessage && body?.errors && typeof body.errors === "object") {
    errorMessage = Object.values(body.errors).flat().join(" ");
  }
  if (!errorMessage && body?.title) {
    errorMessage = body.title;
  }
  throw new ApiError(errorMessage ?? "No pudimos completar la solicitud.", response.status);
}
```

- [x] **Step 2: Update `lib/auth.ts` to decode JWT expiry**

In `bleid-web/lib/auth.ts`:
```typescript
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      clearToken();
      return false;
    }
    return true;
  } catch {
    return true;
  }
}
```

- [x] **Step 3: Build verification**

Run: `cd bleid-web && npm run build`
Expected: Compiled successfully

- [x] **Step 4: Commit**

```bash
git add bleid-web/lib/api/client.ts bleid-web/lib/auth.ts
git commit -m "fix(web): parse validation errors in apiFetch and check JWT expiration in auth guard"
```

---

### Task 7: Active Workout Session Live Revalidation & Uncapped Sets (DONE)

**Files:**
- Modify: `bleid-web/app/(app)/workout/[sessionId]/page.tsx:50-70,118-124`

**Interfaces:**
- Consumes: `getSession(sessionId)` API
- Produces: Live session sets loaded on mount, bonus/drop sets supported

- [x] **Step 1: Update session loading in `workout/[sessionId]/page.tsx`**

Remove the `if (!currentSession)` check so `getSession(params.sessionId)` is always awaited from the API on mount, while using `sessionStorage` only as an optimistic preview during initial hydration.

- [x] **Step 2: Allow extra sets beyond planned target**

In `saveSet`: remove `if (setNumber > exercise.sets) return;` and allow logging additional sets. In the UI, render a subtle "+ Extra" pill for sets where `setNumber > exercise.sets`.

- [x] **Step 3: Build verification**

Run: `cd bleid-web && npm run build`
Expected: Compiled successfully

- [x] **Step 4: Commit**

```bash
git add bleid-web/app/\(app\)/workout/\[sessionId\]/page.tsx
git commit -m "fix(web): revalidate active session from API and allow bonus sets"
```

---

### Task 8: Resilient Error Handling on Routine/Progress Pages (DONE)

**Files:**
- Modify: `bleid-web/app/(app)/progress/page.tsx:28-35`
- Modify: `bleid-web/app/(app)/workout/page.tsx:35-50`

**Interfaces:**
- Consumes: `ApiError`
- Produces: Only 404 redirects to onboarding; network/500 errors display inline alert message

- [x] **Step 1: Update error handling in `progress/page.tsx`**

In `bleid-web/app/(app)/progress/page.tsx`:
```typescript
.catch((exception) => {
  if (exception instanceof ApiError && exception.status === 404) {
    router.replace("/onboarding");
  } else {
    setError(exception instanceof ApiError ? exception.message : "No pudimos cargar tus métricas.");
  }
})
```

- [x] **Step 2: Update error handling in `workout/page.tsx`**

In `bleid-web/app/(app)/workout/page.tsx`:
```typescript
.catch((exception) => {
  if (exception instanceof ApiError && exception.status === 404) {
    router.replace("/onboarding");
  } else {
    setError(exception instanceof ApiError ? exception.message : "No pudimos cargar tu rutina.");
  }
})
```

- [x] **Step 3: Full solution verification**

Run:
1. `dotnet test bleid-api/BleidAppTraining.sln`
2. `cd bleid-web && npm run build`
3. `.agents/skills/impeccable/scripts/impeccable detect --json`

- [x] **Step 4: Commit**

```bash
git add bleid-web/app/\(app\)/progress/page.tsx bleid-web/app/\(app\)/workout/page.tsx
git commit -m "fix(web): prevent false onboarding redirects on transient API errors"
```
