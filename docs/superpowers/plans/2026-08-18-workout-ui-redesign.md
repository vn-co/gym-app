# Workout-First UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a softer performance-oriented visual foundation, Apple Fitness-inspired five-tab navigation, and a complete accessible redesign of the empty and active Workout experiences without changing workout data behavior.

**Architecture:** Keep Expo Router's stable JavaScript tabs and the existing Zustand/storage flow. Add pure navigation and presentation metadata, a small internal SVG icon set, built-in React Native motion with a Reduce Motion hook, and focused Workout presentation components. Use Expo BlurView only for the tab dock; no native-tabs alpha API, animation framework, custom font, or icon library.

**Tech Stack:** Expo SDK 57, Expo Router JavaScript Tabs, React Native 0.86, TypeScript 6, Zustand 5, react-native-svg, expo-blur, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-08-18-workout-ui-redesign-design.md`

## Global Constraints

- iOS-only; keep `app.json` platforms unchanged.
- Preserve all workout models, store actions, storage keys, persistence timing, and finish durability.
- Keep the five routes `index`, `workout`, `routines`, `progress`, and `library` static and labeled.
- Use exact semantic colors from the spec, including accent `#C2E653`, accent tint `#C2E65314`, danger `#FF6B6B`, and danger tint `#FF6B6B14`.
- Use the iOS system font; add no font package.
- Use `react-native-svg` for internal icons; add no icon package and copy no Apple assets.
- Use built-in `Animated` and `LayoutAnimation`; add no Reanimated dependency.
- Direct feedback duration is 160 ms; progress/layout duration is 220 ms.
- Honor Reduce Motion and preserve checkmarks, labels, colors, and numeric state when motion is disabled.
- Icon-only controls have button roles, descriptive labels, and at least 44-by-44-point targets.
- Keep the active tab bar visible; keep workout actions separate from navigation.
- Commit each completed task to local `main`; push after verification.

---

## File structure

**Create**

- `src/constants/navigation.ts` — stable route, label, and icon metadata.
- `src/utils/uiPresentation.ts` — pure percentage and motion-duration helpers.
- `src/hooks/useReducedMotion.ts` — live iOS Reduce Motion preference.
- `src/components/icons/AppIcon.tsx` — small internal SVG icon renderer.
- `src/components/navigation/AnimatedTabIcon.tsx` — selected-tab animation and active-workout badge.
- `src/components/workout/EmptyWorkoutState.tsx` — empty Workout hierarchy and illustration.
- `src/components/workout/WorkoutActionBar.tsx` — persistent Add/Finish controls.
- `tests/uiPresentation.test.mjs` — pure UI metadata and presentation tests.

**Modify**

- `package.json`, `package-lock.json` — install SDK-aligned `expo-blur`.
- `src/constants/tokens.ts` — semantic soft-performance tokens and tab metrics.
- `app/(tabs)/_layout.tsx` — blurred icon-and-label tab dock.
- `src/components/workout/SessionHeader.tsx` — integrated title/timer/progress header.
- `src/components/workout/SetRow.tsx` — accessible 44-point inputs and completion feedback.
- `src/components/workout/ExerciseCard.tsx` — quieter card hierarchy and layout animation.
- `src/components/workout/ExercisePicker.tsx` — matching sheet, search, chips, and rows.
- `src/screens/WorkoutScreen.tsx` — compose empty/active states, persistent actions, edge state, and refreshed name modal.
- `README.md` — describe the redesigned Workout flow and retained later UI phases.

---

### Task 1: Pure visual foundation and tests

**Files:**
- Create: `src/constants/navigation.ts`
- Create: `src/utils/uiPresentation.ts`
- Create: `tests/uiPresentation.test.mjs`
- Modify: `src/constants/tokens.ts`

