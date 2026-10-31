# Sistema de Suscripciones con Mercado Pago (+4 Días de Entrenamiento) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un modelo de suscripción mensual recurrente vía Mercado Pago Preapproval (~5 USD / mes fijados en ARS) que desbloquee el entrenamiento de 5 o 6 días por semana en el onboarding y en el gestor de rutinas, manteniendo el acceso gratuito hasta 4 días y recortando ordenadamente los días sobrantes sin pérdida de datos históricos si la suscripción se cancela.

**Architecture:** Integración de checkout hosted de Mercado Pago Preapproval con sincronización asíncrona por webhook y verificación sincrónica inmediata en retorno. A nivel backend, una entidad `Subscription` y bandera `IsActive` en `RoutineDay` gobiernan las reglas de negocio en `OnboardingService`, `RoutineService` y `WorkoutService`. En frontend (Next.js), un componente modal reutilizable informa y gatilla el flujo de upgrade con opción de continuar gratis con 4 días.

**Tech Stack:** .NET 10, ASP.NET Core Web API, Entity Framework Core, PostgreSQL, Next.js (App Router, React 19), TypeScript, Tailwind CSS, Mercado Pago REST API (`/v1/preapproval`).

**Spec:** `docs/superpowers/specs/2026-10-31-sistema-suscripciones-mercadopago-design.md`

## Global Constraints

- Backend implementado en ASP.NET Core (.NET 10) siguiendo la arquitectura existente (`Domain`, `Application`, `Infrastructure`, `API`).
- Cumplimiento estricto PCI-DSS: ningún dato confidencial de tarjeta de crédito/débito es capturado ni almacenado en los servidores de BleidApp; todo el cobro corre en la plataforma oficial de Mercado Pago.
- Integridad referencial protegida: bajo ninguna circunstancia se eliminan físicamente registros de `RoutineDay` que cuenten con `WorkoutSessions` asociadas. Se utiliza la bandera lógica `IsActive`.
- Idempotencia en webhooks: el procesamiento de eventos de Mercado Pago debe ser seguro ante reenvíos duplicados de notificaciones.
- El usuario siempre tiene la opción de usar la app 100% gratis con hasta 4 días por semana.

## Review Focus

1. **Redirección de Onboarding a Mercado Pago sin pérdida de datos**: si el usuario elige 5 o 6 días y presiona suscribirse, su borrador de diagnóstico debe persistirse en cliente para que al volver de Mercado Pago se complete su rutina de 5/6 días.
2. **Condición de carrera entre Webhook y Callback**: Mercado Pago redirige al navegador inmediatamente tras autorizar, mientras que el webhook puede tardar segundos; el backend debe proveer verificación sincrónica con el `preapproval_id`.
3. **Cancelación a mitad de período pagado**: si el usuario cancela en el día 10 del mes, debe conservar el acceso Pro hasta el día 30 (`CurrentPeriodEnd`); no debe ser recortado antes de tiempo.
4. **Intento de inicio de sesión en día inactivo**: si un usuario canceló y su día 5 fue desactivado (`IsActive = false`), `WorkoutService.StartSessionAsync` debe rechazar la creación de sesiones en ese día.
5. **Re-suscripción transparente**: si un usuario que tenía días desactivados vuelve a pagar el plan Pro, los días inactivos deben reactivarse automáticamente sin duplicar días ni rutinas.

---

### Task 1: Domain Entities and Enums (`Subscription`, `SubscriptionStatus`, `RoutineDay.IsActive`)

**Files:**
- Create: `bleid-api/BleidAppTraining.Domain/Enums/SubscriptionStatus.cs`
- Create: `bleid-api/BleidAppTraining.Domain/Entities/Subscription.cs`
- Modify: `bleid-api/BleidAppTraining.Domain/Entities/RoutineDay.cs`
- Modify: `bleid-api/BleidAppTraining.Domain/Entities/User.cs`

