# Gym App Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current personal gym tracker reproducible, type-safe, data-loss-resistant, and correct without changing its visual design or feature scope.

**Architecture:** Keep Expo Router, Zustand, and AsyncStorage as the anchors. Repair their contracts at the existing boundaries: Expo config for native builds, pure helpers for testable domain calculations, the storage service for persistence failures, and props/actions for UI-to-domain flow. Avoid backend, repository, payment, and design-system abstractions until a real consumer requires them.

**Tech Stack:** Expo SDK 57, React Native 0.86, React 19, TypeScript 6, Expo Router, Zustand 5, AsyncStorage, Node's built-in test runner through `tsx`.

**Spec:** `docs/audits/2026-08-18-repo-audit.md`

## Global Constraints

- Preserve all current Home, Workout, Routines, Progress, and Library behavior except where the audit proves it incorrect.
- Remain iOS-first and completely local/offline; add no backend, authentication, analytics, payment, or network feature.
- Use strict TypeScript and enable unused-local checks.
- Use the existing dependencies or Expo-supported modules; add only `tsx` for runnable regression tests.
- Do not redesign UI in this stabilization pass.
- Commit every completed task directly on `main`.

---

### Task 1: Restore deterministic Expo builds

**Files:**
- Modify: `package.json`
- Regenerate: `package-lock.json`
- Modify: `app.json`
- Modify: `app/_layout.tsx`
- Modify: `.gitignore`
- Modify: `tsconfig.json`
- Delete: `babel.config.js`
- Delete: `metro.config.js`
- Delete: `expo-env.d.ts`

**Interfaces:**
- Consumes: Expo SDK 57's supported package matrix and config-plugin schema.
- Produces: `npm ci`, `npm run typecheck`, Expo Doctor, and iOS export entrypoints that can run from a fresh checkout.

- [x] **Step 1: Preserve the failing baseline evidence**

Run: `npm ci`, `npx tsc --noEmit`, `npx expo-doctor`, and `npx expo export --platform ios`.

Expected: lockfile `EUSAGE`; five TypeScript errors; four Expo Doctor failures; bundle failure resolving the project-level Babel preset.

- [x] **Step 2: Align the supported package and script contract**

Set the relevant `package.json` entries to:

```json
{
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "typecheck": "tsc --noEmit",
    "test": "tsx --test tests/*.test.mjs",
    "check": "npm run typecheck && npm test"
  },
  "dependencies": {
    "expo": "~57.0.14",
    "expo-constants": "~57.0.12",
    "expo-linking": "~57.0.6",
    "expo-router": "~57.0.14",
    "expo-splash-screen": "~57.0.7",
    "react-native": "0.86.2"
  },
  "devDependencies": {
    "tsx": "^4.23.12"
  },
  "overrides": {
    "react-dom": "$react"
  }
}
```

Remove the unnecessary direct `expo-asset` dependency; Expo itself owns the compatible asset package.

- [x] **Step 3: Repair the native app config**

Use `./assets/logo.png` as the icon, remove legacy top-level `splash`, remove the parameterless `expo-asset` plugin, and configure:

```json
[
  "expo-splash-screen",
  {
    "image": "./assets/splash.png",
    "imageWidth": 320,
    "resizeMode": "contain",
    "backgroundColor": "#0a0a0a"
  }
]
```

- [x] **Step 4: Remove stock wrappers and strict-mode violations**

Delete the Babel and Metro files because they only re-export Expo defaults. Remove the unused root-layout import and unsupported `StatusBar.backgroundColor`. Rewrite `.gitignore` as patterns rather than shell text, remove the tracked generated Expo declaration, and enable `noUnusedLocals` plus `noUnusedParameters`.

- [x] **Step 5: Regenerate dependencies from the manifest**

Run: `npm install`

Expected: `package-lock.json` contains the full peer tree and `npm ci` subsequently succeeds.

- [x] **Step 6: Verify and commit**

Run: `npm ci`, `npm run typecheck`, `npx expo-doctor`, and `npx expo export --platform ios --output-dir <temporary-directory> --clear`.

Expected: the clean install succeeds; remaining type errors are limited to behavior tasks below if not yet implemented; Expo configuration/dependency checks pass; Metro produces an iOS bundle.

```bash
git add package.json package-lock.json app.json app/_layout.tsx .gitignore tsconfig.json babel.config.js metro.config.js expo-env.d.ts
git commit -m "fix: restore reproducible Expo builds"
```

### Task 2: Correct the routine-to-workout contract