**Interfaces:**
- Produces: `TAB_ITEMS`, an immutable five-item array with `{ route, label, icon }`.
- Produces: `type NavigationIconName = 'home' | 'workout' | 'routines' | 'progress' | 'library'`.
- Produces: `getProgressPercentage(completed: number, total: number): number`.
- Produces: `getMotionDuration(reduceMotion: boolean, duration: number): number`.
- Produces from tokens: `MotionDuration.fast === 160`, `MotionDuration.standard === 220`, and `TabBarMetrics`.

- [ ] **Step 1: Write the failing pure tests**

Create `tests/uiPresentation.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { TAB_ITEMS } from '../src/constants/navigation.ts';
import { MotionDuration } from '../src/constants/tokens.ts';
import {
  getMotionDuration,
  getProgressPercentage,
} from '../src/utils/uiPresentation.ts';

test('defines the five stable labeled tabs in display order', () => {
  assert.deepEqual(
    TAB_ITEMS.map(({ route, label, icon }) => ({ route, label, icon })),
    [
      { route: 'index', label: 'Home', icon: 'home' },
      { route: 'workout', label: 'Workout', icon: 'workout' },
      { route: 'routines', label: 'Routines', icon: 'routines' },
      { route: 'progress', label: 'Progress', icon: 'progress' },
      { route: 'library', label: 'Library', icon: 'library' },
    ],
  );
});

test('clamps workout progress to a valid percentage', () => {
  assert.equal(getProgressPercentage(0, 0), 0);
  assert.equal(getProgressPercentage(2, 3), 67);
  assert.equal(getProgressPercentage(12, 9), 100);
  assert.equal(getProgressPercentage(-1, 4), 0);
  assert.equal(getProgressPercentage(Number.NaN, 4), 0);
});

test('disables motion durations when Reduce Motion is enabled', () => {
  assert.equal(MotionDuration.fast, 160);
  assert.equal(MotionDuration.standard, 220);
  assert.equal(getMotionDuration(false, MotionDuration.fast), 160);
  assert.equal(getMotionDuration(true, MotionDuration.standard), 0);
});
```

- [ ] **Step 2: Run the tests and confirm the new modules are missing**

Run: `npx tsx --test tests/uiPresentation.test.mjs`

Expected: FAIL because `navigation.ts` and `uiPresentation.ts` do not exist.

- [ ] **Step 3: Add the minimal pure modules**

Create `src/constants/navigation.ts`:

```ts
export type NavigationIconName =
  | 'home'
  | 'workout'
  | 'routines'
  | 'progress'
  | 'library';

export const TAB_ITEMS = [
  { route: 'index', label: 'Home', icon: 'home' },
  { route: 'workout', label: 'Workout', icon: 'workout' },
  { route: 'routines', label: 'Routines', icon: 'routines' },
  { route: 'progress', label: 'Progress', icon: 'progress' },
  { route: 'library', label: 'Library', icon: 'library' },
] as const satisfies readonly {
  route: string;
  label: string;
  icon: NavigationIconName;
}[];
```

Create `src/utils/uiPresentation.ts`:

```ts
export function getMotionDuration(
  reduceMotion: boolean,
  duration: number,
): number {
  return reduceMotion ? 0 : duration;
}

export function getProgressPercentage(
  completed: number,
  total: number,
): number {
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}
```

- [ ] **Step 4: Replace token values and add shared motion/tab metrics**

Keep existing token property names so later screen phases remain source-compatible. Change their values to the exact semantic palette and add:

```ts
export const MotionDuration = {
  fast: 160,
  standard: 220,
} as const;

export const TabBarMetrics = {
  height: 68,
  horizontalInset: 12,
  bottomGap: 8,
} as const;
```

Use `bg: '#0B0D0C'`, `bgCard: '#171A18'`, `bgCardAlt: '#1E221F'`, `bgInput: '#232724'`, `border: '#292E2A'`, `textPrimary: '#F3F5EF'`, `textSecondary: '#A1A69E'`, `textMuted: '#71776F'`, `accent: '#C2E653'`, `accentDim: '#AACB43'`, `accentBg: '#C2E65314'`, `danger: '#FF6B6B'`, and `dangerBg: '#FF6B6B14'`.