**Interfaces:**
- Consumes: None
- Produces:
  - `SubscriptionStatus`: Enum (`Pending = 0`, `Active = 1`, `PastDue = 2`, `Cancelled = 3`)
  - `Subscription`: Entity (`Id`, `UserId`, `ExternalPreapprovalId`, `PayerEmail`, `Status`, `Amount`, `CurrencyId`, `CurrentPeriodEnd`, `CancelledAt`, `CreatedAt`, `UpdatedAt`, `User`)
  - `RoutineDay.IsActive`: bool (default `true`)
  - `User.Subscriptions`: `ICollection<Subscription>`

- [ ] **Step 1: Write Domain model declarations**
  - Create `SubscriptionStatus.cs` con valores `Pending`, `Active`, `PastDue`, `Cancelled`.
  - Create `Subscription.cs` con propiedades `Id`, `UserId`, `ExternalPreapprovalId`, `PayerEmail`, `Status`, `Amount`, `CurrencyId`, `CurrentPeriodEnd`, `CancelledAt`, `CreatedAt`, `UpdatedAt`.
  - Add `public bool IsActive { get; set; } = true;` en `RoutineDay.cs`.
  - Add `public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();` en `User.cs`.

- [ ] **Step 2: Verify compilation of Domain layer**
  - Run: `dotnet build bleid-api/BleidAppTraining.Domain/BleidAppTraining.Domain.csproj`
  - Expected: Build succeeded with 0 errors.

- [ ] **Step 3: Commit Domain changes**
  - Command: `git add bleid-api/BleidAppTraining.Domain/`
  - Command: `git commit -m "feat(domain): add Subscription entity, SubscriptionStatus enum, and RoutineDay.IsActive"`

---

### Task 2: Persistence Configuration, DbContext and Migration

**Files:**
- Create: `bleid-api/BleidAppTraining.Infrastructure/Persistence/Configurations/SubscriptionConfiguration.cs`
- Modify: `bleid-api/BleidAppTraining.Application/Interfaces/IApplicationDbContext.cs`
- Modify: `bleid-api/BleidAppTraining.Infrastructure/Persistence/BleidDbContext.cs`

**Interfaces:**
- Consumes: `Subscription`, `SubscriptionStatus`, `RoutineDay.IsActive` (from Task 1)
- Produces:
  - `IApplicationDbContext.Subscriptions`: `DbSet<Subscription>`
  - Database schema updated with table `Subscriptions` and column `RoutineDays.IsActive`.

- [ ] **Step 1: Create Entity Framework Core Configuration for `Subscription`**
  - En `SubscriptionConfiguration.cs`: configurar tabla `Subscriptions`, clave primaria `Id`, índice único en `ExternalPreapprovalId` (cuando no es null), e índice en `UserId`.
  - Configurar relación `User` con `Subscriptions` (delete restrict/cascade).

- [ ] **Step 2: Update `IApplicationDbContext` and `BleidDbContext`**
  - Agregar `DbSet<Subscription> Subscriptions { get; }` a `IApplicationDbContext.cs`.
  - Agregar `public DbSet<Subscription> Subscriptions => Set<Subscription>();` en `BleidDbContext.cs`.
  - Configurar en `BleidDbContext.OnModelCreating` que `RoutineDay.IsActive` tenga default `true`.

- [ ] **Step 3: Generate and apply EF Core Migration**
  - Run: `dotnet ef migrations add AddSubscriptionsAndRoutineDayIsActive --project bleid-api/BleidAppTraining.Infrastructure --startup-project bleid-api/BleidAppTraining.API`
  - Expected: Migration created successfully in `BleidAppTraining.Infrastructure/Persistence/Migrations/`.

- [ ] **Step 4: Verify Infrastructure project builds**
  - Run: `dotnet build bleid-api/BleidAppTraining.Infrastructure/BleidAppTraining.Infrastructure.csproj`
  - Expected: Build succeeded with 0 errors.

- [ ] **Step 5: Commit persistence changes**
  - Command: `git add bleid-api/BleidAppTraining.Infrastructure/ bleid-api/BleidAppTraining.Application/Interfaces/IApplicationDbContext.cs`
  - Command: `git commit -m "feat(infra): configure Subscriptions table and RoutineDay.IsActive migration"`

