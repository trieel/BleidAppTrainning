# Mobile Modules Compaction & Exercise Localization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver ultra-compact mobile layouts for iPhone 13 (390×844px) across Ejercicios (`/exercises`), Progreso (`/progress`), Historial (`/history`), and Perfil (`/profile`), resolving untranslated contraindications (e.g. `Atención: wrist` -> `Atención: Muñeca`) and fixing exercise naming (proper "ñ" and accents).

**Architecture:**
- Create robust localization formatters in `bleid-web/lib/labels.ts` for contraindication tags, muscle groups, equipment, and exercise names.
- Implement a mobile-first horizontal filter pill system in `/exercises` to avoid endless vertical scrolling across 114 exercises.
- Compact layouts across `/progress`, `/history`, and `/profile` with high-density stat strips, reduced margins/paddings, and streamlined touch targets.
- Fix backend seed data in `bleid-api/BleidAppTraining.Infrastructure/Persistence/SeedData.cs` and ensure migration/runtime compatibility.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, Lucide React, ASP.NET Core (.NET 10), EF Core, PostgreSQL.

**Spec:** User requests to compact mobile modules (Ejercicios, Progreso, Historial, Perfil) for iPhone 13, fix Spanish "ñ" in exercise names (e.g. "Curl arana" -> "Curl araña"), and translate default contraindications like "Atención: wrist" -> "Atención: Muñeca".

## Global Constraints
- Target Viewport: iPhone 13 (390px width, 844px height, safe area insets).
- Branching: Strictly work on `dev`.
- Code Quality: Zero TypeScript errors, zero ESLint warnings, Next.js build passes code 0.
- Typography & Localization: All user-facing strings in idiomatic Rioplatense / Argentine Spanish with proper accents and "ñ".
- Preserve all existing functionality and API contracts.

## Review Focus
1. Untranslated contraindications: strings like `"wrist"`, `"lower_back"`, `"knee"`, `"shoulder"` must always render in Spanish (`Muñeca`, `Espalda baja`, `Rodilla`, `Hombro`).
2. Missing "ñ" in exercise names: "Curl arana en banco inclinado" must render as "Curl araña en banco inclinado" both in the catalog and workout sessions.
3. Card density on iPhone 13: Users must see multiple exercises, sessions, or progress items per screen without excessive scrolling.
4. Touch ergonomics: Interactive elements must maintain at least 40-44px touch targets despite visual compaction.
5. Filter state persistence: Switching muscle group pills or searching must smoothly update without layout shifts or flashes.

---

### Task 1: Exercise Localization & Articular Badges (Backend Seed & Frontend Labels)

**Files:**
- Modify: `bleid-api/BleidAppTraining.Infrastructure/Persistence/SeedData.cs:276`
- Modify: `bleid-web/lib/labels.ts:1-35`
- Modify: `bleid-web/components/features/exercise-modal.tsx:80-105`
- Modify: `bleid-web/app/(app)/exercises/page.tsx:100-117`
- Test: `bleid-web/scripts/test-localization.js`

**Interfaces:**
- Consumes:
  - `contraindications: string[]` from API (e.g. `["Wrist"]`, `["lower_back"]`, `["Shoulder"]`).
  - `name: string` from API (e.g. `"Curl arana en banco inclinado"`).
- Produces:
  - `formatContraindications(items?: string[]): string` -> e.g. `"Muñeca, Hombro"`
  - `formatExerciseName(name: string): string` -> e.g. `"Curl araña en banco inclinado"`
  - `contraindicationLabelMap: Record<string, string>`

- [ ] **Step 1: Write a verification script for localization functions**

```javascript
// bleid-web/scripts/test-localization.js
const assert = require("assert");
const { formatContraindications, formatExerciseName } = require("../lib/labels");

assert.strictEqual(formatContraindications(["wrist"]), "Muñeca");
assert.strictEqual(formatContraindications(["Wrist", "lower_back"]), "Muñeca, Espalda baja");
assert.strictEqual(formatContraindications(["knee", "shoulder"]), "Rodilla, Hombro");
assert.strictEqual(formatExerciseName("Curl arana en banco inclinado"), "Curl araña en banco inclinado");
console.log("Localization tests passed!");
```

- [ ] **Step 2: Run verification script to confirm it fails before implementation**

Run: `node bleid-web/scripts/test-localization.js`
Expected: FAIL with "formatContraindications is not a function"

- [ ] **Step 3: Implement localization helpers in `bleid-web/lib/labels.ts`**

Expand `limitationLabels` and export `formatContraindications` and `formatExerciseName`:
```typescript
export const limitationLabels: Record<string, string> = {
  Knee: "Rodilla",
  knee: "Rodilla",
  Lumbar: "Espalda baja",
  lumbar: "Espalda baja",
  lower_back: "Espalda baja",
  Shoulder: "Hombro",
  shoulder: "Hombro",
  Wrist: "Muñeca",
  wrist: "Muñeca",
  Neck: "Cuello / Cervicales",
  neck: "Cuello / Cervicales",
  Elbow: "Codo",
  elbow: "Codo",
};

export function formatContraindications(items?: string[]): string {
  if (!items || items.length === 0) return "";
  return items
    .map((item) => limitationLabels[item] || limitationLabels[item.toLowerCase()] || item)
    .join(", ");
}

export function formatExerciseName(name: string): string {
  if (!name) return "";
  return name.replace(/\bCurl arana\b/gi, "Curl araña");
}
```