- [ ] **Step 5: Run the focused and full tests**

Run: `npx tsx --test tests/uiPresentation.test.mjs`

Expected: 3 tests PASS.

Run: `npm test`

Expected: all existing and new tests PASS.

- [ ] **Step 6: Commit the foundation**

```bash
git add src/constants/navigation.ts src/utils/uiPresentation.ts src/constants/tokens.ts tests/uiPresentation.test.mjs
git commit -m "style: establish workout ui foundation"
```

---

### Task 2: Reduce Motion, internal icons, and blurred navigation

**Files:**
- Create: `src/hooks/useReducedMotion.ts`
- Create: `src/components/icons/AppIcon.tsx`
- Create: `src/components/navigation/AnimatedTabIcon.tsx`
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `TAB_ITEMS`, `NavigationIconName`, `MotionDuration.fast`, `TabBarMetrics`, and shared tokens.
- Produces: `useReducedMotion(): boolean`.
- Produces: `AppIcon({ name, size, color, strokeWidth })` for navigation plus `add`, `check`, `pause`, `play`, `more`, and `dumbbell` action names.
- Produces: `AnimatedTabIcon({ icon, focused, showBadge })`.

- [ ] **Step 1: Install only the SDK-aligned blur dependency**

Run: `npx expo install expo-blur`

Expected: `expo-blur` is added at the Expo SDK 57-compatible version and the lockfile changes without unrelated major upgrades.

- [ ] **Step 2: Implement the live Reduce Motion hook**

Create `src/hooks/useReducedMotion.ts` using this lifecycle:

```ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setEnabled,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}
```

- [ ] **Step 3: Implement the focused SVG icon set**

Create `AppIcon.tsx` with one `Svg` wrapper and a `switch (name)` returning `Path`, `Rect`, `Circle`, or `Line` elements. Use a 24-by-24 viewBox, round caps/joins, `fill="none"`, and `stroke={color}`. The five tab shapes are house, dumbbell, three-line list, rising chart, and four-tile library; action shapes cover plus, check, pause, play, more, and dumbbell illustration. Throw no runtime error for valid `AppIconName` values.

- [ ] **Step 4: Implement selected-tab feedback**

Create `AnimatedTabIcon.tsx` with an `Animated.Value(focused ? 1 : 0)`. On focus changes, animate to 1 or 0 with `Animated.timing`, duration from `getMotionDuration(reduceMotion, MotionDuration.fast)`, and `useNativeDriver: true`. Interpolate scale from `0.94` to `1`. Render the icon inside a 36-by-30 container, apply `Colors.accentBg` only when focused, and render the existing active-workout badge as a 7-point accent dot without changing layout.

- [ ] **Step 5: Replace emoji tab rendering with the blurred dock**

In `app/(tabs)/_layout.tsx`:

- Read safe-area insets.
- Map the five `TAB_ITEMS` to explicit `Tabs.Screen` declarations so typed routes remain clear.
- Set `tabBarShowLabel: true`, `tabBarActiveTintColor: Colors.accent`, `tabBarInactiveTintColor: Colors.textMuted`, and `tabBarHideOnKeyboard: true`.
- Use absolute positioning, `TabBarMetrics.horizontalInset`, `bottom: Math.max(insets.bottom, TabBarMetrics.bottomGap)`, fixed `TabBarMetrics.height`, rounded 24-point corners, and a quiet one-point border.
- Render `BlurView` through `tabBarBackground` with dark tint and a transparent/fallback graphite overlay.
- Use 10–11 point labels and at least 44-point items.
- Pass `showBadge={item.route === 'workout' && Boolean(activeSession)}` only to Workout.
- Give every screen `tabBarAccessibilityLabel: item.label`.

- [ ] **Step 6: Verify navigation compiles and exports**

Run: `npm run typecheck`

Expected: PASS with no unused icon types or invalid tab options.