---

### Task 3: Mercado Pago Client and Infrastructure Settings

**Files:**
- Create: `bleid-api/BleidAppTraining.Application/Interfaces/IMercadoPagoClient.cs`
- Create: `bleid-api/BleidAppTraining.Infrastructure/Payments/MercadoPagoSettings.cs`
- Create: `bleid-api/BleidAppTraining.Infrastructure/Payments/MercadoPagoClient.cs`
- Modify: `bleid-api/BleidAppTraining.API/appsettings.json`

**Interfaces:**
- Consumes: None
- Produces:
  - `MercadoPagoSettings`: configuration class (`AccessToken`, `WebhookSecret`, `PublicKey`, `BackUrl`, `MonthlyPriceArs`)
  - `IMercadoPagoClient`:
    - `Task<MercadoPagoPreapprovalResponse> CreatePreapprovalAsync(CreatePreapprovalRequest request, CancellationToken ct)`
    - `Task<MercadoPagoPreapprovalResponse?> GetPreapprovalAsync(string preapprovalId, CancellationToken ct)`
    - `Task<bool> CancelPreapprovalAsync(string preapprovalId, CancellationToken ct)`

- [ ] **Step 1: Define `IMercadoPagoClient` interface and DTOs in Application layer**
  - `CreatePreapprovalRequest`: `PayerEmail`, `BackUrl`, `Reason`, `AutoRecurringAmount`, `CurrencyId`.
  - `MercadoPagoPreapprovalResponse`: `Id`, `InitPoint`, `Status`, `PayerEmail`, `NextPaymentDate`, `DateCreated`.

- [ ] **Step 2: Implement `MercadoPagoClient` using `HttpClient` in Infrastructure**
  - Use `HttpClient` configured with `BaseAddress = new Uri("https://api.mercadopago.com/")` y header `Authorization: Bearer <AccessToken>`.
  - Handle JSON serialization/deserialization for `/v1/preapproval` endpoints.
  - Support test/mock mode if `AccessToken` is empty or set to test placeholder.

- [ ] **Step 3: Update `appsettings.json` with `MercadoPago` section**
  - Add:
    ```json
    "MercadoPago": {
      "AccessToken": "TEST-dummy-token",
      "WebhookSecret": "test-webhook-secret",
      "BackUrl": "http://localhost:3000/subscription/callback",
      "MonthlyPriceArs": 6500.00
    }
    ```

- [ ] **Step 4: Verify compilation of Infrastructure layer**
  - Run: `dotnet build bleid-api/BleidAppTraining.Infrastructure/BleidAppTraining.Infrastructure.csproj`
  - Expected: Build succeeded with 0 errors.

- [ ] **Step 5: Commit Mercado Pago Client**
  - Command: `git add bleid-api/BleidAppTraining.Application/Interfaces/IMercadoPagoClient.cs bleid-api/BleidAppTraining.Infrastructure/Payments/ bleid-api/BleidAppTraining.API/appsettings.json`
  - Command: `git commit -m "feat(infra): implement typed MercadoPagoClient for preapproval subscriptions"`

---

### Task 4: Subscription Contracts, Application Service, and Unit Tests

**Files:**
- Create: `bleid-api/BleidAppTraining.Application/Contracts/SubscriptionContracts.cs`
- Create: `bleid-api/BleidAppTraining.Application/Interfaces/ISubscriptionService.cs`
- Create: `bleid-api/BleidAppTraining.Application/Services/SubscriptionService.cs`
- Create: `bleid-api/BleidAppTraining.Application.Tests/SubscriptionServiceTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext`, `IMercadoPagoClient`, `Subscription`, `SubscriptionStatus`
- Produces:
  - `ISubscriptionService`:
    - `Task<SubscriptionCheckoutResult> CreateCheckoutSessionAsync(Guid userId, CancellationToken ct = default)`
    - `Task<SubscriptionStatusResult> VerifySessionAsync(Guid userId, string preapprovalId, CancellationToken ct = default)`
    - `Task<SubscriptionStatusResult> GetStatusAsync(Guid userId, CancellationToken ct = default)`
    - `Task<bool> CancelAsync(Guid userId, CancellationToken ct = default)`
    - `Task<bool> HandleWebhookAsync(MercadoPagoWebhookDto dto, string? signature, CancellationToken ct = default)`
    - `Task EnforceDowngradeAsync(Guid userId, CancellationToken ct = default)`

