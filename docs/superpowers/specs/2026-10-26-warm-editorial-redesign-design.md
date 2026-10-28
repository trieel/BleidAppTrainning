# Design Document: BleidApp Warm Editorial Redesign (Ivory & Espresso)

**Date:** 2026-10-26  
**Status:** In Review (Builder Checked)  
**Author:** AI Pair & Senior UI/UX Architect  
**Approach Chosen:** Approach A — Full Semantic Design System (Clean Architecture)

---

## 1. Intent & The Why

BleidApp is currently styled with a "Cyber-Athletic" dark theme: pitch-black backgrounds, high-saturation lime-neon accents (`#d4ff00`), and aggressive tech glow effects. While energetic, this style causes visual fatigue and lacks the understated sophistication of high-end athletic and wellness brands (such as Equinox, Tracksmith, Oura, or Alo).

The goal is to elevate BleidApp into a **Warm Editorial aesthetic**:
- Warm alabaster/ivory canvas.
- Crisp white surfaces with tactile, linen-toned borders and soft, organic diffuse shadows.
- Deep espresso brown typography with exceptional contrast and legibility.
- Rich saddle bronze, terracotta, and warm caramel accents.
- Adherence to **Clean Code and Frontend Best Practices**, eliminating all hardcoded dark classes and arbitrary colors in favor of a unified semantic design system.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
1. **Design System Tokenization:** Complete CSS variable specification in `globals.css` and `tailwind.config.ts`, covering base surfaces, text, bronze accents, status indicators (success, warning, error), and data visualization charts.
2. **Clean Code Refactoring:** Eliminate hardcoded hex values and dark utility classes (`bg-slate-900`, `bg-[#07090e]`, `text-[#d4ff00]`, `shadow-glow-primary`, `.glass-card`, etc.) across all components, enforcing semantic Tailwind classes (`bg-background`, `bg-card`, `text-foreground`, `border-border`, `bg-primary`, `shadow-soft`).
3. **Elevated UI/UX & Micro-interactions:** Replace aggressive neon glow effects with refined tactile depth (soft ambient shadows, subtle warm borders, satin hover transitions, elegant pill badges).
4. **Comprehensive Surface Coverage (No Dark Islands):** Restyle all public and authenticated application surfaces:
   - Entry & Marketing: Landing page (`/`), Onboarding wizard (`/onboarding`).
   - Layout & Navigation: `AppShell`, `BrandMark`, desktop sidebar, mobile floating dock.
   - Core Pages: `Dashboard`, `Workout` (routine overview), `Workout Session` (active training screen), `Exercises` (catalog & explorer), `Progress`, `History`, `Profile`, and `Auth` (`Login` / `Register`).
   - Feature Modals & Tools: `PlateCalculator`, `ExerciseModal`, `OneRepMaxModal`, `BodyWeightTracker`, `RestTimer`, and `RoutineEditor`.
5. **Accessibility (WCAG 2.2 AA):** Maintain rigorous contrast ratios (> 4.5:1 for body copy, > 3:1 for large display text and interactive borders).

### Non-Goals
1. Modifying backend endpoints, database schemas, or business logic.
2. Altering training algorithms (1RM formulas, plate calculator greedy algorithm, ghost set tracking).
3. Adding external font dependencies (we leverage the existing optimized `Geist Sans` and `Geist Mono` font stacks with refined editorial letter-spacing).

### Anti-Goals
1. **No generic SaaS look:** Avoid standard, cold "Bootstrap/Tailwind default" gray-and-blue corporate aesthetics. The design must feel athletic, tactile, warm, and distinctly premium.
2. **No partial or piecemeal styling:** Zero un-migrated dark routes or cards.

---

## 3. Design System & Palette Specification

### 3.1 Color Tokens (HSL & Hex References)