Run: `npx expo export --platform ios --output-dir .expo-export/ui-nav --clear`

Expected: iOS bundle succeeds and contains `expo-blur`.

- [ ] **Step 7: Commit navigation**

```bash
git add package.json package-lock.json 'app/(tabs)/_layout.tsx' src/hooks/useReducedMotion.ts src/components/icons/AppIcon.tsx src/components/navigation/AnimatedTabIcon.tsx
git commit -m "style: add apple-inspired tab navigation"
```

---

### Task 3: Session header and persistent workout actions

**Files:**
- Modify: `src/components/workout/SessionHeader.tsx`
- Create: `src/components/workout/WorkoutActionBar.tsx`
- Modify: `src/screens/WorkoutScreen.tsx`

**Interfaces:**
- Consumes: `getProgressPercentage`, `useReducedMotion`, `MotionDuration.standard`, `TabBarMetrics`, `AppIcon`, and existing timer/store actions.
- Produces: `WorkoutActionBar({ onAddExercise, onFinish })` with no store or storage dependency.

- [ ] **Step 1: Redesign and animate SessionHeader without changing timer behavior**

Keep the existing store selectors and `useWorkoutTimer(session)`. Replace the card with an integrated header:

- `Workout in progress` metadata label.
- One-line workout title using `numberOfLines={1}`.
- Timer using `formatTimerDisplay`, monospaced/tabular digits, and `accessibilityLiveRegion="none"`.
- 44-by-44 pause/resume `Pressable` with `AppIcon` and label `Pause workout timer` or `Resume workout timer`.
- `completedSets / totalSets` summary and clamped percentage from `getProgressPercentage`.
- An `Animated.View` progress fill whose width is driven by an `Animated.Value(pct)` and updated over 220 ms, or immediately with Reduce Motion.

Do not persist or mutate timer display ticks.

- [ ] **Step 2: Create the action bar as a presentation-only component**

Create `WorkoutActionBar.tsx`:

```ts
interface WorkoutActionBarProps {
  bottom: number;
  onAddExercise: () => void;
  onFinish: () => void;
}
```

Render an absolutely positioned horizontal container. The Add control is 52-by-52 with `AppIcon name="add"`, role `button`, and label `Add exercise`. The Finish control fills remaining width, uses accent background, and reads **Finish workout**. Both use `Pressable` opacity/scale feedback and remain separate from the tab dock.

- [ ] **Step 3: Compose the action bar in the active Workout screen**

Read safe-area insets in `WorkoutScreen`. Compute:

```ts
const tabBottom = Math.max(insets.bottom, TabBarMetrics.bottomGap);
const actionBottom = tabBottom + TabBarMetrics.height + Spacing.sm;
const scrollBottomInset = actionBottom + 68;
```

Render `WorkoutActionBar` outside the ScrollView only when a session exists. Remove the scrolling Add Exercise and Finish buttons. Keep the quiet scrolling Cancel Workout action. Set the ScrollView content bottom padding to `scrollBottomInset`.

Change the Finish confirmation action from `style: 'destructive'` to the normal action style without changing validation, persistence order, retry behavior, or error copy.

- [ ] **Step 4: Verify regression behavior**

Run: `npm test`

Expected: active timer, store, persistence, and finish tests all PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the active shell**

```bash
git add src/components/workout/SessionHeader.tsx src/components/workout/WorkoutActionBar.tsx src/screens/WorkoutScreen.tsx
git commit -m "style: redesign active workout shell"
```

---

### Task 4: Set-entry and exercise-card interaction polish

**Files:**
- Modify: `src/components/workout/SetRow.tsx`
- Modify: `src/components/workout/ExerciseCard.tsx`
- Modify: `src/screens/WorkoutScreen.tsx`

**Interfaces:**
- Consumes: `useReducedMotion`, `getMotionDuration`, `MotionDuration`, `AppIcon`, existing store mutation callbacks, and exact tokens.
- Preserves: `SetRow` and `ExerciseCard` public data callbacks.