**Files:**
- Create: `tests/workoutStore.test.mjs`
- Modify: `src/store/workoutStore.ts`
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/screens/RoutinesScreen.tsx`

**Interfaces:**
- Consumes: `Routine.exercises: RoutineExercise[]`.
- Produces: `startSessionFromRoutine(name: string, exercises: RoutineExercise[]): void`.

- [x] **Step 1: Write the failing store regression**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { useWorkoutStore } from '../src/store/workoutStore.ts';

test('starts a routine with each exercise defaults', () => {
  useWorkoutStore.getState().cancelSession();
  useWorkoutStore.getState().startSessionFromRoutine('Push', [
    {
      exerciseId: 'bench_press',
      exerciseName: 'Bench Press',
      muscleGroup: 'chest',
      defaultSets: 2,
      defaultReps: 8,
      defaultWeight: 60,
    },
  ]);

  const exercise = useWorkoutStore.getState().session?.exercises[0];
  assert.equal(exercise?.sets.length, 2);
  assert.deepEqual(
    exercise?.sets.map(({ weight, reps, completed }) => ({ weight, reps, completed })),
    [
      { weight: 60, reps: 8, completed: false },
      { weight: 60, reps: 8, completed: false },
    ],
  );
});
```

- [x] **Step 2: Run the test to verify RED**

Run: `npm test`

Expected: FAIL because the current implementation indexes undefined parallel arrays.

- [x] **Step 3: Implement the minimal contract**

Map the supplied routine exercises directly and update both callers to pass `routine.exercises` rather than four parallel arrays.

- [x] **Step 4: Verify GREEN and commit**

Run: `npm test && npm run typecheck`

Expected: PASS with no routine contract errors.

```bash
git add tests/workoutStore.test.mjs src/store/workoutStore.ts src/screens/HomeScreen.tsx src/screens/RoutinesScreen.tsx
git commit -m "fix: preserve routine exercise defaults"
```

### Task 3: Repair analytics and numeric entry

**Files:**
- Create: `tests/utils.test.mjs`
- Modify: `src/utils/index.ts`
- Modify: `src/screens/ProgressScreen.tsx`
- Modify: `src/components/workout/SetRow.tsx`
- Modify: `src/components/routines/RoutineBuilder.tsx`

**Interfaces:**
- Consumes: `WorkoutSession[]`, `ProgressRange`, and raw numeric input text.
- Produces: complete calendar buckets, equal comparison windows, and `parseNumericInput(text, integer?)`.

- [x] **Step 1: Write failing analytics tests**

Cover these real behaviors with `node:test` and `node:assert/strict`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProgressData, parseNumericInput } from '../src/utils/index.ts';

function sessionAt(date, totalVolume) {
  return {
    id: `session_${date.getTime()}`,
    name: 'Test workout',
    startTime: date.getTime(),
    durationSeconds: 60,
    exercises: [],
    totalVolume,
    totalSets: 1,
  };
}

function daysAgo(days, totalVolume) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return sessionAt(date, totalVolume);
}

test('includes every day in the one-year weekly buckets', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(12, 0, 0, 0);
  const session = sessionAt(yesterday, 123);
  const { points } = buildProgressData([session], '1y');
  assert.equal(points.reduce((sum, point) => sum + point.volume, 0), 123);
});

test('compares equal windows for seven-day change', () => {
  const sessions = [daysAgo(6, 100), daysAgo(0, 200)];
  assert.equal(buildProgressData(sessions, '7d').stats.percentChange, 100);
});
```

- [x] **Step 2: Write failing numeric-input tests**

```js
assert.equal(parseNumericInput('62,5'), 62.5);
assert.equal(parseNumericInput('12abc'), 0);
assert.equal(parseNumericInput('-5'), 0);
assert.equal(parseNumericInput('8.9', true), 8);
```

- [x] **Step 3: Run the tests to verify RED**

Run: `npm test`

Expected: the one-year total is zero, the comparison is unequal, and `parseNumericInput` is missing.

- [x] **Step 4: Implement minimal calendar and parsing fixes**

Build daily/weekly bucket boundaries by advancing `Date.setDate`, not adding milliseconds. Make the last bucket end at the next local midnight, compare the first and last equally sized halves, derive selected-range `hasData` from points, and route both weight entry surfaces through the tested parser.

- [x] **Step 5: Verify GREEN and commit**

Run: `npm test && npm run typecheck`

```bash
git add tests/utils.test.mjs src/utils/index.ts src/screens/ProgressScreen.tsx src/components/workout/SetRow.tsx src/components/routines/RoutineBuilder.tsx
git commit -m "fix: correct progress buckets and numeric input"
```

### Task 4: Prevent silent storage data loss

**Files:**
- Create: `src/services/storageCodec.ts`
- Create: `tests/storageCodec.test.mjs`
- Modify: `src/services/storage.ts`
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/screens/WorkoutScreen.tsx`
- Modify: `src/screens/RoutinesScreen.tsx`
- Modify: `src/screens/ProgressScreen.tsx`
- Modify: `src/screens/LibraryScreen.tsx`