- [ ] **Step 4: Fix backend seed data in `SeedData.cs`**

In `bleid-api/BleidAppTraining.Infrastructure/Persistence/SeedData.cs`, line 276:
Replace `"Curl arana en banco inclinado"` with `"Curl araña en banco inclinado"`.
Also update existing row update logic if already seeded.

- [ ] **Step 5: Apply `formatContraindications` and `formatExerciseName` to `exercises/page.tsx` and `exercise-modal.tsx`**

Replace direct `.join(", ")` with `formatContraindications(exercise.contraindications)` and wrap names with `formatExerciseName(exercise.name)`.

- [ ] **Step 6: Run verification script and Next.js build**

Run: `node bleid-web/scripts/test-localization.js`
Expected: PASS
Run: `npm run build` in `bleid-web`
Expected: PASS (0 errors)

- [ ] **Step 7: Commit**

```bash
git add bleid-web/lib/labels.ts bleid-web/app/\(app\)/exercises/page.tsx bleid-web/components/features/exercise-modal.tsx bleid-api/BleidAppTraining.Infrastructure/Persistence/SeedData.cs
git commit -m "fix(exercises): translate contraindication badges and fix Spanish ñ in exercise names"
```

---

### Task 2: Ejercicios (`/exercises`) Mobile Compaction & Muscle Group Filter Strip

**Files:**
- Modify: `bleid-web/app/(app)/exercises/page.tsx`

**Interfaces:**
- Consumes: `exercises: Exercise[]`, `formatContraindications`, `formatExerciseName`
- Produces:
  - Muscle group filter pill row (`selectedMuscleGroup: string | "all"`)
  - Compact exercise card with inline badges and tap-to-open technique modal

- [ ] **Step 1: Implement horizontal scrollable muscle group filter pills**

Add a horizontal pill bar at the top:
- "Todos" (with total count)
- "Pecho", "Espalda", "Cuádriceps", "Glúteos", "Isquiotibiales", "Pantorrillas", "Hombros", "Bíceps", "Tríceps", "Core", "Cardio"
- Active pill styled with `bg-primary text-primary-foreground`
- Inactive pills styled with `bg-card border border-border text-muted-foreground`

- [ ] **Step 2: Streamline mobile header and search input**

- Reduce top padding on mobile (`py-2 sm:py-6`).
- Compact title: `text-2xl sm:text-3xl font-serif`.
- Search bar: Height `h-10 sm:h-12` with instant search.

- [ ] **Step 3: Compact exercise cards layout for iPhone 13**

- Card padding: `p-3.5 sm:p-5`.
- Header inside card: Muscle group + Equipment inline.
- Title: `text-sm sm:text-base font-bold` with `formatExerciseName`.
- Description: Compact 1-line (`line-clamp-1 sm:line-clamp-2 text-xs`).
- Safety badge: Compact inline tag with colored dot:
  - Green: `● Seguro`
  - Orange: `● Atención: Muñeca` (using `formatContraindications`)
  - Red: `● Contraindicado`
- Action: "Ver técnica" as compact button or entire card clickable to open `ExerciseModal`.

- [ ] **Step 4: Verify mobile layout in browser build**

Run: `npm run build` in `bleid-web`
Expected: PASS with 0 warnings.

- [ ] **Step 5: Commit**

```bash
git add bleid-web/app/\(app\)/exercises/page.tsx
git commit -m "feat(exercises): compact mobile view with horizontal muscle group filter"
```

---

### Task 3: Progreso (`/progress`) Mobile Density & Stats Strip

**Files:**
- Modify: `bleid-web/app/(app)/progress/page.tsx`
- Modify: `bleid-web/components/features/body-weight-tracker.tsx`

**Interfaces:**
- Consumes: `volume: VolumeProgress[]`, `streak: Streak`, `exerciseProgress: ExerciseProgress[]`
- Produces:
  - 3-column compact metric strip
  - Compact weekly volume chart (`h-36` on mobile)
  - Streamlined exercise progression and body weight tracker

- [ ] **Step 1: Compact hero metric cards into a 3-column mobile strip**

Instead of 3 stacked vertical cards taking ~330px height, create a responsive 3-column grid:
```tsx
<div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
  <div className="card-editorial rounded-xl border border-border bg-card p-3 sm:p-5 shadow-soft">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono uppercase text-muted-foreground">Volumen</span>
      <TrendingUp className="h-3.5 w-3.5 text-primary" />
    </div>
    <p className="mt-1 font-mono text-lg sm:text-2xl font-bold text-foreground">
      {Math.round(volume.at(-1)?.totalVolumeKg ?? 0).toLocaleString("es-AR")}
      <span className="text-[10px] font-normal text-muted-foreground ml-0.5">kg</span>
    </p>
  </div>
  ...
</div>
```
Reduces height from 330px to 65px!

