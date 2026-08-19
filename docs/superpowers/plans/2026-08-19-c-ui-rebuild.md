# C UI Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the complete iPhone interface around the approved C mockup while preserving the working local workout, persistence, and HealthKit behavior.

**Architecture:** Keep every storage, store, and HealthKit interface unchanged. Add one shared ambient background, extend the existing design tokens, and reshape the existing screens/components in place so each task remains independently testable and reviewable.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript 6, Expo Router, `react-native-svg`, built-in React Native animation, Zustand.

**Spec:** `docs/superpowers/specs/2026-08-18-healthkit-ui-product-design.md`

## Global Constraints

- Target iPhone and iOS only.
- Preserve all local workout, routine, history, active-session persistence, and HealthKit contracts.
- Keep local workouts fully usable when Apple Health is unavailable or declined.
- Use Spring Bud `#A5FF01` only for primary action, live progress, records, and selected state.
- Use near-black and graphite surfaces; do not turn every section into a floating card.
- Use one restrained ambient lime field behind important regions; do not add glow to every control.
- Use Georgia as the bundled-free editorial display face for major titles and numbers; use the iOS system face for controls and dense data.
- Use existing `react-native-svg`, `expo-blur`, and React Native animation. Add no UI kit or general animation dependency.
- Honor Reduce Motion and maintain 44-point minimum interactive targets.
- Keep the five existing destinations: Home, Workout, Routines, Progress, and Library.
- Commit each verified task directly to `main` and push to `origin/main`.

---

### Task 1: Establish the C visual foundation

**Files:**
- Modify: `src/constants/tokens.ts`
- Create: `src/components/ui/AmbientBackdrop.tsx`
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `tests/uiPresentation.test.mjs`

**Interfaces:**
- Consumes: existing `Colors`, `Spacing`, `Radius`, `FontSize`, `FontWeight`, and `TabBarMetrics` imports.
- Produces: revised tokens, `FontFamily.display`, `FontFamily.data`, and `<AmbientBackdrop intensity="quiet" | "hero" />`.

- [ ] **Step 1: Add a failing visual-contract test**

Append a file-content test to `tests/uiPresentation.test.mjs` that requires the exact Spring Bud accent, the editorial/data font exports, and SVG radial gradients:

```js
test('defines the approved C visual foundation', async () => {
  const tokens = await readFile(new URL('../src/constants/tokens.ts', import.meta.url), 'utf8');
  const backdrop = await readFile(new URL('../src/components/ui/AmbientBackdrop.tsx', import.meta.url), 'utf8');
  assert.match(tokens, /accent: '#A5FF01'/);
  assert.match(tokens, /display: 'Georgia'/);
  assert.match(tokens, /data: 'Menlo'/);
  assert.match(backdrop, /RadialGradient/);
  assert.match(backdrop, /pointerEvents="none"/);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npx tsx --test tests/uiPresentation.test.mjs
```

Expected: FAIL because the new font tokens and backdrop do not exist.

- [ ] **Step 3: Update the tokens without breaking existing imports**

Keep all current token keys and replace their values with this palette:

```ts
export const Colors = {
  bg: '#080A09',
  bgElevated: '#0E110F',
  bgCard: '#141714',
  bgCardAlt: '#1A1E1A',
  bgInput: '#202520',
  accent: '#A5FF01',
  accentDim: '#86CF16',
  accentSoft: '#95AE67',
  accentBg: '#A5FF0114',
  accentBorder: '#A5FF0138',
  danger: '#FF716B',
  dangerBg: '#FF716B14',
  textPrimary: '#F7F8F3',
  textSecondary: '#B1B6AD',
  textMuted: '#72786F',
  textAccent: '#A5FF01',
  border: '#292E29',
  borderStrong: '#3A4139',
  borderAccent: '#A5FF01',
  dot: '#A5FF01',
  dotInactive: '#292E29',
  chartLine: '#A5FF01',
  chartGrid: '#292E29',
} as const;

export const FontFamily = {
  display: 'Georgia',
  data: 'Menlo',
} as const;
```

- [ ] **Step 4: Build the shared ambient backdrop**

Create `AmbientBackdrop.tsx` with a full-screen `Svg`, two `RadialGradient` definitions, and quiet/hero opacity variants. It must be absolute, accessibility-hidden, and pointer-events disabled.

- [ ] **Step 5: Refine the floating navigation dock**