| Semantic Token | Value (HSL / CSS) | Hex Ref | Role |
| :--- | :--- | :--- | :--- |
| `--background` | `36 28% 97%` | `#FAF7F2` | Warm Ivory / Alabaster main background |
| `--foreground` | `24 22% 12%` | `#1D1714` | Deep Espresso primary copy |
| `--card` | `0 0% 100%` | `#FFFFFF` | Crisp Warm White card surfaces |
| `--card-foreground` | `24 22% 12%` | `#1D1714` | Card header & body text |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Popovers, dropdowns & modals |
| `--popover-foreground` | `24 22% 12%` | `#1D1714` | Modal copy |
| `--primary` | `24 45% 36%` | `#854826` | Saddle Bronze / Warm Chestnut primary action |
| `--primary-foreground` | `36 30% 98%` | `#FAF8F5` | Contrast text on primary buttons |
| `--secondary` | `32 20% 92%` | `#EFE9DF` | Warm Oatmeal secondary button/pill surface |
| `--secondary-foreground`| `24 22% 18%` | `#2D231E` | Text on secondary elements |
| `--muted` | `32 18% 94%` | `#F4EFE7` | Muted input backgrounds, table stripes |
| `--muted-foreground` | `24 10% 45%` | `#756C65` | Secondary labels, captions, ghost hints |
| `--accent` | `30 55% 48%` | `#BB6C32` | Warm Terracotta / Caramel focus & highlight |
| `--accent-foreground` | `36 30% 98%` | `#FAF8F5` | Text on accent elements |
| `--destructive` | `4 54% 43%` | `#A93C32` | Brick Crimson for delete / destructive actions |
| `--destructive-foreground`| `36 30% 98%` | `#FAF8F5` | Text on destructive buttons |
| `--success` | `136 27% 33%` | `#3E6B48` | Muted Olive / Sage for completed sets & streaks |
| `--success-foreground`| `36 30% 98%` | `#FAF8F5` | Text on success badges |
| `--warning` | `32 64% 47%` | `#C47C2B` | Amber / Caramel for alerts and warnings |
| `--warning-foreground`| `36 30% 98%` | `#FAF8F5` | Text on warning indicators |
| `--border` | `32 16% 87%` | `#E5DDD1` | Subtle Linen border for cards and dividers |
| `--input` | `32 16% 87%` | `#E5DDD1` | Input fields border |
| `--ring` | `24 45% 36%` | `#854826` | Accessible focus ring indicator |
| `--radius` | `0.75rem` | `12px` | Harmonious border radius |

#### Data Visualization Chart Tokens (`--chart-1` to `--chart-5`)
- `--chart-1`: `24 45% 36%` (Saddle Bronze `#854826`) — Primary volume & body weight curves
- `--chart-2`: `30 55% 48%` (Terracotta `#BB6C32`) — Secondary comparison sets
- `--chart-3`: `136 27% 33%` (Sage Green `#3E6B48`) — Recovery & completed target volume
- `--chart-4`: `38 58% 59%` (Warm Ochre / Honey `#D4A359`) — High intensity / 1RM records
- `--chart-5`: `24 22% 16%` (Deep Espresso `#31231D`) — Baseline references

### 3.2 Surface Architecture (Opaque Cards over Frosted Glass)
To avoid contrast issues, muddy text, and GPU repainting lag on mobile:
- **Card Surfaces:** Transition to **opaque warm white (`bg-card: #FFFFFF`)** with linen borders (`border-border`) and soft diffuse drop shadows (`shadow-soft`).
- Deprecate `.glass-card` and `.glass-island` in favor of standard semantic card utilities.
- Maintain subtle warm background grain overlay (`.grain`) in `globals.css` with opacity calibrated for light mode.

### 3.3 Shadows & Depth (Replacing Neon Glows)
- **`shadow-soft`:** `0 2px 8px -2px rgba(29, 23, 20, 0.04), 0 8px 24px -4px rgba(29, 23, 20, 0.06)`
- **`shadow-soft-hover`:** `0 4px 14px -2px rgba(29, 23, 20, 0.06), 0 14px 32px -4px rgba(29, 23, 20, 0.10)`
- **`shadow-dock`:** `0 20px 40px -10px rgba(29, 23, 20, 0.15), 0 0 0 1px rgba(229, 221, 209, 0.8)`