- [ ] **Step 1: Write failing unit tests for `SubscriptionService`**
  - Test 1: `GetStatusAsync_WhenNoSubscription_ReturnsIsProActiveFalse`
  - Test 2: `CreateCheckoutSessionAsync_CreatesPendingSubscriptionAndReturnsInitPoint`
  - Test 3: `VerifySessionAsync_WhenMpApproved_ActivatesSubscriptionAndSetsCurrentPeriodEnd`
  - Test 4: `GetStatusAsync_WhenCurrentPeriodEndExpired_TriggersDowngradeAndReturnsFalse`
  - Test 5: `EnforceDowngradeAsync_DeactivatesDaysBeyond4_PreservingExistingWorkoutSessions`

- [ ] **Step 2: Run test suite to verify failures**
  - Run: `dotnet test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj --filter FullyQualifiedName~SubscriptionServiceTests`
  - Expected: FAIL (types or methods not implemented yet).

- [ ] **Step 3: Implement `SubscriptionContracts` and `SubscriptionService`**
  - En `CreateCheckoutSessionAsync`: obtener usuario, invocar `IMercadoPagoClient.CreatePreapprovalAsync`, guardar entidad `Subscription` con status `Pending`, retornar `InitPoint`.
  - En `VerifySessionAsync`: consultar MP API por `preapprovalId`. Si el estado en MP es `authorized`, marcar status local `Active`, calcular `CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1)`, reactivar días inactivos de la rutina si los hubiera (`IsActive = true`).
  - En `GetStatusAsync`: verificar suscripción activa más reciente. Si `CurrentPeriodEnd < DateTime.UtcNow`, cambiar estado a `Cancelled` y llamar `EnforceDowngradeAsync`.
  - En `EnforceDowngradeAsync`: buscar rutina activa del usuario. Si tiene más de 4 días activos, ordenar por `Order` descendente y marcar `IsActive = false` en los días 5 y 6. Ajustar `DaysPerWeek = 4`. Guardar cambios.

- [ ] **Step 4: Run test suite to verify tests pass**
  - Run: `dotnet test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj --filter FullyQualifiedName~SubscriptionServiceTests`
  - Expected: All tests pass.

- [ ] **Step 5: Commit Subscription service and tests**
  - Command: `git add bleid-api/BleidAppTraining.Application/Contracts/SubscriptionContracts.cs bleid-api/BleidAppTraining.Application/Interfaces/ISubscriptionService.cs bleid-api/BleidAppTraining.Application/Services/SubscriptionService.cs bleid-api/BleidAppTraining.Application.Tests/SubscriptionServiceTests.cs`
  - Command: `git commit -m "feat(application): implement SubscriptionService with downgrade and tests"`

---

### Task 5: Domain Gating in Onboarding, Routine and Workout Services

**Files:**
- Modify: `bleid-api/BleidAppTraining.Application/Services/OnboardingService.cs`
- Modify: `bleid-api/BleidAppTraining.Application/Services/RoutineService.cs`
- Modify: `bleid-api/BleidAppTraining.Application/Services/WorkoutService.cs`
- Modify: `bleid-api/BleidAppTraining.Application/Services/ResultMappings.cs`
- Modify: `bleid-api/BleidAppTraining.Application.Tests/RoutineServiceTests.cs`

**Interfaces:**
- Consumes: `ISubscriptionService`
- Produces:
  - `OnboardingService`: rejects `DaysPerWeek > 4` if user is not Pro active.
  - `RoutineService.AddDayAsync`: rejects adding 5th day if user is not Pro active.
  - `ResultMappings.Routine`: filters out days where `IsActive == false`.
  - `WorkoutService.StartSessionAsync`: throws validation exception if `day.IsActive == false`.