**Interfaces:**
- Consumes: `string | null` returned by AsyncStorage.
- Produces: `parseStoredArray<T>(raw, key): T[]`, which returns `[]` only for a missing key and throws for invalid data.

- [x] **Step 1: Write the failing codec tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStoredArray } from '../src/services/storageCodec.ts';

test('missing stored arrays are empty', () => {
  assert.deepEqual(parseStoredArray(null, 'sessions'), []);
});

test('valid stored arrays are returned', () => {
  assert.deepEqual(parseStoredArray('[{"id":"1"}]', 'sessions'), [{ id: '1' }]);
});

test('invalid stored data is never treated as empty', () => {
  assert.throws(() => parseStoredArray('{broken', 'sessions'), /sessions/);
  assert.throws(() => parseStoredArray('{}', 'sessions'), /sessions/);
});
```

- [x] **Step 2: Run the tests to verify RED**

Run: `npm test`

Expected: module-not-found failure for the not-yet-created codec.

- [x] **Step 3: Implement the codec and use it at every collection read**

```ts
export function parseStoredArray<T>(raw: string | null, key: string): T[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new TypeError('Expected an array');
    return parsed as T[];
  } catch (cause) {
    throw new Error(`Invalid stored data for ${key}`, { cause });
  }
}
```

Remove catch-all empty fallbacks from sessions, personal records, custom exercises, and routines. Let AsyncStorage failures propagate so read-modify-write operations cannot overwrite unknown data.

- [x] **Step 4: Contain storage failures at screen boundaries**

Wrap loads and writes in `try/catch/finally`. Show a concise `Alert` such as “Couldn’t load saved data. Your existing data was not changed.” Keep workout/routine forms active after failed saves, and always clear pull-to-refresh spinners in `finally`.

- [x] **Step 5: Verify GREEN and commit**

Run: `npm test && npm run typecheck`

```bash
git add src/services/storageCodec.ts tests/storageCodec.test.mjs src/services/storage.ts src/screens
git commit -m "fix: surface storage failures without overwriting data"
```

### Task 5: Unify exercise sources and finish cleanup

**Files:**
- Create: `tests/exercises.test.mjs`
- Modify: `src/constants/exercises.ts`
- Modify: `src/components/workout/ExercisePicker.tsx`
- Modify: `src/screens/WorkoutScreen.tsx`
- Modify: `src/screens/RoutinesScreen.tsx`
- Modify: `src/screens/LibraryScreen.tsx`
- Modify: files reported by strict unused checks
- Modify: `SETUP_GUIDE.md`
- Modify: `docs/audits/2026-08-18-repo-audit.md`

**Interfaces:**
- Consumes: custom `Exercise[]` and the static exercise catalog.
- Produces: `mergeExerciseLibrary(custom): Exercise[]` and `ExercisePicker.exercises`.

- [x] **Step 1: Write the failing merge test**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeExerciseLibrary } from '../src/constants/exercises.ts';

test('custom exercises are available before the static catalog', () => {
  const custom = { id: 'custom_1', name: 'My Lift', muscleGroup: 'legs', equipment: 'Other' };
  const merged = mergeExerciseLibrary([custom]);
  assert.equal(merged[0], custom);
  assert.ok(merged.some((exercise) => exercise.id === 'bench_press'));
});
```

- [x] **Step 2: Run the test to verify RED**

Run: `npm test`

Expected: `mergeExerciseLibrary` is not exported.

- [x] **Step 3: Implement and route the shared source**

Add the pure merge helper, use it in Library and Routines, load custom exercises before opening the manual workout picker, and pass the merged list through an `exercises` prop.

- [x] **Step 4: Remove proven dead local code and refresh documentation**

Remove unused imports, locals, and the unused `now`. Keep larger public API deletions as report-only follow-up decisions. Rewrite the setup guide to describe the actual five tabs, kilograms, custom exercises, routines, clean-install/check commands, local data limitations, and the later EAS path.

- [x] **Step 5: Run final verification**

Run from a clean dependency state:

```bash
npm ci
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo-doctor
npx expo export --platform ios --output-dir <temporary-directory> --clear
npm audit
git diff --check
git status --short --branch
```

Expected: install, tests, typecheck, Expo Doctor, and iOS export pass; no whitespace errors; audit advisories are documented rather than force-downgraded.

- [x] **Step 6: Review and commit the final audit artifacts**

```bash
git add SETUP_GUIDE.md docs tests src app package.json package-lock.json app.json .gitignore tsconfig.json
git commit -m "docs: record gym app stabilization audit"
git log --oneline --decorate -8
```
