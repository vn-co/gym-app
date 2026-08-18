# Active Workout Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve one unfinished workout and its correct timer across backgrounding, reloads, crashes, and iOS process termination.

**Architecture:** Replace interval-counted elapsed state with accumulated milliseconds plus a running timestamp. Persist only the active-session slice through Zustand's existing persist middleware, using versioned validation, ordered AsyncStorage writes, explicit startup hydration, and non-recursive failure reporting.

**Tech Stack:** Expo 57, React Native 0.86, TypeScript 6, Zustand 5 persist middleware, AsyncStorage 2.2, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-08-18-active-workout-persistence-design.md`

## Global Constraints

- Persist and recover at most one unfinished workout.
- Keep a running workout running while the app is backgrounded or terminated; keep an explicitly paused workout paused.
- Restore before workout-dependent screens render, but never redirect after hydration.
- Persist meaningful workout mutations, never one-second display refreshes.
- Clear the draft only after successful completed-workout and personal-record writes or explicit cancellation.
- Keep an in-memory session available and show one actionable alert when active-session persistence fails.
- Do not add a background service, cloud synchronization, backup/export, or UI redesign in this phase.
- Commit each completed task to local `main`; push `main` only after the final verification gate passes.

---

## File Map

- Create `src/store/activeSessionTimer.ts`: pure elapsed-time, pause, and resume calculations.
- Create `src/store/activeSessionPersistence.ts`: payload validation, persistence issue signal, and ordered state-storage adapter.
- Create `src/components/WorkoutPersistenceGate.tsx`: explicit hydration gate and user-facing persistence alerts.
- Create `src/services/finishActiveWorkout.ts`: testable completion workflow that clears only after both durable writes succeed.
- Modify `src/types/index.ts`: replace redundant timer fields in `ActiveSession` and add the active-session storage key.
- Modify `src/store/workoutStore.ts`: timestamp lifecycle, store factory, versioned Zustand persistence, and session-only partialization.
- Modify `src/hooks/useWorkoutTimer.ts`: derive display time from the wall clock and refresh on foreground activation.
- Modify `src/components/workout/SessionHeader.tsx`: display derived time and infer pause state from `runningSince`.
- Modify `src/screens/WorkoutScreen.tsx`: remove foreground tick ownership and use the completion workflow.
- Modify `app/_layout.tsx`: hold navigation behind active-session hydration.
- Modify `tests/workoutStore.test.mjs`: use injected memory storage instead of production native storage.
- Create `tests/activeSessionTimer.test.mjs`: deterministic timer transition tests.
- Create `tests/activeSessionPersistence.test.mjs`: payload, ordering, hydration, mutation, and clearing tests.
- Create `tests/finishActiveWorkout.test.mjs`: completion success/failure tests.
- Modify `SETUP_GUIDE.md` and `docs/audits/2026-08-18-repo-audit.md`: document the resolved risk.

---

### Task 1: Timestamp-based active-workout timer

**Files:**
- Create: `src/store/activeSessionTimer.ts`
- Modify: `src/types/index.ts`
- Modify: `src/store/workoutStore.ts`
- Modify: `src/hooks/useWorkoutTimer.ts`
- Modify: `src/components/workout/SessionHeader.tsx`
- Modify: `src/screens/WorkoutScreen.tsx`
- Create: `tests/activeSessionTimer.test.mjs`
- Modify: `tests/workoutStore.test.mjs`

**Interfaces:**
- Produces: `getElapsedMilliseconds(session: ActiveSession, now: number): number`
- Produces: `getElapsedSeconds(session: ActiveSession, now: number): number`
- Produces: `pauseActiveSession(session: ActiveSession, now: number): ActiveSession`
- Produces: `resumeActiveSession(session: ActiveSession, now: number): ActiveSession`
- Produces: `useWorkoutTimer(session: ActiveSession | null): number`
- Replaces: `elapsedSeconds`, `isRunning`, `isPaused`, and `tickSecond`

- [x] **Step 1: Write failing deterministic timer tests**

Create `tests/activeSessionTimer.test.mjs` with:

~~~js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getElapsedMilliseconds,
  getElapsedSeconds,
  pauseActiveSession,
  resumeActiveSession,
} from '../src/store/activeSessionTimer.ts';

const running = {
  sessionId: 'session_1',
  workoutName: 'Push',
  startTime: 1_000,
  accumulatedMilliseconds: 2_500,
  runningSince: 5_000,
  exercises: [],
};

test('derives running time from timestamps', () => {
  assert.equal(getElapsedMilliseconds(running, 8_500), 6_000);
  assert.equal(getElapsedSeconds(running, 8_500), 6);
});

test('pause and resume preserve exact accumulated time', () => {
  const paused = pauseActiveSession(running, 8_500);
  assert.equal(paused.accumulatedMilliseconds, 6_000);
  assert.equal(paused.runningSince, null);
  assert.equal(getElapsedMilliseconds(paused, 20_000), 6_000);

  const resumed = resumeActiveSession(paused, 20_000);
  assert.equal(resumed.accumulatedMilliseconds, 6_000);
  assert.equal(resumed.runningSince, 20_000);
  assert.equal(getElapsedMilliseconds(resumed, 21_250), 7_250);
});

test('backward clock movement never creates negative duration', () => {
  assert.equal(getElapsedMilliseconds(running, 4_000), 2_500);
});
~~~

- [x] **Step 2: Run the timer test to verify RED**

Run: `npx tsx --test tests/activeSessionTimer.test.mjs`

Expected: FAIL because `src/store/activeSessionTimer.ts` does not exist.

- [x] **Step 3: Implement the timer model and pure transitions**

Replace `ActiveSession` with:

~~~ts
export interface ActiveSession {
  sessionId: string;
  workoutName: string;
  startTime: number;
  accumulatedMilliseconds: number;
  runningSince: number | null;
  exercises: WorkoutExercise[];
}
~~~

Create `activeSessionTimer.ts`:

~~~ts
import type { ActiveSession } from '../types';

export function getElapsedMilliseconds(
  session: ActiveSession,
  now: number,
): number {
  const currentPeriod =
    session.runningSince === null
      ? 0
      : Math.max(0, now - session.runningSince);
  return session.accumulatedMilliseconds + currentPeriod;
}

export function getElapsedSeconds(
  session: ActiveSession,
  now: number,
): number {
  return Math.floor(getElapsedMilliseconds(session, now) / 1000);
}

export function pauseActiveSession(
  session: ActiveSession,
  now: number,
): ActiveSession {
  if (session.runningSince === null) return session;
  return {
    ...session,
    accumulatedMilliseconds: getElapsedMilliseconds(session, now),
    runningSince: null,
  };
}

export function resumeActiveSession(
  session: ActiveSession,
  now: number,
): ActiveSession {
  if (session.runningSince !== null) return session;
  return { ...session, runningSince: now };
}
~~~

Capture one `now` for each new session and use it for both `startTime` and `runningSince`. Initialize `accumulatedMilliseconds` to zero. Route pause/resume through the helpers and delete `tickSecond`.

Refactor `useWorkoutTimer` to accept the session, keep a transient `now`, update once per second only while running, and refresh immediately from an `AppState` listener when the state becomes `active`. Return derived seconds without mutating Zustand.

Call the hook from `SessionHeader`, infer paused state from `runningSince === null`, remove the hook call from `WorkoutScreen`, and calculate the temporary completion duration through `getElapsedSeconds(session, endTime)`.

- [x] **Step 4: Extend the routine-default test**

Keep the exercise-default assertions and add:

~~~js
assert.equal(typeof store.getState().session?.runningSince, 'number');
assert.equal(store.getState().session?.accumulatedMilliseconds, 0);
~~~

- [x] **Step 5: Verify GREEN and commit**

Run:

~~~bash
npx tsx --test tests/activeSessionTimer.test.mjs tests/workoutStore.test.mjs
npm run typecheck
git diff --check
~~~

Expected: timer and store tests pass, TypeScript passes, and no whitespace errors are reported.

~~~bash
git add src/types/index.ts src/store/activeSessionTimer.ts src/store/workoutStore.ts src/hooks/useWorkoutTimer.ts src/components/workout/SessionHeader.tsx src/screens/WorkoutScreen.tsx tests/activeSessionTimer.test.mjs tests/workoutStore.test.mjs
git commit -m "fix: make active workout timing lifecycle-safe"
~~~

---

### Task 2: Versioned persistence, ordered writes, and startup hydration

**Files:**
- Create: `src/store/activeSessionPersistence.ts`
- Create: `src/components/WorkoutPersistenceGate.tsx`
- Modify: `src/types/index.ts`
- Modify: `src/store/workoutStore.ts`
- Modify: `app/_layout.tsx`
- Modify: `tests/workoutStore.test.mjs`
- Create: `tests/activeSessionPersistence.test.mjs`

**Interfaces:**
- Consumes: timestamp-based `ActiveSession` from Task 1
- Produces: `STORAGE_KEYS.ACTIVE_SESSION = 'gym_active_session'`
- Produces: `parsePersistedWorkoutState(value: unknown): { session: ActiveSession | null }`
- Produces: `createOrderedStateStorage(base, callbacks): { storage; flush }`
- Produces: `createWorkoutStore(storage, callbacks)`
- Produces: stable `subscribePersistenceIssue` and `getPersistenceIssueSnapshot`

- [ ] **Step 1: Write failing validation and ordering tests**

Create `tests/activeSessionPersistence.test.mjs`. Assert valid running, paused, and null payloads parse. Assert missing fields, negative accumulated time, malformed exercises, and invalid JSON hydration are rejected or reported.

Use a fake async string storage whose first write waits on a controlled promise. Queue `old` and `new`, release the first write, flush, and assert `new` remains:

~~~js
test('ordered storage leaves the newest write in place', async () => {
  const ordered = createOrderedStateStorage(delayedStorage, callbacks);
  const first = ordered.storage.setItem('key', 'old');
  const second = ordered.storage.setItem('key', 'new');
  releaseFirstWrite();
  await Promise.all([first, second]);
  await ordered.flush();
  assert.equal(await delayedStorage.getItem('key'), 'new');
});
~~~

Also make a write reject twice with the same error and assert the issue signal changes only once. Then allow a write to succeed and assert the issue snapshot clears.

- [ ] **Step 2: Run the persistence test to verify RED**

Run: `npx tsx --test tests/activeSessionPersistence.test.mjs`

Expected: FAIL because the persistence module and exported interfaces do not exist.

- [ ] **Step 3: Implement validation and the ordered adapter**

Add `ACTIVE_SESSION: 'gym_active_session'` to `STORAGE_KEYS`.

Validate finite non-negative timestamps, strings, arrays, each workout exercise, and every set. Return `{ session: null }` only for an explicit null session. Throw `Error('Invalid active session data')` for malformed state.

Implement one ordered promise tail:

~~~ts
export function createOrderedStateStorage(
  base: StateStorage<Promise<void>>,
  callbacks: PersistenceCallbacks,
) {
  let tail = Promise.resolve();

  const enqueue = (
    operation: 'write' | 'remove',
    work: () => Promise<void>,
  ) => {
    const result = tail.then(async () => {
      try {
        await work();
        callbacks.onRecovered();
      } catch (error) {
        callbacks.onIssue(operation, error);
      }
    });
    tail = result;
    return result;
  };

  return {
    storage: {
      async getItem(name: string) {
        try {
          const value = await base.getItem(name);
          callbacks.onRecovered();
          return value;
        } catch (error) {
          callbacks.onIssue('read', error);
          throw error;
        }
      },
      setItem: (name: string, value: string) =>
        enqueue('write', () => base.setItem(name, value)),
      removeItem: (name: string) =>
        enqueue('remove', () => base.removeItem(name)),
    },
    flush: () => tail,
  };
}
~~~

Keep one module-level `PersistenceIssue | null` snapshot. Coalesce identical unresolved operation/message pairs, increment its ID only for a new issue, notify subscribers on change, and clear after a successful storage operation. This signal must never update Zustand.

- [ ] **Step 4: Wrap the store in versioned persistence**

Export `createWorkoutStore(stateStorage, callbacks)` and use it for the production `useWorkoutStore` with AsyncStorage. Configure:

~~~ts
{
  name: STORAGE_KEYS.ACTIVE_SESSION,
  version: 1,
  storage: createJSONStorage(() => ordered.storage),
  partialize: (state) => ({ session: state.session }),
  skipHydration: true,
  merge: (persisted, current) => ({
    ...current,
    ...parsePersistedWorkoutState(persisted),
  }),
  migrate: () => {
    throw new Error('Unsupported active session version');
  },
  onRehydrateStorage: () => (_state, error) => {
    if (error) reportPersistenceIssue('read', error);
  },
}
~~~

Update `tests/workoutStore.test.mjs` to build a store with in-memory string storage, avoiding production native storage calls in Node.

- [ ] **Step 5: Add explicit hydration and failure feedback**

Create `WorkoutPersistenceGate`. On mount, call `useWorkoutStore.persist.rehydrate()` and set local `ready` in `finally`, including errors. Subscribe to the external issue snapshot with `useSyncExternalStore`.

Alert once per issue ID with title **Couldn't protect active workout** and message **Your workout is still available in this open app, but its latest changes may not survive closing it. Keep the app open and try another edit.**

Before readiness, render a full-flex view using `Colors.bg`. After readiness, render children. Wrap the root `Stack` with this gate inside `SafeAreaProvider`. Never navigate from the gate.

- [ ] **Step 6: Add integration assertions**

Using memory storage and the exported factory, assert:

- empty and routine workouts persist version `1`;
- exercise and set mutations persist the latest values;
- a second store restores running and paused sessions;
- missing storage restores `null` without an issue;
- corrupt JSON settles hydration, keeps `session: null`, and reports one read issue;
- cancel persists `session: null`;
- repeated elapsed-time calculations do not increase the write count.

- [ ] **Step 7: Verify GREEN and commit**

Run:

~~~bash
npx tsx --test tests/activeSessionPersistence.test.mjs tests/workoutStore.test.mjs
npm run typecheck
git diff --check
~~~

Expected: persistence and store tests pass, TypeScript passes, and no whitespace errors are reported.

~~~bash
git add app/_layout.tsx src/types/index.ts src/store/workoutStore.ts src/store/activeSessionPersistence.ts src/components/WorkoutPersistenceGate.tsx tests/activeSessionPersistence.test.mjs tests/workoutStore.test.mjs
git commit -m "feat: restore unfinished workouts after relaunch"
~~~

---

### Task 3: Durable completion boundary

**Files:**
- Create: `src/services/finishActiveWorkout.ts`
- Modify: `src/screens/WorkoutScreen.tsx`
- Create: `tests/finishActiveWorkout.test.mjs`

**Interfaces:**
- Consumes: `getElapsedSeconds` from Task 1
- Produces: `finishActiveWorkout(session, endTime, dependencies): Promise<WorkoutSession>`
- Dependencies: `saveSession`, `updatePersonalRecords`, and `clearActiveSession`

- [ ] **Step 1: Write failing success and failure tests**

Create a running session with one completed `60 kg × 8` set, `2_000` accumulated milliseconds, and `runningSince: 10_000`. Finish at `13_500` and assert duration `5`, volume `480`, one set, both writes called in order, and clear called last.

Make session save reject and assert clear is not called. Make personal-record update reject after session save and assert clear is still not called.

~~~js
await assert.rejects(
  finishActiveWorkout(active, 13_500, {
    saveSession: async () => {
      throw new Error('disk full');
    },
    updatePersonalRecords: async () => {},
    clearActiveSession: () => calls.push('clear'),
  }),
  /disk full/,
);
assert.deepEqual(calls, []);
~~~

- [ ] **Step 2: Run the completion test to verify RED**

Run: `npx tsx --test tests/finishActiveWorkout.test.mjs`

Expected: FAIL because `finishActiveWorkout` does not exist.

- [ ] **Step 3: Implement completion and simplify the screen**

Build the completed `WorkoutSession` with `getElapsedSeconds(session, endTime)`, completed-set volume, and completed-set count. Execute in this order:

~~~ts
await dependencies.saveSession(completed);
await dependencies.updatePersonalRecords(completed);
dependencies.clearActiveSession();
return completed;
~~~

Call this workflow from the confirmed Finish handler, passing the existing storage functions and `cancelSession`. Keep the existing catch alert and remove duplicated total construction from the screen.

- [ ] **Step 4: Verify GREEN and commit**

Run:

~~~bash
npx tsx --test tests/finishActiveWorkout.test.mjs
npm run check
git diff --check
~~~

Expected: completion tests and the full existing suite pass.

~~~bash
git add src/services/finishActiveWorkout.ts src/screens/WorkoutScreen.tsx tests/finishActiveWorkout.test.mjs
git commit -m "fix: retain active workout until finish is durable"
~~~

---

### Task 4: Documentation, verification, and publication

**Files:**
- Modify: `SETUP_GUIDE.md`
- Modify: `docs/audits/2026-08-18-repo-audit.md`
- Modify: `docs/superpowers/plans/2026-08-18-active-workout-persistence.md`

**Interfaces:**
- Consumes: Tasks 1–3
- Produces: verified recovery behavior and accurate documentation on GitHub `main`

- [ ] **Step 1: Refresh documentation**

State that unfinished workouts restore after process termination, running time catches up from timestamps, and paused time remains paused. Remove the obsolete memory-only limitation. Keep backup/export/import deferred.

Add a dated audit follow-up recording timestamp timing, versioned session persistence, startup hydration, ordered writes, failure feedback, and regression coverage.

- [ ] **Step 2: Mark completed plan checkboxes**

Change each completed `- [ ]` to `- [x]` only after its command and expected outcome have been observed.

- [ ] **Step 3: Run the clean final gate**

Run:

~~~bash
npm ci --no-fund
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo-doctor
$exportPath = Join-Path $env:TEMP ("gym-app-active-persistence-" + [guid]::NewGuid().ToString('N'))
npx expo export --platform ios --output-dir $exportPath --clear
npm audit --omit=dev
git diff --check
git status --short --branch
~~~

Expected: clean install, TypeScript, all regression tests, all Expo Doctor checks, and iOS export pass. Report known transitive advisories without forcing a breaking downgrade.

- [ ] **Step 4: Commit documentation**

~~~bash
git add SETUP_GUIDE.md docs/audits/2026-08-18-repo-audit.md docs/superpowers/plans/2026-08-18-active-workout-persistence.md
git commit -m "docs: document active workout recovery"
~~~

- [ ] **Step 5: Verify and push `main`**

Run:

~~~bash
git status --porcelain=v1
git log --oneline --decorate origin/main..main
git push origin main
git ls-remote origin refs/heads/main
git rev-parse main
~~~

Expected: the worktree is clean before push, the push succeeds without force, and local and remote `main` hashes match exactly.