- [ ] **Step 1: Write failing tests for gating rules**
  - In `RoutineServiceTests.cs`:
    - `AddDayAsync_WhenRoutineHas4DaysAndUserNotPro_ThrowsValidationException`
    - `AddDayAsync_WhenRoutineHas4DaysAndUserIsPro_Succeeds`
  - Add test for `WorkoutServiceTests.cs`:
    - `StartSessionAsync_WhenDayIsInactive_ThrowsServiceValidationException`

- [ ] **Step 2: Run tests to verify failure**
  - Run: `dotnet test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj --filter "FullyQualifiedName~RoutineServiceTests|FullyQualifiedName~WorkoutServiceTests"`
  - Expected: FAIL due to missing gating checks.

- [ ] **Step 3: Implement gating in services**
  - In `OnboardingService.cs`: inject `ISubscriptionService`. In `CompleteAsync`, if `command.DaysPerWeek > 4`:
    - Check `(await subscriptionService.GetStatusAsync(userId, cancellationToken)).IsProActive`. If false, throw `ServiceValidationException("Se requiere una suscripción Pro activa para configurar más de 4 días de entrenamiento.")`.
  - In `RoutineService.cs`: inject `ISubscriptionService`. In `AddDayAsync`:
    - Check `var activeDaysCount = routine.Days.Count(d => d.IsActive);`
    - If `activeDaysCount >= 4`: check `(await subscriptionService.GetStatusAsync(userId, cancellationToken)).IsProActive`. If false, throw `ServiceValidationException("Se requiere una suscripción Pro activa para agregar más de 4 días de entrenamiento.")`.
  - In `ResultMappings.cs`: in `Routine(Routine routine)`:
    - Filter `routine.Days.Where(day => day.IsActive)`.
  - In `WorkoutService.cs`: in `StartSessionAsync`:
    - Check `if (!day.IsActive) throw new ServiceValidationException("El día de entrenamiento seleccionado no se encuentra activo.");`.

- [ ] **Step 4: Run tests to verify they pass**
  - Run: `dotnet test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj`
  - Expected: PASS all tests.

- [ ] **Step 5: Commit gating modifications**
  - Command: `git add bleid-api/BleidAppTraining.Application/ bleid-api/BleidAppTraining.Application.Tests/`
  - Command: `git commit -m "feat(application): enforce subscription gating on onboarding, routine days and workouts"`

---

### Task 6: Subscriptions API Controller and DI Registration

**Files:**
- Create: `bleid-api/BleidAppTraining.API/Controllers/SubscriptionsController.cs`
- Modify: `bleid-api/BleidAppTraining.API/Program.cs`

**Interfaces:**
- Consumes: `ISubscriptionService`, `IMercadoPagoClient`, `MercadoPagoSettings`
- Produces:
  - `POST /api/subscriptions/checkout`: `{ initPoint: string }`
  - `POST /api/subscriptions/verify`: `{ isProActive: bool, status: string, currentPeriodEnd: string }`
  - `GET /api/subscriptions/my`: `{ isProActive: bool, status: string, currentPeriodEnd: string }`
  - `POST /api/subscriptions/cancel`: `{ success: bool }`
  - `POST /api/subscriptions/webhook`: 200 OK

- [ ] **Step 1: Create `SubscriptionsController`**
  - Inherit from `AuthenticatedControllerBase`.
  - Add endpoints:
    - `[HttpPost("checkout")]` -> `CreateCheckoutSessionAsync(CurrentUserId)`
    - `[HttpPost("verify")]` -> `VerifySessionAsync(CurrentUserId, request.PreapprovalId)`
    - `[HttpGet("my")]` -> `GetStatusAsync(CurrentUserId)`
    - `[HttpPost("cancel")]` -> `CancelAsync(CurrentUserId)`
    - `[AllowAnonymous] [HttpPost("webhook")]` -> `HandleWebhookAsync(...)` (validates `x-signature` header against `MercadoPagoSettings.WebhookSecret`).

