# Exercise Module Remediation & Mobile Rest Timer Responsive Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix exercise module logic inconsistencies (replace tautological exercise descriptions with real biomechanical instructions, localize equipment tags, enhance safety contraindication catalog logic and routine alternative matching), redesign the workout rest timer for mobile ergonomics and viewport standards (360px-390px), and establish a clean production deployment pipeline.

**Architecture:**
- Backend: Expand `ExerciseSeed` and database seeding in `SeedData.cs` to supply rich biomechanical descriptions and upgrade existing database rows. Refactor `ExerciseService.cs` to support returning contraindicated exercises flagged with `isContraindicated = true` for rich UI warnings, and improve `RoutineService.FindAlternativeAsync` with equipment-based heuristic matching.
- Frontend: Centralize localized equipment labels in `bleid-web/lib/labels.ts` and apply them to `ExerciseModal`, `RoutineEditor`, and `ExercisesPage`. Redesign `RestTimer` with a responsive two-row thumb-friendly mobile layout complying with iOS safe area insets and 44px touch targets.
- Production Delivery: Create and verify database update script for production Supabase PostgreSQL and execute clean merge from `dev` to `main`.

**Tech Stack:** ASP.NET Core (.NET 10), EF Core, PostgreSQL (Supabase), Next.js 14 (App Router), Tailwind CSS, Lucide React, TypeScript.

**Spec:** User reported:
1. "en el curl inclinado con mancuernas dice que es un movimiento para trabajar el biceps" (placeholder tautological description).
2. Full audit of the exercise module logic and remediation for production.
3. Rest timer between sets does not render or fit well on mobile phones; project must meet responsive standards.

## Global Constraints
- Target Mobile Viewports: 360px (compact Android), 375px (iPhone SE), 390px (iPhone 13/14/15/16).
- Safe Area Insets: All bottom docks, floating timers, and sticky action bars must respect `env(safe-area-inset-bottom)`.
- Touch Targets: Interactive controls must provide at least 40-44px tap targets for sweaty hands during training sessions.
- Language & Localization: Idiomatic Argentine/Rioplatense Spanish with proper accents and character support ("ñ", "bíceps", "tríceps", "máquina", "jalón").
- Branching: Execute implementation on `dev`, verify green test suite and build, then deliver to `main` for production.

## Review Focus
1. Rest timer horizontal overflow on 360-375px screens: time, SVG ring, +30s, and Listo button must never wrap brokenly or clip outside viewport.
2. Incline curl description accuracy: "Curl inclinado con mancuernas" must explain bench incline (45°-60°), long-head biceps stretch under shoulder hyperextension, and anti-momentum mechanics.
3. Database seeding updates for existing databases: `SeedExercisesAsync` must update descriptions of exercises that already exist in the database without destroying user workout history or foreign keys.
4. Equipment localization in modal and editor: `exercise.equipment` strings ("Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight") must never appear in English in any user-facing view.
5. Catalog contraindication visibility: Athlete with limitations must be able to see contraindicated exercises clearly tagged with warning badges and tips instead of having them mysteriously vanish.

---

### Task 1: Rich Biomechanical Exercise Descriptions & Database Seeding

**Files:**
- Modify: `bleid-api/BleidAppTraining.Infrastructure/Persistence/SeedData.cs`
- Modify: `bleid-api/BleidAppTraining.Infrastructure/Persistence/BleidDbContext.cs`
- Test: `bleid-api/BleidAppTraining.Application.Tests/ExerciseServiceTests.cs`

**Interfaces:**
- Consumes: `ExerciseSeed` record in `SeedData.cs`.
- Produces: Updated `Exercise.Description` and `ModificationTip` fields with comprehensive biomechanical details.

- [ ] **Step 1: Write test verifying SeedAsync updates descriptions for existing exercises**
  In `ExerciseServiceTests.cs`, add test `SeedAsync_WhenExercisesAlreadyExist_UpdatesDescriptionsAndTips` to assert that re-running seed synchronizes technical descriptions for preexisting exercises.

- [ ] **Step 2: Run test to verify it fails**
  Run: `& "C:\Users\User\AppData\Local\Microsoft\dotnet\dotnet.exe" test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj --filter "SeedAsync_WhenExercisesAlreadyExist_UpdatesDescriptionsAndTips"`
  Expected: FAIL because `SeedExercisesAsync` currently does `if (existing.Any(...)) continue;` and skips updates.