Keep Expo Router tabs and `BlurView`; reduce visual weight, use the new border tokens, keep labels, and preserve the active-workout badge.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npx tsx --test tests/uiPresentation.test.mjs
npm run check
git diff --check
```

Commit:

```bash
git add src/constants/tokens.ts src/components/ui/AmbientBackdrop.tsx app/(tabs)/_layout.tsx tests/uiPresentation.test.mjs
git commit -m "style: establish c visual system"
git push origin main
```

---

### Task 2: Rebuild Home as the real Today screen

**Files:**
- Create: `src/utils/todayActivity.ts`
- Create: `src/components/home/ActivityOverview.tsx`
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `tests/uiPresentation.test.mjs`

**Interfaces:**
- Consumes: `healthService.readTodayActivity()`, `healthService.requestAuthorization()`, `TodayActivity`, local sessions, routines, and active workout state.
- Produces: `getGoalProgress(value: number | null, goal: number | null): number | null`, `formatActivityValue(value, suffix)`, and `ActivityOverview`.

- [ ] **Step 1: Add failing presentation tests**

```js
test('calculates truthful activity progress', async () => {
  const { getGoalProgress, formatActivityValue } = await import('../src/utils/todayActivity.ts');
  assert.equal(getGoalProgress(250, 500), 0.5);
  assert.equal(getGoalProgress(null, 500), null);
  assert.equal(getGoalProgress(250, null), null);
  assert.equal(getGoalProgress(800, 500), 1);
  assert.equal(formatActivityValue(null, 'kcal'), 'Unavailable');
  assert.equal(formatActivityValue(412.6, 'kcal'), '413 kcal');
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npx tsx --test tests/uiPresentation.test.mjs
```

Expected: FAIL because `todayActivity.ts` is absent.

- [ ] **Step 3: Implement the two pure helpers**

Clamp valid goal progress to `[0, 1]`; return `null` for absent or non-positive goals. Round displayed Health values and never turn missing data into zero.

- [ ] **Step 4: Build the activity composition**

Create a single graphite activity surface with an SVG arc, a large factual primary value, and aligned Active energy, Exercise, and Steps values. Use goal progress only when Apple supplies a goal. Do not calculate a combined score.

- [ ] **Step 5: Replace the legacy Home dashboard**

Reshape `HomeScreen` into this order:

```text
TODAY + DATE                                  avatar
ambient activity composition
continue workout (only while active)
LAST WORKOUT                         duration / volume / kcal
THIS WEEK                            completed-day rail
QUICK START                          up to two routines
small Apple Health state / Connect action
```

Read today’s activity on focus. A Connect action requests authorization and rereads; errors remain inline. Remove the development proof panel from Home without deleting its diagnostic component.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npx tsx --test tests/uiPresentation.test.mjs
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
git diff --check
```

Commit:

```bash
git add src/utils/todayActivity.ts src/components/home/ActivityOverview.tsx src/screens/HomeScreen.tsx tests/uiPresentation.test.mjs
git commit -m "style: rebuild today dashboard"
git push origin main
```

---

### Task 3: Turn the workout flow into a precise training instrument

**Files:**
- Modify: `src/components/workout/EmptyWorkoutState.tsx`
- Modify: `src/components/workout/SessionHeader.tsx`
- Modify: `src/components/workout/ExerciseCard.tsx`
- Modify: `src/components/workout/SetRow.tsx`
- Modify: `src/components/workout/WorkoutActionBar.tsx`
- Modify: `src/screens/WorkoutScreen.tsx`

**Interfaces:**
- Consumes: existing workout-store selectors and actions, live Health metrics, edit/replace/reorder/delete handlers, and Reduce Motion.
- Produces: unchanged component props and unchanged workout behavior with the C layout applied.

- [ ] **Step 1: Capture the behavior baseline**

Run:

```bash
npx tsx --test tests/workoutStore.test.mjs tests/activeSessionPersistence.test.mjs tests/uiPresentation.test.mjs
```

Expected: PASS before visual changes.

- [ ] **Step 2: Rebuild the empty state**

Use the shared ambient background, editorial headline, one outlined training symbol, one primary Start workout action, and a clear path to Routines. Keep the existing start callback unchanged.

- [ ] **Step 3: Refine the session header**

Keep Edit and pause/resume. Present the workout name, progress rail, and one consistently aligned three-column live strip for Time, Active calories, and Heart rate. Use tabular numerals and display `—` for missing sensor data.

- [ ] **Step 4: Rebuild the active exercise surface**

Use one 18-point graphite surface. Keep set rows inside it as a compact ledger; no separate card per set. Make the focused/incomplete row strongest, completed rows quieter, and all inputs/controls at least 44 points.

- [ ] **Step 5: Refine queue and action bar**

Keep upcoming exercises as divided rows and retain tap-to-open plus long-press management. Make Add exercise secondary and Finish workout the dominant floating action above the tab dock.

- [ ] **Step 6: Verify behavior and commit**

Run:

```bash
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo export --platform ios --output-dir .expo-export/c-ui-workout --clear
git diff --check
```

Commit:

```bash
git add src/components/workout src/screens/WorkoutScreen.tsx
git commit -m "style: refine active workout interface"
git push origin main
```

---

### Task 4: Match the approved completion composition

**Files:**
- Modify: `src/components/workout/WorkoutCompleteView.tsx`
- Modify: `src/components/progress/WorkoutHistoryItem.tsx`
- Modify: `tests/workoutCompletion.test.mjs`

**Interfaces:**
- Consumes: `WorkoutSession`, comparable workout, new personal records, and existing completion helpers.
- Produces: the same `WorkoutCompleteView` props with a revised composition and reusable visual language for history.

- [ ] **Step 1: Extend the completion-metric test**

Require the existing formatter to keep duration, calories, and heart rate truthful when Health metrics are absent or present. Do not invent values for unavailable data.

- [ ] **Step 2: Rebuild the hero and metric alignment**

Use this order:

```text
SESSION COMPLETE
Push Day
duration          active calories          average BPM
[ rounded Total volume surface + neutral comparison ]
[ PR callouts, only when earned ]
[ heart-rate trace, average, peak ]
[ detailed exercise ledger ]
[ Apple Health save state ]
Done
```

Center all three live metrics using one shared alignment system. Keep the title clear of safe areas and controls.

- [ ] **Step 3: Add the restrained completion entrance**

Use one opacity/translate entrance sequence and disable movement under Reduce Motion. Do not animate every row independently.

- [ ] **Step 4: Align completed-workout history**

Make history rows use the same metric vocabulary, Health state, and exercise breakdown styling without duplicating completion logic.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
git diff --check
```

Commit:

```bash
git add src/components/workout/WorkoutCompleteView.tsx src/components/progress/WorkoutHistoryItem.tsx tests/workoutCompletion.test.mjs
git commit -m "style: finish c workout summary"
git push origin main
```

---

### Task 5: Propagate the system through Routines, Progress, and Library

**Files:**
- Modify: `src/screens/RoutinesScreen.tsx`
- Modify: `src/components/routines/RoutineCard.tsx`
- Modify: `src/components/routines/RoutineBuilder.tsx`
- Modify: `src/screens/ProgressScreen.tsx`
- Modify: `src/components/ui/LineChart.tsx`
- Modify: `src/screens/LibraryScreen.tsx`

**Interfaces:**
- Consumes: existing routine CRUD, routine ordering, progress builders, history, personal records, exercise search/categories, and custom-exercise CRUD.
- Produces: unchanged user flows with consistent C headers, rows, surfaces, typography, and empty states.

- [ ] **Step 1: Capture the behavior baseline**

Run:

```bash
npx tsx --test tests/workoutStore.test.mjs tests/workoutHistory.test.mjs tests/utils.test.mjs tests/exercises.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Rebuild Routines**

Use strong names, compact exercise previews, a small Start action, and explicit Edit/Delete controls. Keep builder behavior and saved ordering unchanged; remove emoji decoration.

- [ ] **Step 3: Rebuild Progress**

Lead with one editorial volume number and integrated line trace, followed by neutral low/average/peak context, divided workout history, and PR rows. A negative comparison remains neutral rather than failure-red.

- [ ] **Step 4: Rebuild Library**

Use a quiet search field, compact category chips, section labels, and divided exercise rows. Preserve custom-exercise creation/edit/delete and every current selector use.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo export --platform ios --output-dir .expo-export/c-ui-complete --clear
npx expo-doctor
git diff --check
```

Commit:

```bash
git add src/screens/RoutinesScreen.tsx src/components/routines src/screens/ProgressScreen.tsx src/components/ui/LineChart.tsx src/screens/LibraryScreen.tsx
git commit -m "style: complete c interface"
git push origin main
```

---

### Task 6: Final repository and iPhone acceptance gate

**Files:** None unless verification exposes a defect.

**Interfaces:**
- Consumes: Tasks 1–5 on `main`.
- Produces: a clean, reproducible C UI build ready for physical iPhone review.

- [ ] **Step 1: Run the complete automated gate**

```bash
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export/c-ui-final --clear
git diff --check
git status --short --branch
```

- [ ] **Step 2: Run the physical iPhone visual check**

On the Mac, install the current `main` development build and verify Home, empty workout, active workout, keyboard entry, exercise editing, completion, Routines, Progress, Library, Health unavailable states, long names, and Reduce Motion.

- [ ] **Step 3: Confirm repository state**

`HEAD`, `origin/main`, and the GitHub `main` branch must resolve to the same commit. No completion claim is allowed until the physical visual check is reviewed with screenshots from Vlad’s iPhone.
