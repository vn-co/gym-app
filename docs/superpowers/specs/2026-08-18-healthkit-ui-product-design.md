# Gym App HealthKit and Product UI Design

**Date:** 2026-08-18
**Status:** Approved direction; written specification awaiting user review
**Platform:** iPhone, iOS only
**Scope:** Add an iPhone-led Apple Health workout integration and redesign the complete product around the approved dark editorial training system.

## Product intent

The app is a private, local-first gym tracker for one person. It should combine precise strength-training records with the useful parts of Apple Health: daily activity, live workout heart rate, active calories, completed workout records, and Apple Fitness contribution.

The result should feel like a coherent iPhone product rather than a collection of dark cards. At rest, the interface is calm and editorial. During training, it becomes compact and instrumental. After training, it becomes a detailed but satisfying record.

## Goals

- Start, monitor, pause, resume, and finish a strength workout from this app.
- Use HealthKit to collect live elapsed time, active energy, and heart rate when the connected hardware and permissions make them available.
- Allow AirPods Pro 3 to act as the external heart-rate source through HealthKit without implementing a device-specific Bluetooth connection.
- Save one completed workout to Apple Health and Apple Fitness without duplicates.
- Keep weights, repetitions, routines, records, and workout history local to the app.
- Preserve the active local workout if the app backgrounds, crashes, reloads, or is terminated.
- Keep workout logging fully usable when HealthKit is unavailable or declined.
- Redesign Home, Workout, Routines, Progress, Library, and the completion experience under one visual system.
- Let the user correct sets, replace exercises, reorder exercises, and change a workout while it is active.
- Preserve existing saved data through versioned migrations.
- Deliver verified work in reviewable commits directly to `main`, as explicitly requested.

## Non-goals

- No account, remote server, social feed, trainer marketplace, or cloud subscription.
- No custom calorie algorithm. HealthKit is the source for Health workout energy estimates.
- No invented readiness, recovery, or health score.
- No direct Bluetooth implementation for AirPods.
- No Apple Watch companion in this product phase.
- No Android implementation.
- No nutrition, sleep coaching, AI recommendations, or medical interpretation.
- No replacement for Apple Health as the system health record.
- No requirement that HealthKit permission be granted before a local workout can start.

## Decisions

### 1. iPhone-led workout

The gym app owns the workout lifecycle. Starting a workout creates both the existing local active session and, when available, an iPhone HealthKit workout session configured for traditional strength training.

The user does not need to start a second workout in Apple Fitness. On successful completion, the HealthKit workout appears in Apple Health and Apple Fitness and contributes according to Apple's rules.

### 2. Narrow local Expo module

Use a local, iOS-only Expo module written in Swift with the Expo Modules API. It exposes only the HealthKit operations this product needs.

The dependency preflight found maintained React Native HealthKit libraries that are suitable for general authorization, query, subscription, and sample-writing work. The required product boundary is narrower and more specialized: an iPhone `HKWorkoutSession` with `HKLiveWorkoutBuilder`, its delegates, state transitions, live statistics, and idempotent finish behavior. Adding a broad binding and then a second custom layer for the missing live lifecycle would increase dependencies and split ownership.

The local module therefore talks directly to Apple's HealthKit APIs. Generated `ios/` files remain generated; capability and usage configuration lives in the Expo app configuration so clean prebuilds reproduce it.

Expo Go cannot load this native module. Development and physical testing use a custom development build.

### 3. Local data remains authoritative for gym details

HealthKit owns the official workout sample and health metrics. The app's local storage owns:

- routine and exercise identity;
- sets, weights, repetitions, and completion state;
- total training volume;
- personal-record calculations;
- workout ordering and edits;
- the link to the saved HealthKit workout;
- a compact snapshot of the metrics required to render local history.

HealthKit does not become the database for routines or lifting details.

### 4. No artificial “Current State” score

Home uses the title **Today**, not a score that implies recovery or readiness. It displays real HealthKit values when available:

- active calories;
- exercise minutes;
- steps;
- this week's completed workouts;
- the most recent local workout.

Apple-provided Move and Exercise goals may be shown when an activity summary provides them. Steps remain a factual count unless the app later gains an explicit user-configured step goal. Missing data is displayed as unavailable, not as zero.

### 5. HealthKit enhances but never blocks

The local workout flow always works. A user who denies Health access can still log, recover, edit, and finish a complete workout. Health problems appear as concise state and retry actions, not repeated modal alerts.