- [ ] **Step 2: Register services in `Program.cs`**
  - Bind `builder.Configuration.GetSection("MercadoPago").Get<MercadoPagoSettings>()`.
  - Register `builder.Services.AddHttpClient<IMercadoPagoClient, MercadoPagoClient>()`.
  - Register `builder.Services.AddScoped<ISubscriptionService, SubscriptionService>()`.

- [ ] **Step 3: Verify API builds and runs tests**
  - Run: `dotnet build bleid-api/BleidAppTraining.API/BleidAppTraining.API.csproj`
  - Run: `dotnet test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj`
  - Expected: Build succeeded and tests passing.

- [ ] **Step 4: Commit API changes**
  - Command: `git add bleid-api/BleidAppTraining.API/`
  - Command: `git commit -m "feat(api): add SubscriptionsController and register services"`

---

### Task 7: Frontend Types, API Client and Subscription Modal Component

**Files:**
- Modify: `bleid-web/types/index.ts`
- Create: `bleid-web/lib/api/subscription.ts`
- Modify: `bleid-web/lib/api/index.ts`
- Create: `bleid-web/components/features/subscription-modal.tsx`

**Interfaces:**
- Consumes: `/api/subscriptions/*` endpoints
- Produces:
  - `SubscriptionInfo` type
  - `getSubscriptionStatus()`, `createSubscriptionCheckout()`, `verifySubscription()`, `cancelSubscription()`
  - `<SubscriptionModal open={boolean} onClose={fn} onContinueFree={fn?} source="onboarding" | "workout" />`

- [ ] **Step 1: Add types in `bleid-web/types/index.ts`**
  - `export type SubscriptionStatus = "Pending" | "Active" | "PastDue" | "Cancelled";`
  - `export interface SubscriptionInfo { isProActive: boolean; status: SubscriptionStatus | null; currentPeriodEnd: string | null; }`

- [ ] **Step 2: Implement API client in `bleid-web/lib/api/subscription.ts`**
  - Functions: `getSubscriptionStatus`, `createSubscriptionCheckout`, `verifySubscription`, `cancelSubscription`.
  - Export them from `bleid-web/lib/api/index.ts`.

- [ ] **Step 3: Create `<SubscriptionModal>` in `bleid-web/components/features/subscription-modal.tsx`**
  - Professional design with project's design system:
    - Header: Badge "BLEID PRO", title "Entrená 5 o 6 días por semana".
    - Price callout: "$6.500 ARS/mes (~5 USD) · Débito automático recurrente".
    - Value bullets:
      - "Rutinas avanzadas (splits Push/Pull/Legs y frecuencia personalizada)".
      - "Mayor volumen de series y recuperación optimizada".
      - "Cancelación con 1 click en cualquier momento".
    - Buttons:
      - Botón primario: "Suscribirme con Mercado Pago" (con spinner de carga al invocar `createSubscriptionCheckout` y redireccionar a `initPoint`).
      - Botón secundario condicional (si `onContinueFree` está presente): "Continuar gratis con 4 días".
      - Botón cerrar (X).

- [ ] **Step 4: Verify frontend type check**
  - Run: `cd bleid-web && npx tsc --noEmit --incremental false`
  - Expected: No TypeScript compilation errors.

- [ ] **Step 5: Commit modal and client**
  - Command: `git add bleid-web/types/index.ts bleid-web/lib/api/ bleid-web/components/features/subscription-modal.tsx`
  - Command: `git commit -m "feat(web): add subscription API client, types and SubscriptionModal"`

---

### Task 8: Frontend Onboarding Integration