- [ ] **Step 2: Compact weekly volume chart**

- Container padding: `p-3.5 sm:p-6`.
- Chart height: `h-36 sm:h-52`.
- Bar widths and labels optimized for 390px width.

- [ ] **Step 3: Compact exercise progression section**

- Inline header with "Calcular 1RM" button and exercise `<select>`.
- Compact bar list: `py-1` spacing with small fonts (`text-xs`).

- [ ] **Step 4: Compact `BodyWeightTracker`**

In `bleid-web/components/features/body-weight-tracker.tsx`:
- Header padding: `p-3.5 sm:p-6`.
- Compact quick-entry input: single row with weight input + save button.
- Compact recent history list (shows last 3 entries with option to expand).

- [ ] **Step 5: Verify build**

Run: `npm run build` in `bleid-web`
Expected: PASS with 0 warnings.

- [ ] **Step 6: Commit**

```bash
git add bleid-web/app/\(app\)/progress/page.tsx bleid-web/components/features/body-weight-tracker.tsx
git commit -m "feat(progress): compact mobile metrics strip, chart and bodyweight tracker"
```

---

### Task 4: Historial (`/history`) Mobile Density

**Files:**
- Modify: `bleid-web/app/(app)/history/page.tsx`

**Interfaces:**
- Consumes: `sessions: WorkoutSession[]`
- Produces: High-density workout session cards (~85px height vs 170px)

- [ ] **Step 1: Compact header**

- Padding: `px-4 py-2 sm:px-8 sm:py-6`.
- Compact title and subtitle.

- [ ] **Step 2: Redesign session card for high density**

- Padding: `p-3.5 sm:p-5`.
- Top row: Routine Day Name (bold) + Status pill ("Completada" / "En curso") on same line.
- Second row: Date and time formatted nicely in Spanish with calendar icon (`text-xs text-muted-foreground`).
- Third row: Compact horizontal stats line:
  `4 series · 2.450 kg · 3 ejercicios` with discreet chevron on right.
- Whole card is clickable directly to `/workout/[sessionId]`.

- [ ] **Step 3: Verify build**

Run: `npm run build` in `bleid-web`
Expected: PASS with 0 warnings.

- [ ] **Step 4: Commit**

```bash
git add bleid-web/app/\(app\)/history/page.tsx
git commit -m "feat(history): compact session cards for mobile screens"
```

---

### Task 5: Perfil (`/profile`) Mobile Density & Form UX

**Files:**
- Modify: `bleid-web/app/(app)/profile/page.tsx`

**Interfaces:**
- Consumes: `UserProfile`, `updateProfile`
- Produces: Compact athlete profile overview, condensed limitation chips, and optimized edit form

- [ ] **Step 1: Compact athlete summary card**

- Avatar: `h-12 w-12 sm:h-16 sm:w-16`.
- Full Name + Email on left, "Editar" button directly on right on mobile.
- Parameters readout: 3-column pill strip (`Objetivo`, `Nivel`, `Frecuencia`).

- [ ] **Step 2: Compact read-only cards**

- "Perfil adaptado": Compact chip badges for limitations: e.g. `[Muñeca: Moderada]`, `[Rodilla: Leve]` instead of long multiline text.
- "Datos del atleta": single compact line summary.
- "PWA / Pantalla de inicio": compact row with status icon.

- [ ] **Step 3: Compact edit form**

- Compact input heights: `h-10` with `text-xs sm:text-sm`.
- Limitation checkboxes with compact severity select.
- Fixed/sticky mobile bottom action bar when editing: "Guardar cambios" and "Cancelar" always within reach without scrolling 800px.

- [ ] **Step 4: Verify build**

Run: `npm run build` in `bleid-web`
Expected: PASS with 0 warnings.

- [ ] **Step 5: Commit**

```bash
git add bleid-web/app/\(app\)/profile/page.tsx
git commit -m "feat(profile): compact athlete profile cards and streamlined mobile edit form"
```

---

### Task 6: Verification, Testing & Cross-Module Review

**Files:**
- Test all 4 pages: `/exercises`, `/progress`, `/history`, `/profile`.

- [ ] **Step 1: Run complete Next.js production build**

Run: `npm run build` in `bleid-web`
Expected: All 15 routes compile cleanly with code 0.

- [ ] **Step 2: Validate iPhone 13 viewport (390px width)**

Verify that:
1. No horizontal scrollbars appear on any of the 4 routes.
2. `/exercises`: Muscle group pill filter scrolls smoothly, contraindications show in Spanish (e.g. `Atención: Muñeca`), "Curl araña" is spelled with "ñ".
3. `/progress`: 3-metric strip fits above the fold with weekly volume chart.
4. `/history`: At least 4-5 sessions visible on screen.
5. `/profile`: Compact summary fits comfortably above the fold.

- [ ] **Step 3: Merge and prepare for deployment**

Merge `dev` into `main`, push to `origin/main` for automatic Vercel deployment, and verify live URL.
