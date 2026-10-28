# Warm Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform BleidApp from a harsh cyber-neon dark gym UI into a bespoke, high-end "Warm Editorial" athletic design system (warm ivory, espresso, saddle bronze, terracotta) with an inverted deep espresso floating dock on mobile, clean code tokenization, and zero dark islands.

**Architecture:** Next.js 14 (App Router) with Tailwind CSS utilizing semantic HSL variables in `globals.css` and `tailwind.config.ts`. Replaces all arbitrary dark utility classes with semantic classes (`bg-background`, `bg-card`, `text-foreground`, `border-border`, `shadow-soft`). Inverted floating dock on mobile; desktop sidebar with linen borders.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, TypeScript, Lucide Icons, ASP.NET Core 10 (Backend).

**Spec:** [`docs/superpowers/specs/2026-10-26-warm-editorial-redesign-design.md`](file:///home/catriel/RiderProjects/BleidApp/docs/superpowers/specs/2026-10-26-warm-editorial-redesign-design.md)

---

## Global Constraints

- **Canvas Palette:** Canvas background must strictly be warm ivory/alabaster (`#FAF7F2` / `hsl(36 28% 97%)`); primary copy deep espresso (`#1D1714` / `hsl(24 22% 12%)`); card surfaces crisp warm white (`#FFFFFF`) with linen borders (`#E5DDD1` / `hsl(32 16% 87%)`).
- **Primary & Accent Tones:** Primary action buttons use Saddle Bronze (`#854826`); highlights and active badges use Terracotta (`#BB6C32`) or Warm Caramel (`#C47C2B`).
- **Status Indicators:** Completed sets and streaks use Muted Olive/Sage (`#3E6B48`); destructive buttons use Brick Crimson (`#A93C32`).
- **Mobile Floating Dock:** Persistent mobile navigation dock must be styled as an inverted deep espresso dock (`bg-[#16120E]`) with champagne/linen rim and terracotta active indicator.
- **No Dark Islands:** Every single page (including `/`, `/onboarding`, `/login`, `/register`) must be fully styled in the warm editorial palette.
- **Clean Code & Build:** Must strictly pass `npm run build` in `bleid-web` with zero type errors and maintain all 29 passing xUnit tests in `bleid-api`.

---

## Review Focus

1. **Input and Form Contrast on Light Surfaces:** Ensure inputs (`<input>`, `<select>`, `<textarea>`) have a distinct warm cream background (`bg-muted/50`), crisp linen border (`border-border`), and deep espresso text, remaining fully visible and legible.
2. **Mobile Dock Viewport Collision:** Ensure the floating espresso dock on mobile has adequate bottom padding/safe-area spacing (`safe-bottom` / `pb-24`) so content is never occluded behind it.
3. **Ghost Set Imprint Legibility:** The previous performance hint in active workouts must have clear contrast (warm oatmeal pill with deep espresso numbers) without looking like an active editable field.
4. **Plate Calculator Barbell Graphic Contrast:** SVG barbell and plate chips must render with high contrast against the white modal dialog, maintaining official color cues (red 25kg, blue 20kg, yellow 15kg, green 10kg, white 5kg).
5. **No Visual Flashes or Legacy Neon Glows:** Verify that no remnant `shadow-glow-primary` or `#d4ff00` classes remain active anywhere in the DOM.

---

### Task 1: Semantic Design Tokens, Typography & Shadow System

**Files:**
- Modify: `bleid-web/app/globals.css`
- Modify: `bleid-web/tailwind.config.ts`

**Interfaces:**
- Consumes: Tailwind CSS base configuration and CSS variables
- Produces: Semantic HSL tokens (`--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--accent`, `--destructive`, `--success`, `--warning`, `--border`, `--chart-1` to `--5`), utility classes (`shadow-soft`, `shadow-soft-hover`, `shadow-dock`, `.grain`), deprecates neon glows and `.glass-card`.

- [ ] **Step 1: Update `globals.css` with Warm Editorial semantic tokens and light color-scheme**
  Set `:root` with ivory canvas (`36 28% 97%`), espresso copy (`24 22% 12%`), warm white cards (`0 0% 100%`), linen borders (`32 16% 87%`), saddle bronze primary (`24 45% 36%`), terracotta accent (`30 55% 48%`), sage success (`136 27% 33%`), and warm charts. Update `.grain` opacity for light background and remove `.glass-card` neon rules.
- [ ] **Step 2: Update `tailwind.config.ts` with custom shadows and semantic status colors**
  Add `shadow-soft`, `shadow-soft-hover`, `shadow-dock`, success color token, and remove cyber glows (`glow-primary`, `glow-cyan`, `glow-flame`).
- [ ] **Step 3: Run Next.js build to verify CSS compilation**
  Run: `cd bleid-web && npm run build`
  Expected: Compiled successfully with updated styles.
- [ ] **Step 4: Commit**
  ```bash
  git add bleid-web/app/globals.css bleid-web/tailwind.config.ts
  git commit -m "style: establish warm editorial design system tokens and soft shadows"
  ```

---

### Task 2: Artisan Shell & Monolithic Inverted Navigation Dock

**Files:**
- Modify: `bleid-web/components/ui/brand-mark.tsx`
- Modify: `bleid-web/components/layout/app-shell.tsx`

**Interfaces:**
- Consumes: Semantic tokens, Next.js routing, `getActiveSession` API
- Produces: Premium athletic `BrandMark` monogram and `AppShell` with desktop alabaster sidebar and inverted deep espresso mobile dock (`#16120E`).

- [ ] **Step 1: Redesign `BrandMark.tsx`**
  Implement an artisan athletic monogram: rich saddle bronze square with rounded corners (`rounded-xl bg-primary text-primary-foreground`), high-contrast "B" glyph with subtle gold micro-dot, paired with "BLEID ATHLETICS" and "Strength & Systems" in refined editorial typography.
- [ ] **Step 2: Redesign desktop sidebar in `AppShell.tsx`**
  Style desktop `<aside>` with warm alabaster background (`bg-background/95`), linen border (`border-border`), refined uppercase section divider (`text-muted-foreground tracking-[0.18em] text-[10px] font-semibold`), and active item pills in warm secondary cream (`bg-secondary text-primary font-medium`).
- [ ] **Step 3: Redesign mobile floating dock in `AppShell.tsx` (Option 1)**
  Implement the inverted floating dock: deep espresso background (`bg-[#16120E]`), champagne/linen border (`border-stone-700/60`), subtle ambient shadow (`shadow-dock`). Active tab displays warm terracotta/caramel indicator pill with high-contrast warm cream icon. Ensure content has `pb-28` to prevent overlap.
- [ ] **Step 4: Verify navigation rendering and active states**
  Run: `cd bleid-web && npm run build`
  Expected: PASS with no JSX or styling errors.
- [ ] **Step 5: Commit**
  ```bash
  git add bleid-web/components/ui/brand-mark.tsx bleid-web/components/layout/app-shell.tsx
  git commit -m "feat(ui): implement artisan brandmark and inverted espresso mobile dock"
  ```

---

### Task 3: Public Entry Surfaces (Landing Page, Onboarding Wizard & Auth)

**Files:**
- Modify: `bleid-web/app/page.tsx`
- Modify: `bleid-web/app/onboarding/page.tsx`
- Modify: `bleid-web/app/(auth)/login/page.tsx`
- Modify: `bleid-web/app/(auth)/register/page.tsx`

**Interfaces:**
- Consumes: Next.js routing, auth API (`login`, `register`), onboarding logic
- Produces: Warm editorial marketing landing page, multi-step onboarding wizard, and cohesive auth dialog cards.

- [ ] **Step 1: Redesign landing page (`app/page.tsx`)**
  Replace dark hero with warm alabaster editorial layout: refined display headline, bronze CTA buttons (`bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft`), tactile feature cards in warm white with linen borders, and high-contrast fitness metrics preview.
- [ ] **Step 2: Redesign onboarding wizard (`app/onboarding/page.tsx`)**
  Style the multi-step questionnaire cards in crisp warm white (`bg-card border border-border shadow-soft`), terracotta step progress indicator, and warm oatmeal option selector pills (`bg-secondary/60 hover:bg-secondary`).
- [ ] **Step 3: Redesign login and register pages (`(auth)/login` & `(auth)/register`)**
  Replace dark modal styling with centered warm white card (`bg-card border border-border shadow-soft-hover`), espresso headings, warm input fields (`bg-muted/40 border-border focus:ring-primary`), and saddle bronze submission buttons.
- [ ] **Step 4: Test and compile Next.js build**
  Run: `cd bleid-web && npm run build`
  Expected: PASS
- [ ] **Step 5: Commit**
  ```bash
  git add bleid-web/app/page.tsx bleid-web/app/onboarding/page.tsx bleid-web/app/\(auth\)/login/page.tsx bleid-web/app/\(auth\)/register/page.tsx
  git commit -m "feat(ui): redesign landing, onboarding wizard, and auth views in warm editorial aesthetic"
  ```

---

### Task 4: Central Dashboard Experience (`dashboard/page.tsx`)

**Files:**
- Modify: `bleid-web/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `getDashboardData`, `getActiveSession`, `getRoutines`
- Produces: High-end dashboard with weekly consistency metrics, punched tactile number badges, split day selector, and quick workout launcher.

- [ ] **Step 1: Redesign hero greeting and workout quick-launcher banner**
  Replace dark gradient banner with warm white card featuring saddle bronze accents, elapsed training streak badge with warm amber fire icon (`bg-amber-500/10 text-amber-700 border-amber-200/60`), and prominent primary CTA "Comenzar entrenamiento de hoy".
- [ ] **Step 2: Redesign metrics overview cards (Volume, Consistency, Personal Bests)**
  Convert metric containers to warm white cards with linen borders and tactile debossed number containers (`font-mono text-2xl font-bold tracking-tight text-foreground bg-stone-50 p-3 rounded-xl border border-stone-200/50`).
- [ ] **Step 3: Redesign split day selector pills and "+ Sumar día" button**
  Replace dark pills with warm oatmeal tabs, active day highlighted in terracotta (`bg-accent text-accent-foreground`), and "+ Sumar día" pill styled with subtle dashed linen border.
- [ ] **Step 4: Verify dashboard compilation and responsiveness**
  Run: `cd bleid-web && npm run build`
  Expected: PASS
- [ ] **Step 5: Commit**
  ```bash
  git add bleid-web/app/\(app\)/dashboard/page.tsx
  git commit -m "feat(ui): elevate dashboard with tactile metric cards and editorial split selector"
  ```

---

### Task 5: Workout Planning & Routine Management (`workout/page.tsx` & `routine-editor.tsx`)

**Files:**
- Modify: `bleid-web/app/(app)/workout/page.tsx`
- Modify: `bleid-web/components/features/routine-editor.tsx`

**Interfaces:**
- Consumes: Routine management endpoints, workout session initialization
- Produces: Refined workout overview, tactile day tabs, and clean routine creation/editing modal.

- [ ] **Step 1: Redesign day navigation tabs in `workout/page.tsx`**
  Replace neon borders and dark tabs with warm oatmeal pills (`bg-secondary/70 text-foreground`), active tab in rich bronze/terracotta (`bg-primary text-primary-foreground shadow-soft`), and prominent "+ NUEVO DÍA" tab with subtle dashed linen border.
- [ ] **Step 2: Redesign routine exercise cards and workout starter block**
  Style exercise items inside the day with clean white cards, muscle group tag pills in muted taupe, target rep ranges in tabular font, and "Iniciar sesión de este día" CTA button.
- [ ] **Step 3: Redesign `routine-editor.tsx` modal**
  Transform the routine editor modal into a warm white sheet with linen borders, clean input fields, draggable exercise reordering handles, and bronze action buttons.
- [ ] **Step 4: Verify build integrity**
  Run: `cd bleid-web && npm run build`
  Expected: PASS
- [ ] **Step 5: Commit**
  ```bash
  git add bleid-web/app/\(app\)/workout/page.tsx bleid-web/components/features/routine-editor.tsx
  git commit -m "feat(ui): restyle workout routine manager and routine editor modal"
  ```

---

### Task 6: Active Workout Session & Progressive Overload (`workout/[sessionId]/page.tsx`)

**Files:**
- Modify: `bleid-web/app/(app)/workout/[sessionId]/page.tsx`

**Interfaces:**
- Consumes: `logSet`, `deleteSet`, `completeSession`, `getLatestExercisePerformance`
- Produces: High-contrast active training screen, chalk memory ghost sets, high-contrast numeric inputs, sage green checkmarks, and finish celebration modal.

- [ ] **Step 1: Redesign session header and live elapsed workout clock**
  Style session top bar with warm white background, deep espresso elapsed timer in tabular font (`font-mono text-xl font-bold tracking-tight`), rest timer launcher pill, and "Finalizar Entrenamiento" button.
- [ ] **Step 2: Implement "Chalk Memory" ghost set badges for live progressive overload**
  Render previous session reference tag as an athletic chalk imprint badge: warm oatmeal pill with subtle dotted border (`bg-secondary/60 border border-secondary text-muted-foreground text-xs font-mono`), displaying "Anterior: 3 series (máx. 75 kg × 10 r)" with a bronze history icon.
- [ ] **Step 3: Redesign set logging table and completed checkmark triggers**
  Replace dark table rows with crisp set rows. Weight (Kg) and Reps inputs styled with high-contrast text and linen borders. Plate calculator icon button next to Kg input. Completed set check button transitions from muted outline to solid Muted Olive/Sage (`bg-[#3E6B48] text-white`).
- [ ] **Step 4: Redesign workout completion celebration dialog**
  Replace dark modal with warm white celebration card: volume summary, personal records achieved badges, and return to dashboard button.
- [ ] **Step 5: Verify build integrity**
  Run: `cd bleid-web && npm run build`
  Expected: PASS
- [ ] **Step 6: Commit**
  ```bash
  git add bleid-web/app/\(app\)/workout/\[sessionId\]/page.tsx
  git commit -m "feat(ui): elevate active workout session with chalk ghost sets and tactile inputs"
  ```

---

### Task 7: Exercise Library, Olympic Plate Calculator & Specialty Modals

**Files:**
- Modify: `bleid-web/app/(app)/exercises/page.tsx`
- Modify: `bleid-web/components/features/exercise-modal.tsx`
- Modify: `bleid-web/components/features/plate-calculator.tsx`
- Modify: `bleid-web/components/features/one-rep-max-modal.tsx`
- Modify: `bleid-web/components/features/body-weight-tracker.tsx`
- Modify: `bleid-web/components/features/rest-timer.tsx`

**Interfaces:**
- Consumes: Exercise catalog API, barbell breakdown logic, 1RM formulas, weight logging
- Produces: Editorial exercise explorer, authentic Olympic plate visualizer, biomechanics modal, and utility tools.

- [ ] **Step 1: Redesign `/exercises/page.tsx`**
  Style search input with warm background and magnifying icon. Filter pills for muscle groups (Pecho, Espalda, Cuádriceps, Glúteos, Hombros) in warm oatmeal with bronze active pills. Exercise cards styled with muscle tags and joint safety badges.
- [ ] **Step 2: Redesign `exercise-modal.tsx`**
  Transform exercise detail dialog into an editorial technical sheet: typography hierarchy for setup, execution cues, biomechanical adaptations, and contraindication warning badges in warm amber.
- [ ] **Step 3: Redesign `plate-calculator.tsx`**
  Adapt SVG barbell graphic to warm white card: precision knurled bar with metallic highlights and authentic Olympic plate chips (25kg Red, 20kg Blue, 15kg Yellow, 10kg Green, 5kg White, 2.5kg/1.25kg Steel) with clean greedy breakdown summary per side.
- [ ] **Step 4: Redesign `rest-timer.tsx`, `one-rep-max-modal.tsx`, and `body-weight-tracker.tsx`**
  Restyle floating rest timer drawer, 1RM percentage chart modal, and body weight history drawer with warm white surfaces and linen borders.
- [ ] **Step 5: Verify build integrity**
  Run: `cd bleid-web && npm run build`
  Expected: PASS
- [ ] **Step 6: Commit**
  ```bash
  git add bleid-web/app/\(app\)/exercises/page.tsx bleid-web/components/features/*.tsx
  git commit -m "feat(ui): restyle exercise explorer, plate calculator, and feature modals"
  ```

---

### Task 8: Analytics, History, Profile & Full Solution Verification

**Files:**
- Modify: `bleid-web/app/(app)/progress/page.tsx`
- Modify: `bleid-web/app/(app)/history/page.tsx`
- Modify: `bleid-web/app/(app)/profile/page.tsx`

**Interfaces:**
- Consumes: Progress analytics endpoints, history logs, user profile API
- Produces: Warm editorial charts, session history cards, account settings, and regression verification.

- [ ] **Step 1: Redesign `/progress/page.tsx` with Warm Earth Data Charts**
  Style weekly volume charts and body weight progression using `--chart-1` (bronze), `--chart-2` (terracotta), and `--chart-3` (sage). Replace dark containers with warm white cards and linen dividers.
- [ ] **Step 2: Redesign `/history/page.tsx`**
  Style chronological workout logs with warm cards, duration and volume pills, and expandable set detail summaries.
- [ ] **Step 3: Redesign `/profile/page.tsx`**
  Restyle user profile view, avatar monogram, training goal settings, and sign-out button in brick crimson.
- [ ] **Step 4: Run full verification suite**
  1. Frontend production build: `cd bleid-web && npm run build`
  2. Backend tests: `dotnet test bleid-api/BleidAppTraining.sln`
  Expected: Both exit with code 0 (all 29 tests passing, Next.js build clean).
- [ ] **Step 5: Commit**
  ```bash
  git add bleid-web/app/\(app\)/progress/page.tsx bleid-web/app/\(app\)/history/page.tsx bleid-web/app/\(app\)/profile/page.tsx
  git commit -m "feat(ui): complete warm editorial redesign across analytics, history, and profile"
  ```

---

## Plan Self-Review Checklist

- [x] **Spec coverage:** All sections and requirements from `docs/superpowers/specs/2026-10-26-warm-editorial-redesign-design.md` are covered across the 8 tasks.
- [x] **Step scan:** Every step contains a concrete, unambiguous action, files, and verification command.
- [x] **Type & token consistency:** Semantic tokens (`--background`, `--foreground`, `--card`, `--primary`, `--border`, etc.) are consistently used across all tasks.
- [x] **Review Focus:** Input contrast, mobile dock collision, ghost set legibility, barbell contrast, and legacy neon glow elimination are tested in their respective tasks.
- [x] **Proportion:** Clear and modular task boundaries without duplicating code unnecessarily.