## System architecture

The product has four clear layers:

1. **Native HealthKit module** — owns authorization, activity queries, the native workout session, live statistics, native session state, and the final HealthKit workout UUID.
2. **Health service adapter** — presents a typed TypeScript API, normalizes native events, and provides an unavailable implementation for unsupported environments.
3. **Workout domain/store** — owns the local active session, persistence, exercise edits, completion transaction, records, and the link between local and HealthKit workout IDs.
4. **Screens and components** — render domain state and call domain actions; they do not access HealthKit or AsyncStorage directly.

The native and local workout lifecycles are coordinated but not fused. A HealthKit failure cannot corrupt or discard a local workout.

## Native module contract

The module exposes a deliberately small interface:

```ts
type HealthAvailability = 'available' | 'unavailable';

type HealthWorkoutState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'ending'
  | 'ended'
  | 'failed';

interface LiveHealthMetrics {
  elapsedSeconds: number;
  activeEnergyKilocalories: number | null;
  heartRateBpm: number | null;
  averageHeartRateBpm: number | null;
  maximumHeartRateBpm: number | null;
  capturedAt: number;
}

interface FinishedHealthWorkout {
  workoutUuid: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  activeEnergyKilocalories: number | null;
  averageHeartRateBpm: number | null;
  maximumHeartRateBpm: number | null;
}

isHealthDataAvailable(): Promise<boolean>;
requestAuthorization(): Promise<void>;
readTodayActivity(): Promise<TodayActivity>;
startWorkout(localSessionId: string, startedAt: number): Promise<void>;
pauseWorkout(): Promise<void>;
resumeWorkout(): Promise<void>;
finishWorkout(): Promise<FinishedHealthWorkout>;
discardWorkout(): Promise<void>;
getWorkoutState(): Promise<HealthWorkoutState>;
```

It emits two event streams:

- native workout state changes;
- throttled live metric updates.

The Swift module retains the `HKHealthStore`, `HKWorkoutSession`, `HKLiveWorkoutBuilder`, and delegates for the life of an active native session. It ignores duplicate start, pause, resume, finish, and discard commands when they are already satisfied, or returns a typed state error when ignoring would hide a real mismatch.

### HealthKit data types

Request only the types required by this product.

Read access:

- workouts;
- heart rate;
- active energy burned;
- step count;
- Apple exercise time;
- activity summaries when available.

Share access:

- workouts;
- active energy burned samples required for workout construction.

The user-facing permission explanation says that access is used to show daily activity, display live workout metrics, and save completed strength workouts. It does not claim that the app can determine whether read permission was denied; HealthKit intentionally protects that information.

## Workout lifecycle and data flow

### Starting

1. The user starts an empty workout or a routine.
2. The local store creates and persists the active session first.
3. If HealthKit has already been enabled, the coordinator asks the native module to start a traditional strength-training workout using the same start timestamp.
4. If native start succeeds, the local session records `healthState: running`.
5. If native start fails or permission is unavailable, the local workout continues with `healthState: unavailable` or `failed` and a non-blocking retry action.

The app never creates a second local session merely because HealthKit start is retried.

### Running

- Existing timestamp-derived local elapsed time remains the persistence-safe clock for local recovery.
- The native builder supplies HealthKit elapsed time, active energy, and heart-rate statistics.
- The UI uses native elapsed time while the native session is healthy and otherwise uses the local elapsed calculation.
- Live metrics are transient UI state. Only a compact, rate-limited heart-rate series and latest summary values are persisted, avoiding a storage write for every sensor callback.
- HealthKit handles the paired external heart-rate source. The app labels the metric **Heart rate** rather than asserting that AirPods are the source unless the platform can verify that source reliably.

### Backgrounding and interruption

- Locking the iPhone or switching apps does not cancel the local workout.
- The native session handles the background behavior permitted by iOS and reports native interruptions through its state delegate.
- Returning to the app reconciles local and native states before offering native controls.
- A JavaScript crash or iOS process termination preserves the local workout through the existing persisted store.
- The product does not promise that a user force-quit can keep a native sensor session alive. On relaunch it recovers local logging, checks native/HealthKit state, and prevents duplicate saves.

### Pausing and resuming

The local state transition is persisted and the matching native command is attempted. A native command failure is reported but does not silently reverse a valid local transition. Reconciliation offers a retry or a local-only continuation.

### Finishing

Finishing is an explicit transaction:

1. Validate that the local workout can be completed.
2. Freeze new set mutations and calculate the local workout result.
3. If a native HealthKit session is active, end collection and finish it once.
4. Capture the HealthKit workout UUID and final metrics when successful.
5. Save or upsert the completed local session and personal records by local session ID.
6. Store the HealthKit link and sync status on that completed local session.
7. Clear the persisted active session only after the local completed session is safe.
8. Navigate to the completion screen using the saved local session.

If local saving fails, the active local session remains recoverable. If Apple Health saving fails but local saving succeeds, the completed workout is retained with `healthSyncStatus: failed` and can be retried without creating a duplicate local workout. If the HealthKit workout was created but its UUID was not returned because of an interruption, reconciliation queries the narrow time window and app metadata before retrying creation.

### Cancellation

Cancellation remains destructive and confirmed. It discards the local active session and asks the native module to discard rather than save the native workout. A native discard error is reported, but the app first confirms the intended user action and prevents accidental later completion.

## Local model changes

The active session adds an optional HealthKit coordination block:

```ts
interface ActiveHealthWorkout {
  state: 'notRequested' | 'starting' | 'running' | 'paused' | 'interrupted' | 'failed';
  startedAt: number | null;
  lastMetrics: HealthMetricSummary | null;
  heartRateSeries: HeartRatePoint[];
  errorCode: string | null;
}
```

The completed session adds:

```ts
interface CompletedHealthWorkout {
  syncStatus: 'notRequested' | 'saved' | 'failed';
  workoutUuid: string | null;
  activeEnergyKilocalories: number | null;
  averageHeartRateBpm: number | null;
  maximumHeartRateBpm: number | null;
  heartRateSeries: HeartRatePoint[];
  lastSyncErrorCode: string | null;
}
```

The existing session ID remains the idempotency key for local completion. The native workout receives that local ID as app metadata, enabling narrow reconciliation. Existing saved sessions migrate with no HealthKit block and render normally.

Heart-rate chart points are downsampled to a stable local ceiling suitable for one workout summary. The app does not need to mirror every raw HealthKit sample.

## Product navigation

Retain the five existing top-level destinations:

1. Home
2. Workout
3. Routines
4. Progress
5. Library

Use the stable Expo Router tabs implementation and the existing `BlurView` foundation. The tab dock is visually floating but remains accessible, safe-area aware, and predictable. Workout completion remains within the Workout destination rather than being moved to Progress.

## Visual system

### Character

- Near-black background with graphite surfaces rather than pure black everywhere.
- Spring-lime accent used for focus, progress, completion, and primary action.
- Soft olive and grey supporting tones.
- Editorial serif for major numbers and reflective moments.
- iOS system sans serif for logging, controls, labels, and dense data.
- Restrained ambient lime light behind important regions, never a glow around every card.
- Moderate 14–20 point corner radii; controls remain tactile without looking inflated.
- Quiet one-pixel borders and spacing replace excessive nested cards.

Bundle one licensed display font through `expo-font`; use the system font everywhere else. Use the already-installed SVG support for internal icons and glow layers. Use built-in React Native animation plus `expo-haptics` for short functional feedback. Do not add a general UI kit or animation framework.

### Motion

- Set completion receives a short check/tint transition and light haptic.
- Numeric changes do not animate in a way that delays repeated entry.
- Exercise insertion, removal, replacement, and reorder settle with brief layout motion.
- Live metric changes crossfade or count gently; they do not bounce continuously.
- Completion uses one restrained entrance sequence.
- Reduce Motion removes scale and layout motion while retaining visible state changes.

## Screen requirements

### Home — Today

Home is a calm overview, not a dashboard full of equal cards.

Order:

1. **Today** heading and date.
2. Continue-workout control when a session is active.
3. One activity composition showing active calories, exercise minutes, and steps.
4. Last workout with duration, total volume, and calories when available.
5. Weekly local workout consistency.
6. Small Health connection state and permission action when needed.

If an Apple goal is available, its metric may show progress toward that goal. Missing permission or no samples uses an explicit unavailable/empty state. It never displays misleading zero values or a fake combined score.

### Workout start

- Start an empty workout.
- Start a saved routine.
- Name the workout or accept a sensible default.
- Resume an existing active workout instead of replacing it.
- Make routine selection quick without duplicating the full Routines screen.

### Active workout

The active screen must feel like a precise training instrument, not a stack of generic rounded cards.

Structure:

1. A clean top header with workout name, progress, and a visible **Edit** action.
2. One full-width live strip for time, active calories, and heart rate. Metrics share one alignment system.
3. One dominant active-exercise surface.
4. Sets form a compact ledger with aligned set number, kilograms, repetitions, and completion control.
5. Completed sets become quieter rather than visually louder than the current set.
6. Upcoming exercises appear as a restrained queue, separated primarily by typography and spacing.
7. Add exercise and Finish workout remain reachable above the tab dock.

The active exercise uses a single soft surface and moderate radius. Individual set rows are not separate floating cards. Inputs use tabular numerals, clear focus, generous tap targets, and a numeric keyboard. The current row gains the strongest contrast; surrounding rows recede.

Editing behavior:

- Tapping a weight or repetition value edits it directly.
- Each exercise menu offers Replace, Reorder, and Delete.
- The top Edit action enters full-workout organization mode.
- Organization mode supports drag reorder and explicit deletion without relying on hidden swipe gestures.
- Replace opens the exercise library, preserves the position, and asks whether existing sets should be kept only when they are structurally compatible; the safe default is to start the replacement with fresh sets.
- Add and delete set remain available within the active exercise.
- Destructive changes require confirmation when completed data would be lost.

### Workout completion

The completion screen includes:

- Workout complete title and workout name.
- Duration, active calories, and average heart rate in one consistently aligned metric row.
- Total volume in a rounded summary surface.
- Neutral comparison against the most recent comparable workout with the same routine identity, falling back to the same normalized workout name. Positive and negative values use neutral language.
- Specific personal-record callouts such as **New PR · Bench Press · 90 kg × 6**.
- Heart-rate chart with average and maximum values when data exists.
- Detailed exercise breakdown including working sets, exercise volume, and best set.
- Apple Health state: Saved, Not connected, or Save failed with retry.
- Close and share controls that never overlap the title or system safe areas.

The screen does not call volume change an achievement. Personal records are the celebratory event.

### Routines

- Preserve create, edit, delete, and start behavior.
- Use a quieter list with strong routine names and useful exercise previews.
- Allow exercise order and target sets to be edited explicitly.
- Keep routine editing separate from editing the current workout: changing an active workout does not silently mutate its source routine.

### Progress

- Continue to show local workout history and personal records.
- Add Health summary fields when present without hiding older local-only sessions.
- Show volume trends and comparable-workout context using local data.
- Open a detailed completed-workout view with the same exercise breakdown used by completion.
- Do not become the destination for the immediate completion screen.

### Library

- Preserve search and exercise categories.
- Use the new design tokens and row system.
- Remain the shared selector for routine building, starting, adding, and replacing exercises.

## Error and empty states

### Health availability

- **Unsupported environment:** explain that Health requires the installed iPhone development or production build; local workouts remain enabled.
- **Not requested:** show one contextual Connect Apple Health action.
- **Permission request completed:** proceed without claiming that every read type was granted.
- **No returned data:** say no activity data is available; do not infer denial.
- **Native workout start failed:** continue locally and offer one retry.
- **Sensor absent:** display heart rate as unavailable while time and local logging continue.
- **Sensor disconnects:** retain the last value briefly with a stale state, then display unavailable; reconnect automatically through HealthKit events.
- **Native workout interrupted:** show a compact interrupted state and reconcile before accepting another native command.
- **Health save failed:** preserve the local completed workout and provide an idempotent retry.

### Local safety

- Existing active-session persistence remains mandatory.
- A storage failure never clears the only recoverable workout copy.
- Completion remains an upsert by session ID.
- Data migrations are versioned, deterministic, and tested against prior fixtures.
- Invalid weight and repetition values are rejected before completion and focused for correction.

## Testing strategy

### Automated tests

Pure TypeScript tests cover:

- Health state transitions and normalization.
- Local-only fallback at every native failure point.
- Finish ordering and idempotency.
- Retry after local save success and Health save failure.
- Migration of existing workouts without Health fields.
- Heart-rate downsampling limits and ordering.
- Volume comparison selection and positive/negative/zero presentation.
- Personal-record detection and specific messages.
- Exercise replace, reorder, delete, and set correction behavior.
- Missing versus zero Health metric presentation.

The native module receives focused Swift tests where HealthKit-independent state logic can be isolated. Device-only HealthKit behavior is covered by a repeatable physical test checklist rather than mocked claims about system behavior.

### Project verification

Every implementation milestone runs the checks relevant to its changes, with the full gate before final delivery:

```bash
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo-doctor
npx expo export --platform ios --output-dir <temporary-directory> --clear
git diff --check
```

Native milestones additionally require a clean iOS prebuild and Xcode/device build on macOS.

### Physical iPhone and AirPods matrix

Verify on the user's iPhone and AirPods Pro 3:

- first permission flow;
- permission declined;
- daily activity with and without returned samples;
- workout start and appearance in Apple Health/Fitness;
- live heart rate with AirPods connected;
- no heart-rate device connected;
- AirPods disconnect and reconnect;
- active calories, average heart rate, and maximum heart rate;
- pause and resume;
- screen lock and unlock;
- app background and foreground;
- interruption and relaunch recovery;
- local completion when HealthKit fails;
- Health save retry;
- duplicate-finish prevention;
- cancellation and native discard;
- existing workout-history migration;
- Reduce Motion, large text, safe areas, and keyboard entry.

## Implementation sequence

The implementation plan must preserve this dependency order:

1. **Baseline:** verify current checks, storage fixtures, repository state, and existing workout lifecycle.
2. **Native proof:** add the smallest local Expo module and app capability needed to authorize, read one daily metric, start a test strength workout, receive supported live metrics, finish it, and confirm it in Apple Health on the physical iPhone.
3. **Health architecture:** finalize the typed module contract, native state delegates, TypeScript adapter, and unavailable implementation.
4. **Domain integration:** add Health coordination to the persisted active session, completed-session schema, migrations, idempotent completion, reconciliation, and retries.
5. **Design foundation:** finalize tokens, bundled display font, internal icons, ambient background treatment, motion, haptics, accessibility, and five-tab dock.
6. **Home:** replace the artificial Current State concept with the truthful Today experience and Health states.
7. **Workout entry and routines:** align empty workout, routine start, and exercise selection with the product system.
8. **Active workout:** implement the elegant ledger structure, live metric strip, exercise queue, direct set editing, replace/reorder/delete, and persistent actions.
9. **Completion:** implement final metrics, volume context, specific PRs, heart chart, exercise detail, and Health status/retry.
10. **Progress and Library:** complete the system across history, detail, trends, routine editing, and exercise browsing.
11. **Resilience:** exercise all permission, sensor, interruption, storage, migration, and Health save failures.
12. **Physical verification:** run the iPhone/AirPods matrix and correct real-device issues.
13. **Final audit:** run the complete verification gate, remove obsolete visual code, update setup documentation, and confirm GitHub `main` is synchronized.

Each completed, verified milestone receives a focused commit on `main` and is pushed to `origin/main`. A failed milestone is fixed and reverified before the next one begins.

## Acceptance criteria

The product phase is complete when:

- An installed iPhone development build can request the required Health access.
- The app can start and finish a traditional strength workout that appears once in Apple Health/Fitness.
- Live Health metrics render when available and degrade cleanly when unavailable.
- AirPods Pro 3 heart rate is received through HealthKit during a compatible workout when connected and authorized.
- The local workout remains usable without HealthKit.
- Backgrounding and relaunch do not reset local sets or elapsed progress.
- Existing saved workouts and routines survive migration.
- The active workout supports correction, replacement, reorder, deletion, and mid-workout additions.
- Home uses real daily values and never shows an unexplained combined score.
- Completion shows aligned metrics, neutral volume context, specific PRs, heart-rate detail, exercise detail, and accurate Health save state.
- All five tabs use the approved visual system without excessive card nesting or decorative glow.
- Automated checks pass and the physical iPhone/AirPods matrix has no unresolved critical issue.
- Setup documentation explains the Mac/Xcode development-build workflow.
- All completed work is committed and pushed to `main`.

## Reference basis

- Apple HealthKit workout sessions and live workout builders: <https://developer.apple.com/documentation/healthkit/hkworkoutsession>
- Apple HealthKit workouts and Activity ring behavior: <https://developer.apple.com/documentation/healthkit/hkworkout>
- Apple HealthKit live data source behavior: <https://developer.apple.com/documentation/healthkit/hkliveworkoutdatasource>
- Apple Health activity summaries: <https://developer.apple.com/documentation/healthkit/hkactivitysummary>
- Expo custom native code and local modules: <https://docs.expo.dev/workflow/customizing/>
- Expo development builds: <https://docs.expo.dev/develop/development-builds/introduction/>
- Maintained React Native HealthKit binding evaluated during dependency preflight: <https://github.com/kingstinct/react-native-healthkit>