- [ ] **Step 3: Update `ExerciseSeed` and provide authentic technical descriptions**
  Update `ExerciseSeed` in `SeedData.cs` to include a dedicated `Description` field:
  - For `Curl inclinado con mancuernas`: `"Curl en banco inclinado a 45°-60° que sitúa los hombros en hiperextensión y elonga la cabeza larga del bíceps, eliminando el balanceo corporal y maximizando la tensión en el rango extendido."`
  - Provide accurate, concise biomechanical descriptions for all catalog exercises (chest presses, squats, deadlifts, pull-downs, shoulder raises, triceps extensions, etc.).
  - Update `SeedExercisesAsync` to update `Description`, `ModificationTip`, `Equipment`, `Level`, and `Contraindications` for existing database rows when name and muscle group match.

- [ ] **Step 4: Run test to verify it passes**
  Run: `& "C:\Users\User\AppData\Local\Microsoft\dotnet\dotnet.exe" test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj`
  Expected: PASS (all 50+ tests passing).

- [ ] **Step 5: Commit changes**
  ```bash
  git add bleid-api/BleidAppTraining.Infrastructure/Persistence/SeedData.cs bleid-api/BleidAppTraining.Application.Tests/ExerciseServiceTests.cs
  git commit -m "feat(exercises): add rich biomechanical descriptions and seed update sync"
  ```

---

### Task 2: Refactor Catalog Contraindication Visibility in Backend

**Files:**
- Modify: `bleid-api/BleidAppTraining.Application/Services/ExerciseService.cs:10-42`
- Modify: `bleid-api/BleidAppTraining.Application/Contracts/ExerciseContracts.cs`
- Modify: `bleid-api/BleidAppTraining.API/Controllers/ExerciseController.cs`
- Modify: `bleid-api/BleidAppTraining.Application.Tests/ExerciseServiceTests.cs`

**Interfaces:**
- Consumes: `GetCatalogAsync(Guid userId, Guid? muscleGroupId, bool includeContraindicated = true, CancellationToken ct)`
- Produces: `ExerciseResult` with accurate `isContraindicated` boolean flag based on user limitations.

- [ ] **Step 1: Write test for catalog returning contraindicated exercises with flag**
  In `ExerciseServiceTests.cs`, update/add test `GetCatalogAsync_WhenIncludeContraindicated_ReturnsWithFlagTrue` verifying that contraindicated exercises are included in the results with `IsContraindicated == true`.

- [ ] **Step 2: Run test to verify it fails**
  Run: `& "C:\Users\User\AppData\Local\Microsoft\dotnet\dotnet.exe" test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj --filter "GetCatalogAsync_WhenIncludeContraindicated_ReturnsWithFlagTrue"`
  Expected: FAIL.

- [ ] **Step 3: Implement updated `GetCatalogAsync` in `ExerciseService.cs`**
  Modify `GetCatalogAsync` to accept an optional `includeContraindicated = true` parameter (defaulting to true so the catalog displays all exercises, tagging unsafe ones):
  - Mark `isContraindicated = IsContraindicated(exercise.Contraindications, limitations)` for each returned item.
  - If `includeContraindicated == false`, filter them out.
  - Expose parameter in `ExerciseController.cs`: `[FromQuery] bool includeContraindicated = true`.

- [ ] **Step 4: Run backend test suite**
  Run: `& "C:\Users\User\AppData\Local\Microsoft\dotnet\dotnet.exe" test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj`
  Expected: PASS.

- [ ] **Step 5: Commit changes**
  ```bash
  git add bleid-api/BleidAppTraining.Application/Services/ExerciseService.cs bleid-api/BleidAppTraining.API/Controllers/ExerciseController.cs bleid-api/BleidAppTraining.Application.Tests/ExerciseServiceTests.cs
  git commit -m "feat(catalog): return contraindicated exercises with explicit safety flag"
  ```

---

### Task 3: Intelligent Alternative Matching in Routine Generation

**Files:**
- Modify: `bleid-api/BleidAppTraining.Application/Services/RoutineService.cs:307-320`
- Modify: `bleid-api/BleidAppTraining.Application.Tests/RoutineServiceTests.cs`