- [ ] **Step 1: Add completion feedback inside SetRow**

Keep numeric parsing, keyboards, values, and callbacks unchanged. Add:

- One `Animated.Value(set.completed ? 1 : 0)` for row tint opacity.
- One `Animated.Value(set.completed ? 1 : 0)` for check scale.
- A completion effect that uses a 160 ms timing for row tint and a tight spring for scale when completing; reverse with a 160 ms timing.
- Immediate final values when Reduce Motion is enabled.
- At least 44-point row fields and completion target.
- `accessibilityRole="checkbox"`, `accessibilityState={{ checked: set.completed }}`, and label `Complete set ${index + 1}`.
- `AppIcon name="check"` rather than a text glyph.

Set value inputs use 17-point semibold tabular numbers, neutral elevated backgrounds, and accessible placeholders.

- [ ] **Step 2: Redesign ExerciseCard hierarchy**

Preserve store selectors and callbacks. Update the card to:

- 20-point radius, quiet border, and graphite surface.
- One-line exercise title plus derived completion metadata such as `2 of 3 sets complete`.
- 44-point menu target with `AppIcon name="more"` and label `Options for ${exercise.exerciseName}`.
- Compact column labels and the redesigned SetRow list.
- 44-point Add Set target with accent text.

Before calling `addSet`, run `LayoutAnimation.configureNext` for 220 ms only when Reduce Motion is disabled.

- [ ] **Step 3: Animate exercise insertion/removal at the coordinator boundary**

In `WorkoutScreen`, call the same reduced-motion-aware layout animation immediately before `addExercise` and immediately before confirmed `removeExercise`. Do not add delays or change picker closing behavior.

- [ ] **Step 4: Run store and full regression tests**

Run: `npx tsx --test tests/workoutStore.test.mjs tests/activeSessionPersistence.test.mjs`

Expected: PASS.

Run: `npm run check`

Expected: typecheck and every test PASS.

- [ ] **Step 5: Commit set and exercise polish**

```bash
git add src/components/workout/SetRow.tsx src/components/workout/ExerciseCard.tsx src/screens/WorkoutScreen.tsx
git commit -m "style: polish workout set interactions"
```

---

### Task 5: Empty Workout state and name-entry modal

**Files:**
- Create: `src/components/workout/EmptyWorkoutState.tsx`
- Modify: `src/screens/WorkoutScreen.tsx`

**Interfaces:**
- Consumes: `AppIcon name="dumbbell"`, shared tokens, and existing start/name state.
- Produces: `EmptyWorkoutState({ onStart }: { onStart: () => void })`.

- [ ] **Step 1: Create the accessible empty state**

Render:

- Screen-level **Workout** title aligned to the content edge.
- Two overlapping graphite circles with a centered dumbbell outline.
- **Ready when you are** headline.
- Supporting copy: `Start an empty workout here, or launch one of your saved routines from Routines.`
- Full-width accent **Start workout** button with a 52-point height.

The illustration is decorative and hidden from accessibility; the button has role and label.

- [ ] **Step 2: Replace the old emoji state and restyle the modal**

Use `EmptyWorkoutState` when `session` is null. Keep `handleStartWorkout`, `workoutName`, `confirmStart`, submit behavior, and `My Workout` default.

Restyle the modal overlay to align its card to the bottom with safe spacing, 24-point top corners, graphite elevated surface, a quiet drag indicator, a 48-point input, and side-by-side Cancel/Start actions. Use `animationType="slide"`. Cancel does not mutate workout state.

- [ ] **Step 3: Run behavior and TypeScript checks**

Run: `npx tsx --test tests/workoutStore.test.mjs tests/activeSessionPersistence.test.mjs`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 4: Commit the empty state**

```bash
git add src/components/workout/EmptyWorkoutState.tsx src/screens/WorkoutScreen.tsx
git commit -m "style: redesign workout start experience"
```

---

### Task 6: Exercise picker and active edge states