### 3.4 Typography Architecture
- Keep the performant and reliable **`Geist Sans`** and **`Geist Mono`** fonts.
- Apply high-end editorial tracking:
  - Display headers: `font-bold tracking-tight text-foreground`
  - Micro-labels / section dividers: `font-semibold text-xs tracking-[0.18em] uppercase text-muted-foreground`
  - Metrics / Numeric data: `font-mono tracking-tight text-foreground`

---

## 4. Mobile Navigation Dock Architecture
The mobile navigation dock (`AppShell.tsx`) acts as the anchor of the app on mobile devices.
- **Architectural Call:** An inverted **Deep Espresso dock (`bg-[#1D1714]` with warm linen border and soft glow)** or an **Opaque Warm White dock (`bg-card` with `border-border` and `shadow-dock`)**.
- Both options provide excellent contrast. The inverted espresso dock provides a distinctive, premium tactile anchor favored by luxury athletic apps (e.g. Nike, Tracksmith).

---

## 5. Scope of Component & Page Refinements

1. **Foundations & Config:**
   - [`globals.css`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/globals.css): `:root` tokens, light mode `color-scheme: light`, updated `.grain`, deprecate `.glass-card`.
   - [`tailwind.config.ts`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/tailwind.config.ts): Register `shadow-soft`, `shadow-dock`, custom status & bronze color tokens, remove `shadow-glow-*`.

2. **Shell & Navigation:**
   - [`BrandMark.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/components/ui/brand-mark.tsx): Monogram "B" in rich saddle bronze with warm ivory lettering, clean typography "BLEID ATHLETICS".
   - [`AppShell.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/components/layout/app-shell.tsx): Refactored desktop sidebar (ivory background, linen border, bronze active state) and floating mobile dock.

3. **Public & Entry Pages:**
   - [`app/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/page.tsx): Landing hero, CTA buttons, feature showcases in warm editorial style.
   - [`app/onboarding/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/onboarding/page.tsx): Multi-step setup wizard in warm cards with bronze step progress indicator.
   - Auth pages: [`login/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/(auth)/login/page.tsx), [`register/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/(auth)/register/page.tsx).

4. **Authenticated Training Pages:**
   - [`dashboard/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/(app)/dashboard/page.tsx): Overview cards, streak badge, quick action buttons, active split day selector.
   - [`workout/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/(app)/workout/page.tsx): Day selector tabs with terracotta/bronze active pill, workout starter hero, clean exercise cards.
   - [`workout/[sessionId]/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/(app)/workout/[sessionId]/page.tsx): Active workout runner, ghost set indicator, set table with high contrast inputs, finish modal.
   - [`exercises/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/(app)/exercises/page.tsx): Muscle group pills, search input, exercise list cards.
   - [`history/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/(app)/history/page.tsx), [`progress/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/(app)/progress/page.tsx), [`profile/page.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/app/(app)/profile/page.tsx).

5. **Feature Modals & Widgets:**
   - [`plate-calculator.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/components/features/plate-calculator.tsx): Olympic barbell graphic adapted to warm canvas, plate chips.
   - [`exercise-modal.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/components/features/exercise-modal.tsx): Biomechanics guide and technical sheet.
   - [`one-rep-max-modal.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/components/features/one-rep-max-modal.tsx), [`body-weight-tracker.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/components/features/body-weight-tracker.tsx), [`rest-timer.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/components/features/rest-timer.tsx), [`routine-editor.tsx`](file:///home/catriel/RiderProjects/BleidApp/bleid-web/components/features/routine-editor.tsx).

---

## 6. Verification Strategy

1. **Next.js Production Build:** `npm run build` in `bleid-web` verifying TypeScript types and zero CSS module/Tailwind warnings.
2. **Backend Regression:** `dotnet test bleid-api/BleidAppTraining.sln` verifying all 29 tests remain green.
3. **Responsive Visual Audit:** Verify rendering on mobile (375px/390px) and desktop (1440px), checking contrast, text legibility, and lack of dark-mode leftover classes.