**Interfaces:**
- Consumes: `FindAlternativeAsync(Exercise source, IReadOnlyCollection<LimitationType> limitations, CancellationToken ct)`
- Produces: Best alternative matching same muscle group, compatible equipment, and appropriate level, rather than arbitrary alphabetical ordering.

- [ ] **Step 1: Write unit test for intelligent alternative selection**
  In `RoutineServiceTests.cs`, add test `FindAlternativeAsync_PrefersCompatibleEquipmentAndLevelOverAlphabetical` to assert that for a barbell exercise, another barbell or dumbbell compound exercise is selected before an isolation machine exercise.

- [ ] **Step 2: Run test to verify it fails**
  Run: `& "C:\Users\User\AppData\Local\Microsoft\dotnet\dotnet.exe" test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj --filter "FindAlternativeAsync_PrefersCompatibleEquipmentAndLevelOverAlphabetical"`
  Expected: FAIL.

- [ ] **Step 3: Implement heuristic scoring in `FindAlternativeAsync`**
  Update `RoutineService.cs`:
  - Query candidate exercises for same `MuscleGroupId`.
  - Filter out contraindicated exercises.
  - Score candidates: +3 points if same `Equipment`, +2 points if compatible equipment (e.g. Barbell <-> Dumbbell), +1 point if same `Level`.
  - Pick candidate with highest score, falling back to name ordering on tie.

- [ ] **Step 4: Run tests to verify it passes**
  Run: `& "C:\Users\User\AppData\Local\Microsoft\dotnet\dotnet.exe" test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj`
  Expected: PASS.

- [ ] **Step 5: Commit changes**
  ```bash
  git add bleid-api/BleidAppTraining.Application/Services/RoutineService.cs bleid-api/BleidAppTraining.Application.Tests/RoutineServiceTests.cs
  git commit -m "feat(routines): implement heuristic equipment and level matching for alternative exercises"
  ```

---

### Task 4: Complete Equipment Localization Across All Frontend Modules

**Files:**
- Modify: `bleid-web/lib/labels.ts`
- Modify: `bleid-web/components/features/exercise-modal.tsx`
- Modify: `bleid-web/components/features/routine-editor.tsx`
- Modify: `bleid-web/app/(app)/exercises/page.tsx`
- Test: `bleid-web/scripts/test-localization.mjs`

**Interfaces:**
- Consumes: `EquipmentType` string (e.g. `"Barbell"`, `"Dumbbell"`, `"Machine"`, `"Cable"`, `"Bodyweight"`).
- Produces: `formatEquipment(equipment?: string): string` and `equipmentLabels: Record<string, string>`.

- [ ] **Step 1: Write unit test assertion in `test-localization.mjs`**
  Add assertions verifying `formatEquipment("Barbell") === "Barra"`, `formatEquipment("Dumbbell") === "Mancuerna"`, `formatEquipment("Machine") === "Máquina"`, `formatEquipment("Cable") === "Polea"`, `formatEquipment("Bodyweight") === "Corporal"`.

- [ ] **Step 2: Run test script to verify failure**
  Run: `cd bleid-web; node scripts/test-localization.mjs`
  Expected: FAIL because `formatEquipment` is not yet exported.

- [ ] **Step 3: Export `equipmentLabels` and `formatEquipment` from `lib/labels.ts`**
  Define unified translation map:
  ```typescript
  export const equipmentLabels: Record<string, string> = {
    Barbell: "Barra",
    Dumbbell: "Mancuerna",
    Machine: "Máquina",
    Cable: "Polea",
    Bodyweight: "Corporal",
  };
  export function formatEquipment(equipment?: string | null): string {
    if (!equipment) return "";
    return equipmentLabels[equipment] || equipment;
  }
  ```
  Replace local definitions and raw English tags in `exercise-modal.tsx`, `routine-editor.tsx`, and `exercises/page.tsx`.

- [ ] **Step 4: Run localization tests and Next.js build**
  Run: `cd bleid-web; node scripts/test-localization.mjs; npm run build`
  Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**
  ```bash
  git add bleid-web/lib/labels.ts bleid-web/components/features/exercise-modal.tsx bleid-web/components/features/routine-editor.tsx bleid-web/app/(app)/exercises/page.tsx bleid-web/scripts/test-localization.mjs
  git commit -m "fix(i18n): unify spanish equipment translations across exercise modal and routine editor"
  ```

---

### Task 5: Mobile Rest Timer Redesign & Viewport Ergonomics