**Files:**
- Modify: `src/components/workout/ExercisePicker.tsx`
- Modify: `src/screens/WorkoutScreen.tsx`

**Interfaces:**
- Preserves: `ExercisePicker` props and filtering behavior.
- Consumes: `AppIcon name="add"`, exact shared tokens, and existing muscle labels.

- [ ] **Step 1: Restyle ExercisePicker without changing selection behavior**

Keep `presentationStyle="pageSheet"`, query/group state, memoized filtering, `onSelect(item)` followed by `onClose()`, and custom exercise merging.

Update presentation:

- Graphite background and a quiet sheet header.
- **Add exercise** 24-point title and 44-point Done target.
- 48-point elevated search input with clear button.
- 36-point filter chips; active chip uses accent tint plus accent text rather than a fully neon fill.
- Exercise rows at least 56 points tall with primary name, secondary muscle/equipment, and a 44-point accent add icon area.
- Empty result copy `No exercises match your search.` through `ListEmptyComponent`.
- Appropriate accessibility labels for Done, chips, and each add row.

- [ ] **Step 2: Add the zero-exercise active prompt**

When an active session has no exercises, render an inline graphite panel below SessionHeader with **Add your first exercise** and `Choose an exercise to begin logging sets.` The persistent Add exercise control remains the action; the panel contains no duplicate button.

- [ ] **Step 3: Verify long-content and keyboard-safe code paths**

Confirm through code inspection and TypeScript that:

- Workout/exercise titles use `numberOfLines={1}` and truncation.
- ScrollView uses `keyboardShouldPersistTaps="handled"` and computed bottom padding.
- Tab bar uses `tabBarHideOnKeyboard: true`.
- Picker FlatLists retain bottom padding and stable keys.

Run: `npm run check`

Expected: PASS.

- [ ] **Step 4: Commit picker and edge states**

```bash
git add src/components/workout/ExercisePicker.tsx src/screens/WorkoutScreen.tsx
git commit -m "style: finish workout picker and edge states"
```

---

### Task 7: Documentation and full release verification

**Files:**
- Modify: `README.md`
- Verify: entire repository

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: verified iOS production bundle and user-facing setup/behavior notes.

- [ ] **Step 1: Update README scope truthfully**

Document:

- The softer Workout-first UI and icon-and-label navigation.
- Active Workout's persistent Add/Finish controls.
- Reduce Motion support.
- That Home, Routines, Progress, and Library layout redesigns remain later phases.
- That iPhone visual/interaction testing still requires the later Mac simulator and physical-device phase.

- [ ] **Step 2: Run clean-install verification**

Run: `npm ci`

Expected: clean dependency install succeeds without lockfile drift.

- [ ] **Step 3: Run all static and behavioral checks**

Run: `npm run check`

Expected: TypeScript and all tests PASS.

Run: `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`

Expected: PASS.

Run: `npx expo-doctor`

Expected: all Expo checks PASS.

- [ ] **Step 4: Build a production iOS export outside tracked source**

Run: `npx expo export --platform ios --output-dir .expo-export/ui-final --clear`

Expected: Metro completes an iOS production bundle with no missing module or route errors.

- [ ] **Step 5: Inspect repository scope and advisories**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: only intended source/docs changes; `.superpowers/`, `.expo-export/`, and dependencies remain ignored.

Run: `npm audit --omit=dev`

Expected: report the actual advisory count; do not run `npm audit fix --force` or downgrade Expo.

- [ ] **Step 6: Commit documentation, push, and verify remote main**

```bash
git add README.md
git commit -m "docs: document workout ui refresh"
git push origin main
git status --short
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Expected: clean worktree and matching local/remote `main` hashes.

- [ ] **Step 7: Record the remaining visual verification boundary**

Report that automated checks and the iOS production export passed. Do not claim Mac simulator or physical iPhone appearance, blur, keyboard, animation, Reduce Motion, or one-handed reach were tested from Windows. Provide a concise later-device checklist for those items.