**Files:**
- Modify: `bleid-web/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: `<SubscriptionModal />`, `createSubscriptionCheckout`, `completeOnboarding`
- Produces: Seamless onboarding experience with Pro upgrade gate and free fallback.

- [ ] **Step 1: Update Step 2 (Frequency slider) in `onboarding/page.tsx`**
  - If `days > 4`, display a gold/primary badge: `"PRO - Requiere suscripción"`.
  - Maintain slider range `min="2" max="6"`.

- [ ] **Step 2: Update Step 4 (Final step / "Crear mi rutina")**
  - When user clicks "Crear mi rutina":
    - If `days > 4`:
      - Save full onboarding form draft to `localStorage.setItem("bleid-pending-onboarding", JSON.stringify(formData))`.
      - Show `SubscriptionModal`.
      - If user clicks "Continuar gratis con 4 días": set `days = 4`, hide modal, and execute `completeOnboarding` with `daysPerWeek: 4`.
      - If user clicks "Suscribirme", modal redirects to Mercado Pago `initPoint`.
    - If `days <= 4`:
      - Execute `completeOnboarding` directly as normal.

- [ ] **Step 3: Run frontend linter and type check**
  - Run: `cd bleid-web && npm run lint && npx tsc --noEmit --incremental false`
  - Expected: Clean lint and zero type errors.

- [ ] **Step 4: Commit onboarding integration**
  - Command: `git add bleid-web/app/onboarding/page.tsx`
  - Command: `git commit -m "feat(web): integrate Pro paywall and free fallback in onboarding"`

---

### Task 9: Frontend Workout View Gating

**Files:**
- Modify: `bleid-web/app/(app)/workout/page.tsx`

**Interfaces:**
- Consumes: `<SubscriptionModal />`, `getSubscriptionStatus`
- Produces: Pro gate when clicking "+ Agregar día" on a 4-day routine.

- [ ] **Step 1: Check routine day count on `handleAddDay` click**
  - In `workout/page.tsx`:
    - Add state: `const [showProModal, setShowProModal] = useState(false);`
    - In "+ Agregar día" button trigger:
      - If `routine.days.length >= 4`: check if user is Pro. If not Pro, open `setShowProModal(true)` instead of `setShowAddDayModal(true)`.
      - If `routine.days.length < 4` or user is Pro: open `setShowAddDayModal(true)`.

- [ ] **Step 2: Render `<SubscriptionModal>` in `workout/page.tsx`**
  - Render `<SubscriptionModal open={showProModal} onClose={() => setShowProModal(false)} source="workout" />`.

- [ ] **Step 3: Verify frontend type check**
  - Run: `cd bleid-web && npx tsc --noEmit --incremental false`
  - Expected: PASS.

- [ ] **Step 4: Commit workout view gating**
  - Command: `git add bleid-web/app/(app)/workout/page.tsx`
  - Command: `git commit -m "feat(web): gate 5th routine day addition behind SubscriptionModal"`

---

### Task 10: Frontend Subscription Callback and Verification Page

**Files:**
- Create: `bleid-web/app/(app)/subscription/callback/page.tsx`

**Interfaces:**
- Consumes: `verifySubscription()`, `completeOnboarding()`
- Produces: Callback route `/subscription/callback?preapproval_id=...`

- [ ] **Step 1: Implement Callback Page component**
  - Read `preapproval_id` from search params.
  - Show loading state: "Confirmando tu suscripción a Bleid Pro...".
  - Invoke `verifySubscription(preapprovalId)`.
  - Check if `localStorage.getItem("bleid-pending-onboarding")` exists:
    - If exists: parse payload, call `completeOnboarding(payload)`, clean `localStorage`, show success notification "¡Plan Pro activado! Tu rutina de X días está lista", and redirect to `/dashboard`.
    - If does not exist (upgraded from Workout page): show success notification "¡Plan Pro activado! Ya podés agregar tus días extra", and redirect to `/workout`.
  - Handle errors or cancellation: if Mercado Pago returned cancelled or verification fails, display clear alert and button to return to `/dashboard` or retry.

- [ ] **Step 2: Verify frontend type check and build**
  - Run: `cd bleid-web && npm run lint && npx tsc --noEmit --incremental false`
  - Expected: 0 errors.

- [ ] **Step 3: Commit callback page**
  - Command: `git add bleid-web/app/(app)/subscription/callback/`
  - Command: `git commit -m "feat(web): implement subscription callback verification page"`