**Files:**
- Modify: `bleid-web/components/features/rest-timer.tsx`
- Modify: `bleid-web/app/(app)/workout/[sessionId]/page.tsx`
- Test: Playwright/Browser inspection or manual viewport check (360px, 375px, 390px).

**Interfaces:**
- Consumes: `RestTimerProps` (`initialSeconds: number`, `exerciseName?: string`, `onFinish?: () => void`, `onClose: () => void`).
- Produces: Ergonomic, non-overflowing floating timer card respecting iPhone safe areas and offering min 44px touch targets.

- [ ] **Step 1: Audit RestTimer dimensions on 360px-390px screens**
  Verify the current single-row layout overflows available width when `exerciseName` is present and buttons are placed side-by-side.

- [ ] **Step 2: Redesign RestTimer layout for mobile responsiveness**
  In `bleid-web/components/features/rest-timer.tsx`:
  - Change card wrapper positioning to respect safe area bottom:
    `fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50`
  - Implement a two-tier responsive flex layout:
    - **Header Row:** Mini SVG progress ring (40px) + Time display (`text-xl font-bold font-mono`) + Exercise name (truncated) + Sound toggle + Close button.
    - **Action Row (Mobile-optimized):** Two large, thumb-friendly buttons:
      - `+30s` button (min-height 42-44px, full touch area).
      - `Listo / Siguiente serie` primary button (min-height 42-44px, full touch area with high contrast).
  - Ensure zero horizontal overflow on screens down to 340px width.

- [ ] **Step 3: Run Next.js build to verify zero compile or type errors**
  Run: `cd bleid-web; npm run build`
  Expected: Build succeeds with code 0.

- [ ] **Step 4: Commit changes**
  ```bash
  git add bleid-web/components/features/rest-timer.tsx bleid-web/app/(app)/workout/[sessionId]/page.tsx
  git commit -m "fix(mobile): redesign rest timer for thumb ergonomics and safe area clearance"
  ```

---

### Task 6: Comprehensive Mobile Responsive Standards Verification

**Files:**
- Audit & Verify: `bleid-web/app/(app)/workout/[sessionId]/page.tsx`
- Audit & Verify: `bleid-web/app/(app)/exercises/page.tsx`
- Audit & Verify: `bleid-web/components/features/exercise-modal.tsx`
- Audit & Verify: `bleid-web/components/layout/app-shell.tsx`

- [ ] **Step 1: Check horizontal scrolling / overflow across pages**
  Inspect `html`, `body`, and container wrappers to ensure `overflow-x-hidden` prevents unwanted horizontal scrolling on mobile.
- [ ] **Step 2: Check touch targets and contrast**
  Ensure all buttons in the workout logger and exercise modal meet the 44×44px interactive tap guideline.
- [ ] **Step 3: Run full automated verification suite**
  - Backend: `& "C:\Users\User\AppData\Local\Microsoft\dotnet\dotnet.exe" test bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj`
  - Frontend: `cd bleid-web; npm run lint; npm run build`
  Expected: All tests pass, build code 0.

- [ ] **Step 4: Commit changes**
  ```bash
  git add bleid-web/
  git commit -m "chore(responsive): audit mobile viewports and touch targets across workout flows"
  ```

---

### Task 7: Production Database Update Script & Deployment to Main

**Files:**
- Create: `docs/deployment/2026-10-31-update-exercises-production.sql`
- Deploy target: Branch `main` (merge from `dev`).

- [ ] **Step 1: Generate SQL script for Supabase Production Database**
  Write `docs/deployment/2026-10-31-update-exercises-production.sql` containing the SQL `UPDATE` statements for all exercises so that production PostgreSQL updates all `description` and `modification_tip` columns immediately without requiring manual wipes.
- [ ] **Step 2: Review git diff between `main` and `dev`**
  Run: `git diff origin/main..dev --stat`
  Verify that all changes are intended and clean.
- [ ] **Step 3: Merge `dev` into `main` and push to production**
  ```bash
  git checkout main
  git pull origin main
  git merge dev --no-ff -m "chore(release): deploy exercise biomechanics, safety logic and mobile rest timer fixes"
  git push origin main
  git checkout dev
  ```
- [ ] **Step 4: Verify production deployment health**
  Confirm deployment succeeds on hosting platform (Vercel / Render / Supabase).
