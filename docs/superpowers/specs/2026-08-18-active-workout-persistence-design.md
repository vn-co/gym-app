# Active Workout Persistence Design

**Date:** 2026-08-18
**Status:** Approved in conversation; written specification awaiting final review
**Scope:** Persist and recover one unfinished workout, with correct elapsed time across backgrounding and process termination.

## Context

The app currently keeps the active workout only in the in-memory Zustand store. Its timer increments `elapsedSeconds` from a JavaScript interval. Switching apps can suspend that interval, and a reload, crash, or iOS process termination removes the whole active session.

Completed workouts already have a separate, idempotent AsyncStorage save path. This design changes only the unfinished-workout lifecycle.

## Goals

- Preserve the active workout across app backgrounding, reloads, crashes, and process termination.
- Preserve its name, exercises, sets, weights, reps, completion state, and timer state.
- Keep a running workout running while the app is unfocused or terminated.
- Keep an explicitly paused workout paused while the app is unfocused or terminated.
- Restore before workout-dependent screens render, without redirecting the user.
- Avoid storage writes from the once-per-second display refresh.
- Keep the in-memory workout available and inform the user if persistence fails.
- Clear the persisted draft only after successful completion or explicit cancellation.

## Non-goals

- Completed-history backup, export, restore, or cloud synchronization.
- General migrations for the app's other storage collections.
- A background execution service, notification timer, or Live Activity.
- UI redesign beyond the minimum startup and error feedback needed for reliable restoration.
- Automatic expiry or cancellation of an old workout. An unfinished workout remains available until the user finishes or cancels it.

## User experience

### Normal backgrounding

Locking the phone or switching apps does not pause or reset the workout. When the app becomes active again, the displayed timer catches up from timestamps and the sets remain unchanged.

### Relaunch or crash recovery

The app restores the saved session before displaying workout-dependent content. It opens normally on the user's current/default route rather than forcing navigation. Home displays its existing **Continue Workout** entry, and opening Workout shows the recovered session.

### Explicit pause

Pressing Pause records the elapsed running period and marks the timer as paused. Time spent backgrounded or closed does not accumulate until Resume is pressed.

### Finish and cancel

Finishing saves the completed workout and personal records first. Only after both operations succeed does the app clear the in-memory and persisted active session. Because completed sessions are upserted by session ID, retrying a partial finish does not duplicate the workout.

Explicit cancellation keeps the existing confirmation dialog and then clears both copies of the active session.

### Failure feedback

A read, parse, write, or removal failure produces one actionable alert rather than silently claiming the draft is safe. The current in-memory workout remains usable. Later meaningful edits retry persistence. A hydration failure does not leave the app stuck on its startup gate.

## Selected approach

Use Zustand's installed `persist` middleware with AsyncStorage, a versioned active-session payload, and a small storage adapter that preserves write ordering and reports failures.

This is preferred over manual per-action storage orchestration because it keeps persistence attached to the store boundary and avoids duplicating every mutation. It is preferred over an iOS background timer because elapsed time can be derived accurately without background execution, battery cost, permissions, or platform-specific services.

The middleware will persist only the `session` slice. Hydration flags, transient display time, and error presentation state remain outside the persisted payload.

## Active-session model

The active timer uses exact timestamps and accumulated milliseconds:

```ts
interface ActiveSession {
  sessionId: string;
  workoutName: string;
  startTime: number;
  accumulatedMilliseconds: number;
  runningSince: number | null;
  exercises: WorkoutExercise[];
}
```

`runningSince` is the wall-clock timestamp at which the current running period began. A non-null value means the workout is running; `null` means it is paused. This replaces the redundant `elapsedSeconds`, `isRunning`, and `isPaused` fields.

Elapsed milliseconds at a supplied time are:

```text
accumulatedMilliseconds
+ max(0, now - runningSince) when runningSince is not null
```

The UI floors that value to seconds for display. Workout completion uses the same calculation, preventing the displayed duration and saved duration from disagreeing.

Pause adds the current running period to `accumulatedMilliseconds` and sets `runningSince` to `null`. Resume sets `runningSince` to the current timestamp without changing the accumulated value.

## Persistence lifecycle

- Use one unique AsyncStorage key for the active-session store.
- Set persistence version `1` and reject payloads that do not contain either `null` or a structurally valid active session.
- Persist immediately after starting a workout or routine and after exercise, set, pause, or resume mutations.
- Do not mutate the store for timer display ticks, so the one-second UI refresh cannot trigger storage writes.
- Serialize asynchronous writes in call order so a slower old write cannot overwrite newer workout state.
- On cancellation or successful completion, remove/replace the persisted session with `null` through the same ordered path.
- Keep only one active session. Existing guards continue preventing a second workout from replacing it.

## Startup and hydration

Automatic middleware hydration is disabled. The root startup boundary explicitly requests rehydration and withholds the navigator until that attempt settles. This prevents Home from briefly showing **Start Empty Workout** before changing to **Continue Workout**.

Successful hydration merges only the stored session into the current store actions. Missing storage means no active workout. Invalid or unreadable storage completes startup with no restored session and reports the failure; it never blocks the app indefinitely.

The startup boundary does not navigate after hydration. Existing Home and Workout selectors react to the restored store state.

## Timer rendering

The timer hook owns a transient `now` value and refreshes it once per second only while a session is running and visible. It calculates display seconds through a pure elapsed-time helper. When React Native suspends timers in the background, no data is lost: the next refresh uses the current wall clock and catches up immediately.

The hook also refreshes when the app returns to the active state so the first foreground render does not wait for the next interval tick.

## Error handling

- Storage adapter failures are captured and reported without creating a recursive persistence write.
- Repeated failures of the same operation are coalesced so the user is not flooded with alerts while typing.
- A later successful write clears the transient failure state.
- Corrupt persisted active-session data is not interpreted as a valid empty session.
- Finishing errors retain the active session, matching the existing completed-workout safety behavior.

## Test strategy

Pure deterministic tests will cover:

- Running elapsed time includes time spent backgrounded or terminated.
- Paused elapsed time does not grow.
- Pause and resume preserve accumulated milliseconds.
- Backward wall-clock movement cannot create negative duration.
- The completed duration uses the same elapsed calculation as the display.
- The active-session payload accepts valid running, paused, and null states and rejects malformed data.

Store and persistence tests will cover:

- Empty and routine workouts persist after creation.
- Exercise and set mutations persist.
- Hydration restores running and paused sessions.
- Hydration completes after missing, corrupt, or unreadable storage.
- Ordered writes leave the newest state in storage.
- Timer display updates do not persist once per second.
- Explicit cancellation clears the draft.
- Successful finish clears the draft, while a failed finish retains it.

Project verification remains:

```bash
npm ci
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo-doctor
npx expo export --platform ios --output-dir <temporary-directory> --clear
git diff --check
```

## Delivery boundary

This phase ends when the persistence behavior is implemented, verified, and committed to local `main`. It does not start backup/export or the UI redesign. Those remain separate reviewed phases.
