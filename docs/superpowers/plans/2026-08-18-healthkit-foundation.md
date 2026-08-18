# HealthKit Foundation and Device Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the app's narrow iPhone HealthKit architecture from authorization through a completed traditional-strength-training workout, first in Simulator and then with real AirPods heart-rate data on the user's physical iPhone.

**Architecture:** A local iOS Expo module owns `HKHealthStore`, `HKWorkoutSession`, `HKLiveWorkoutBuilder`, and their delegates. A small typed TypeScript service hides the native boundary and supplies a safe unavailable implementation outside iOS development builds. A development-only proof panel exercises the native lifecycle without coupling unfinished HealthKit behavior to the production workout store.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript 6, Expo Modules API, Swift, Apple HealthKit, Node test runner, Xcode Simulator, physical iPhone, AirPods Pro 3.

**Spec:** `docs/superpowers/specs/2026-08-18-healthkit-ui-product-design.md`

## Global Constraints

- The app remains iPhone- and iOS-only.
- Local workout logging must remain usable without HealthKit.
- Expo Go is unsupported for this phase; use a custom development build.
- Add no general-purpose HealthKit binding, UI kit, Bluetooth dependency, or animation framework.
- The native module exposes only the HealthKit operations defined in the product specification.
- AirPods connect through HealthKit; the app does not implement direct Bluetooth access.
- Never infer that Health read permission was denied from an empty query result.
- A simulator result cannot satisfy the AirPods, calorie-quality, background, Apple Fitness, or physical-device acceptance gate.
- Existing persisted workouts, routines, and active-session data must remain byte-compatible in this phase.
- Each verified code task is committed to `main` and pushed to `origin/main`.
- Native compilation and device installation run on the user's Mac; the Windows workspace can implement and test platform-independent TypeScript but cannot compile Swift or run Xcode.

---

## File map

### Files created

- `src/health/types.ts` — shared HealthKit states, metric values, result types, errors, and service contract.
- `src/health/healthService.ts` — safe unavailable service used by Node tests and unsupported platforms.
- `src/health/healthService.ios.ts` — iOS adapter around the local Expo module.
- `src/health/normalizeHealthPayload.ts` — trust-boundary validation for native dictionaries and events.
- `src/components/health/HealthKitProofPanel.tsx` — development-only controls and metric output for simulator/device proof.
- `modules/healthkit-workout/index.ts` — JavaScript entry point for the local Expo module.
- `modules/healthkit-workout/src/HealthKitWorkoutModule.ts` — typed module lookup and native event definitions.
- `modules/healthkit-workout/src/HealthKitWorkout.types.ts` — module-specific native payload types.
- `modules/healthkit-workout/ios/HealthKitWorkoutModule.swift` — Expo module definition and JavaScript-visible methods.
- `modules/healthkit-workout/ios/HealthKitWorkoutController.swift` — HealthKit authorization, queries, workout session, builder, delegates, and lifecycle state.
- `modules/healthkit-workout/ios/HealthKitWorkout.podspec` — iOS module build definition.
- `modules/healthkit-workout/expo-module.config.json` — Expo autolinking configuration.
- `modules/healthkit-workout/package.json` — private local-module metadata.
- `tests/healthService.test.mjs` — unavailable behavior and native-payload normalization.
- `tests/healthKitConfig.test.mjs` — deterministic checks for entitlement, permission copy, and local module registration.

### Files modified

- `app.json` — HealthKit entitlement and read/write permission descriptions.
- `src/screens/HomeScreen.tsx` — render the proof panel only when `__DEV__` is true.
- `package.json` — include the two new Node test files through the existing wildcard; no new third-party HealthKit dependency.
- `SETUP_GUIDE.md` — explain development-build, Simulator, physical-device, signing, and proof commands.

---

### Task 1: Preserve and verify the existing app

**Files:** None.

**Interfaces:**
- Consumes: existing repository at commit `1c3a4ab8f72ae1bf8d166de0013801e8764052cb`.
- Produces: a verified clean baseline for every following diff.

- [x] **Step 1: Run the existing complete check**

Run:

```bash
npm run check
```

Observed on 2026-08-18: TypeScript passed; 25 tests passed, 0 failed.

- [x] **Step 2: Run the stricter TypeScript gate**

Run:

```bash
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
```

Observed on 2026-08-18: exit code 0.

- [x] **Step 3: Verify Expo package and configuration health**

Run:

```bash
npx expo-doctor
```

Observed on 2026-08-18: 21/21 checks passed.

- [x] **Step 4: Verify the existing iOS JavaScript bundle**

Run:

```bash
npx expo export --platform ios --output-dir .expo-export/healthkit-baseline --clear
```

Observed on 2026-08-18: iOS bundle exported successfully.

- [x] **Step 5: Confirm preservation**

Run:

```bash
git diff --check
git status --short --branch
```

Observed on 2026-08-18: no diff; `main` matched `origin/main`.

No commit is created because this task intentionally changes no file.

---

### Task 2: Add the typed Health service contract and unavailable implementation

**Files:**
- Create: `src/health/types.ts`
- Create: `src/health/healthService.ts`
- Create: `tests/healthService.test.mjs`

**Interfaces:**
- Consumes: no native module.
- Produces: `HealthService`, `HealthWorkoutState`, `TodayActivity`, `LiveHealthMetrics`, `FinishedHealthWorkout`, `HealthServiceError`, and `healthService`.

- [ ] **Step 1: Write failing contract tests**

Create `tests/healthService.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { healthService } from '../src/health/healthService.ts';

test('reports HealthKit unavailable outside the iOS native build', async () => {
  assert.equal(await healthService.isHealthDataAvailable(), false);
  assert.deepEqual(await healthService.getWorkoutState(), { state: 'idle' });
});

test('rejects native-only operations with a stable unavailable code', async () => {
  await assert.rejects(
    healthService.startWorkout('session-1', 1_000),
    (error) => error?.code === 'healthkit_unavailable',
  );
});
```

- [ ] **Step 2: Run the focused test and confirm the red state**

Run:

```bash
npx tsx --test tests/healthService.test.mjs
```

Expected: FAIL because `src/health/healthService.ts` does not exist.

- [ ] **Step 3: Define the public contract**

Create `src/health/types.ts` with these exact public shapes:

```ts
export type HealthWorkoutState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'ending'
  | 'ended'
  | 'failed';

export interface TodayActivity {
  activeEnergyKilocalories: number | null;
  exerciseMinutes: number | null;
  stepCount: number | null;
  activeEnergyGoalKilocalories: number | null;
  exerciseGoalMinutes: number | null;
}

export interface LiveHealthMetrics {
  elapsedSeconds: number;
  activeEnergyKilocalories: number | null;
  heartRateBpm: number | null;
  averageHeartRateBpm: number | null;
  maximumHeartRateBpm: number | null;
  capturedAt: number;
}

export interface FinishedHealthWorkout extends LiveHealthMetrics {
  workoutUuid: string;
  startTime: number;
  endTime: number;
}

export interface WorkoutStateSnapshot {
  state: HealthWorkoutState;
  errorCode?: string;
}

export type Unsubscribe = () => void;

export interface HealthService {
  isHealthDataAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<void>;
  readTodayActivity(): Promise<TodayActivity>;
  startWorkout(localSessionId: string, startedAt: number): Promise<void>;
  pauseWorkout(): Promise<void>;
  resumeWorkout(): Promise<void>;
  finishWorkout(): Promise<FinishedHealthWorkout>;
  discardWorkout(): Promise<void>;
  getWorkoutState(): Promise<WorkoutStateSnapshot>;
  subscribeToWorkoutState(listener: (state: WorkoutStateSnapshot) => void): Unsubscribe;
  subscribeToLiveMetrics(listener: (metrics: LiveHealthMetrics) => void): Unsubscribe;
}

export class HealthServiceError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'HealthServiceError';
  }
}
```

- [ ] **Step 4: Implement the unavailable service**

Create `src/health/healthService.ts`:

```ts
import { HealthServiceError, type HealthService } from './types';

const unavailable = () =>
  Promise.reject(
    new HealthServiceError(
      'healthkit_unavailable',
      'Apple Health requires the installed iPhone development build.',
    ),
  );

export const healthService: HealthService = {
  isHealthDataAvailable: async () => false,
  requestAuthorization: unavailable,
  readTodayActivity: unavailable,
  startWorkout: unavailable,
  pauseWorkout: unavailable,
  resumeWorkout: unavailable,
  finishWorkout: unavailable,
  discardWorkout: unavailable,
  getWorkoutState: async () => ({ state: 'idle' }),
  subscribeToWorkoutState: () => () => {},
  subscribeToLiveMetrics: () => () => {},
};
```

- [ ] **Step 5: Verify contract and project tests**

Run:

```bash
npx tsx --test tests/healthService.test.mjs
npm run check
```

Expected: focused tests pass; full suite passes.

- [ ] **Step 6: Commit and push**

```bash
git add src/health/types.ts src/health/healthService.ts tests/healthService.test.mjs
git commit -m "feat: define health service boundary"
git push origin main
```

---

### Task 3: Configure HealthKit and scaffold the local Expo module

**Files:**
- Modify: `app.json`
- Create: `tests/healthKitConfig.test.mjs`
- Create: `modules/healthkit-workout/package.json`
- Create: `modules/healthkit-workout/expo-module.config.json`
- Create: `modules/healthkit-workout/index.ts`
- Create: `modules/healthkit-workout/src/HealthKitWorkout.types.ts`
- Create: `modules/healthkit-workout/src/HealthKitWorkoutModule.ts`
- Create: `modules/healthkit-workout/ios/HealthKitWorkout.podspec`
- Create: `modules/healthkit-workout/ios/HealthKitWorkoutModule.swift`

**Interfaces:**
- Consumes: Expo Modules autolinking and the Task 2 public type names.
- Produces: a buildable native module named `HealthKitWorkout` and reproducible HealthKit app configuration.

- [ ] **Step 1: Write the failing configuration test**

Create `tests/healthKitConfig.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('declares the HealthKit entitlement and honest permission copy', async () => {
  const app = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8'));
  const ios = app.expo.ios;
  assert.equal(ios.entitlements['com.apple.developer.healthkit'], true);
  assert.match(ios.infoPlist.NSHealthShareUsageDescription, /activity|heart/i);
  assert.match(ios.infoPlist.NSHealthUpdateUsageDescription, /workout/i);
});

test('registers the local Apple module', async () => {
  const config = JSON.parse(
    await readFile(
      new URL('../modules/healthkit-workout/expo-module.config.json', import.meta.url),
      'utf8',
    ),
  );
  assert.deepEqual(config.platforms, ['apple']);
  assert.deepEqual(config.apple.modules, ['HealthKitWorkoutModule']);
});
```

- [ ] **Step 2: Run the test and confirm the red state**

Run:

```bash
npx tsx --test tests/healthKitConfig.test.mjs
```

Expected: FAIL because the entitlement and module config are absent.

- [ ] **Step 3: Add reproducible iOS configuration**

Add to `expo.ios` in `app.json`:

```json
"entitlements": {
  "com.apple.developer.healthkit": true
},
"infoPlist": {
  "NSHealthShareUsageDescription": "Gym Tracker reads activity and heart-rate data to show your daily activity and live workout metrics.",
  "NSHealthUpdateUsageDescription": "Gym Tracker saves completed strength workouts to Apple Health."
}
```

Do not add generated `ios/` files to Git.

- [ ] **Step 4: Scaffold the local module**

On the Mac, run from the repository root:

```bash
npx create-expo-module@latest --local healthkit-workout
```

Keep the generated module private and Apple-only. Replace its module config with:

```json
{
  "platforms": ["apple"],
  "apple": {
    "modules": ["HealthKitWorkoutModule"]
  }
}
```

Set `modules/healthkit-workout/package.json` name to `healthkit-workout`, version to `0.1.0`, and `private` to `true`.

- [ ] **Step 5: Define the JavaScript-visible native surface**

Export native payloads from `modules/healthkit-workout/src/HealthKitWorkout.types.ts` and use `requireNativeModule('HealthKitWorkout')` in `HealthKitWorkoutModule.ts`. The native module type must expose:

```ts
export type NativeHealthKitWorkoutModule = {
  isHealthDataAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<void>;
  readTodayActivity(): Promise<Record<string, unknown>>;
  startWorkout(localSessionId: string, startedAt: number): Promise<void>;
  pauseWorkout(): Promise<void>;
  resumeWorkout(): Promise<void>;
  finishWorkout(): Promise<Record<string, unknown>>;
  discardWorkout(): Promise<void>;
  getWorkoutState(): Promise<Record<string, unknown>>;
};
```

- [ ] **Step 6: Add the minimal Swift module definition**

`HealthKitWorkoutModule.swift` starts with a buildable availability method:

```swift
import ExpoModulesCore
import HealthKit

public final class HealthKitWorkoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HealthKitWorkout")
    Events("onWorkoutStateChanged", "onLiveMetrics")

    AsyncFunction("isHealthDataAvailable") {
      HKHealthStore.isHealthDataAvailable()
    }
  }
}
```

The podspec links `HealthKit` and targets the iOS version generated by Expo SDK 57; do not hardcode a second, conflicting deployment target.

- [ ] **Step 7: Verify configuration and TypeScript**

Run:

```bash
npx tsx --test tests/healthKitConfig.test.mjs
npm run check
npx expo config --type public
```

Expected: configuration tests pass, project checks pass, and the public Expo config contains both usage descriptions and the entitlement.

- [ ] **Step 8: Verify a clean native generation on Mac**

Run:

```bash
npx expo prebuild --clean --platform ios
npx expo run:ios
```

Expected: Xcode Simulator build succeeds and the app launches. Confirm the generated app target has the HealthKit entitlement. Do not commit `ios/`.

- [ ] **Step 9: Commit and push**

```bash
git add app.json modules/healthkit-workout tests/healthKitConfig.test.mjs
git commit -m "feat: add local healthkit module"
git push origin main
```

---

### Task 4: Implement authorization and truthful daily activity queries

**Files:**
- Create: `modules/healthkit-workout/ios/HealthKitWorkoutController.swift`
- Modify: `modules/healthkit-workout/ios/HealthKitWorkoutModule.swift`
- Create: `src/health/normalizeHealthPayload.ts`
- Modify: `tests/healthService.test.mjs`

**Interfaces:**
- Consumes: `HealthKitWorkout` native module and Task 2 `TodayActivity`.
- Produces: native `requestAuthorization`, native `readTodayActivity`, and `normalizeTodayActivity(value: unknown): TodayActivity`.

- [ ] **Step 1: Add failing normalization tests**

Append tests that require `normalizeTodayActivity` to preserve valid non-negative numbers, convert missing values to `null`, and reject negative, non-finite, string, and boolean values with `HealthServiceError.code === 'invalid_native_payload'`.

Use this valid fixture:

```js
{
  activeEnergyKilocalories: 412.5,
  exerciseMinutes: 37,
  stepCount: 8240,
  activeEnergyGoalKilocalories: 700,
  exerciseGoalMinutes: 45,
}
```

- [ ] **Step 2: Run the focused tests and confirm the red state**

Run:

```bash
npx tsx --test tests/healthService.test.mjs
```

Expected: FAIL because the normalizer is absent.

- [ ] **Step 3: Implement the native-payload trust boundary**

Create `normalizeHealthPayload.ts` with one `nullableNonNegativeNumber(record, key)` helper. It returns `null` for `null`/`undefined`, returns finite numbers greater than or equal to zero, and throws `HealthServiceError('invalid_native_payload', ...)` for all other values. Build `normalizeTodayActivity` only from that helper.

- [ ] **Step 4: Configure the exact authorization set**

In `HealthKitWorkoutController.swift`, create non-optional HealthKit types for:

```swift
let workout = HKObjectType.workoutType()
let heartRate = HKObjectType.quantityType(forIdentifier: .heartRate)!
let activeEnergy = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
let steps = HKObjectType.quantityType(forIdentifier: .stepCount)!
let exerciseTime = HKObjectType.quantityType(forIdentifier: .appleExerciseTime)!
let activitySummary = HKObjectType.activitySummaryType()
```

Request sharing for `workout` and `activeEnergy`, and reading for `workout`, `heartRate`, `activeEnergy`, `steps`, `exerciseTime`, and `activitySummary`. Do not request unrelated medical or body data.

- [ ] **Step 5: Implement today's statistics**

Use `Calendar.current.startOfDay(for: Date())` and strict-start-date predicates. Query cumulative sums for active energy, exercise time, and steps. Query today's `HKActivitySummary` for Move and Exercise goals. Return missing samples and missing goals as `NSNull`, never numeric zero by default.

Convert units exactly:

```swift
activeEnergy.quantity()?.doubleValue(for: .kilocalorie())
exerciseTime.quantity()?.doubleValue(for: .minute())
steps.quantity()?.doubleValue(for: .count())
```

- [ ] **Step 6: Expose controller methods through Expo**

Register `requestAuthorization` and `readTodayActivity` as `AsyncFunction` definitions. Convert native errors into stable codes: `authorization_failed`, `query_failed`, and `healthkit_unavailable`. Never return an `authorizationDenied` read state.

- [ ] **Step 7: Verify TypeScript and Simulator behavior**

Run:

```bash
npm run check
npx expo run:ios
```

Expected: project tests pass; the Simulator presents the Health permission sheet; a no-data simulator returns nullable values without crashing.

- [ ] **Step 8: Commit and push**

```bash
git add modules/healthkit-workout src/health/normalizeHealthPayload.ts tests/healthService.test.mjs
git commit -m "feat: read health activity data"
git push origin main
```

---

### Task 5: Implement the native live workout lifecycle

**Files:**
- Modify: `modules/healthkit-workout/ios/HealthKitWorkoutController.swift`
- Modify: `modules/healthkit-workout/ios/HealthKitWorkoutModule.swift`
- Modify: `modules/healthkit-workout/src/HealthKitWorkout.types.ts`

**Interfaces:**
- Consumes: authorized `HKHealthStore` and the native method names defined in Task 3.
- Produces: state events, live metrics events, idempotent native controls, and the final HealthKit workout UUID.

- [ ] **Step 1: Define one native state machine**

`HealthKitWorkoutController` owns this internal state:

```swift
enum WorkoutState: String {
  case idle, starting, running, paused, ending, ended, failed
}
```

It retains one `HKWorkoutSession?`, one `HKLiveWorkoutBuilder?`, one local session ID, and one finish continuation at a time. Every public method runs on the main actor. State changes call one closure supplied by the Expo module.

- [ ] **Step 2: Start a traditional strength-training session**

Build with:

```swift
let configuration = HKWorkoutConfiguration()
configuration.activityType = .traditionalStrengthTraining
configuration.locationType = .indoor
let session = try HKWorkoutSession(
  healthStore: healthStore,
  configuration: configuration
)
let builder = session.associatedWorkoutBuilder()
builder.dataSource = HKLiveWorkoutDataSource(
  healthStore: healthStore,
  workoutConfiguration: configuration
)
session.delegate = self
builder.delegate = self
session.startActivity(with: startedAt)
try await builder.beginCollection(at: startedAt)
```

Convert `startedAt` from milliseconds to `Date(timeIntervalSince1970: startedAt / 1000)`. Attach the local session ID as workout metadata before finishing. Reject a different second session with `workout_already_active`; treat the same local ID in running state as an idempotent success.

- [ ] **Step 3: Emit throttled live metrics**

In `workoutBuilder(_:didCollectDataOf:)`, read statistics for `.activeEnergyBurned` and `.heartRate`. Emit at most once per second with:

- builder elapsed time;
- cumulative active energy in kilocalories;
- most recent heart rate in count/minute;
- discrete average heart rate;
- discrete maximum heart rate;
- capture timestamp in milliseconds.

Unavailable quantities serialize as `NSNull`.

- [ ] **Step 4: Implement pause and resume**

`pauseWorkout` calls `session.pause()` only from running state. `resumeWorkout` calls `session.resume()` only from paused state. Repeating the already-satisfied command resolves successfully. All other mismatches return `invalid_workout_state`.

- [ ] **Step 5: Implement finish and discard exactly once**

Finish transitions to `ending`, calls `session.end()`, ends builder collection at the same end timestamp, then calls `finishWorkout()`. Resolve with `workoutUuid`, millisecond `startTime` and `endTime`, `elapsedSeconds`, `capturedAt`, and final statistics matching `FinishedHealthWorkout`. Clear retained HealthKit objects only after resolution.

Discard calls `session.end()`, `builder.discardWorkout()`, clears retained state, and emits `idle`. A repeated discard while idle resolves successfully.

- [ ] **Step 6: Handle delegate failures**

`HKWorkoutSessionDelegate` maps native errors to `workout_session_failed`, emits failed state once, and rejects an outstanding start/finish continuation once. It must not invent a completed workout after a native failure.

- [ ] **Step 7: Expose every method and event**

Connect controller closures to:

```swift
sendEvent("onWorkoutStateChanged", statePayload)
sendEvent("onLiveMetrics", metricsPayload)
```

Register `startWorkout`, `pauseWorkout`, `resumeWorkout`, `finishWorkout`, `discardWorkout`, and `getWorkoutState` in `HealthKitWorkoutModule.definition()`.

- [ ] **Step 8: Run native and project verification on Mac**

Run:

```bash
npm run check
npx expo prebuild --clean --platform ios
npx expo run:ios
```

Expected: Swift compiles without warnings introduced by this module; app launches in Simulator.

- [ ] **Step 9: Commit and push**

```bash
git add modules/healthkit-workout
git commit -m "feat: add live healthkit workout session"
git push origin main
```

---

### Task 6: Add the iOS adapter and development-only proof panel

**Files:**
- Create: `src/health/healthService.ios.ts`
- Modify: `src/health/normalizeHealthPayload.ts`
- Modify: `tests/healthService.test.mjs`
- Create: `src/components/health/HealthKitProofPanel.tsx`
- Modify: `src/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: native module methods/events and Task 2 `HealthService`.
- Produces: the iOS `healthService` implementation and a non-production proof harness.

- [ ] **Step 1: Add failing workout-payload normalization tests**

Test valid state, live metric, and finished-workout payloads. Reject unknown state names, negative elapsed time, malformed UUID, and end time before start time with `invalid_native_payload`.

- [ ] **Step 2: Run focused tests and confirm the red state**

Run:

```bash
npx tsx --test tests/healthService.test.mjs
```

Expected: FAIL for the new absent normalizers.

- [ ] **Step 3: Implement strict normalizers**

Add and export:

```ts
normalizeWorkoutState(value: unknown): WorkoutStateSnapshot;
normalizeLiveHealthMetrics(value: unknown): LiveHealthMetrics;
normalizeFinishedHealthWorkout(value: unknown): FinishedHealthWorkout;
```

Reuse the same finite/null number validation rather than casting native dictionaries.

- [ ] **Step 4: Implement the iOS service adapter**

`healthService.ios.ts` delegates each promise to the local module, normalizes every returned dictionary, and converts native event subscriptions into cleanup functions. It converts native errors into `HealthServiceError` while preserving a stable native error code when present.

- [ ] **Step 5: Build the minimal proof panel**

`HealthKitProofPanel` renders only in a development build. It provides these explicit controls:

1. Check availability.
2. Connect Apple Health.
3. Read today's activity.
4. Start test strength workout.
5. Pause or resume.
6. Finish and display the returned UUID.
7. Discard.

It subscribes to state and live metrics, shows nullable values as `Unavailable`, disables invalid controls from the state snapshot, and displays one inline error with Retry. Its test workout ID is `health-proof-<timestamp>`.

In `HomeScreen.tsx`, render it only with:

```tsx
{__DEV__ ? <HealthKitProofPanel /> : null}
```

The panel never writes to the local workout store and cannot appear in a release build.

- [ ] **Step 6: Verify TypeScript, tests, and iOS bundle**

Run:

```bash
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo export --platform ios --output-dir .expo-export/healthkit-proof --clear
```

Expected: all commands pass.

- [ ] **Step 7: Commit and push**

```bash
git add src/health src/components/health/HealthKitProofPanel.tsx src/screens/HomeScreen.tsx tests/healthService.test.mjs
git commit -m "feat: add healthkit proof controls"
git push origin main
```

---

### Task 7: Pass the Xcode Simulator checkpoint

**Files:**
- Modify: `SETUP_GUIDE.md`

**Interfaces:**
- Consumes: Tasks 2–6 on the user's Mac.
- Produces: proof that native code builds and the non-hardware lifecycle is callable.

- [ ] **Step 1: Pull and build on Mac**

```bash
git pull --ff-only origin main
npm ci
npx expo prebuild --clean --platform ios
npx expo run:ios
```

- [ ] **Step 2: Exercise the permission and activity paths**

From the development proof panel:

- Confirm availability is true.
- Open the Health permission sheet.
- Read today's activity with no data and confirm the UI says Unavailable.
- Add supported sample data in Simulator's Health app where possible, reread, and confirm returned values update.

- [ ] **Step 3: Exercise the workout state machine**

- Start the test workout once.
- Repeat Start and confirm no second workout session is created.
- Pause, repeat Pause, resume, and repeat Resume.
- Finish and confirm one UUID is returned.
- Start another test and Discard it.
- Confirm no crash when heart rate stays unavailable.

Simulator calories and heart rate are not accepted as hardware evidence.

- [ ] **Step 4: Document the reproducible workflow**

Add exact Mac commands, the Health permission reset path, the proof-panel sequence, and the physical-device warning to `SETUP_GUIDE.md`.

- [ ] **Step 5: Run the full gate**

```bash
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export/healthkit-simulator --clear
git diff --check
```

Expected: all commands pass.

- [ ] **Step 6: Commit and push**

```bash
git add SETUP_GUIDE.md
git commit -m "docs: add healthkit development workflow"
git push origin main
```

---

### Task 8: Pass the physical iPhone and AirPods proof gate

**Files:** None unless device evidence exposes a defect.

**Interfaces:**
- Consumes: the Simulator-verified development build.
- Produces: evidence required before HealthKit is connected to production workout persistence and redesigned UI.

- [ ] **Step 1: Install the development build on the iPhone**

Connect the iPhone to the Mac, enable Developer Mode, choose the correct Xcode signing team, and run:

```bash
npx expo run:ios --device
```

Select Vlad's iPhone when prompted. Trust the developer profile if iOS requests it.

- [ ] **Step 2: Grant the minimum Health access**

Open the proof panel, connect Apple Health, and grant the requested workout/activity permissions. Confirm the app remains usable if the permission sheet is cancelled before repeating with access enabled.

- [ ] **Step 3: Verify AirPods through HealthKit**

Wear connected AirPods Pro 3, start the proof workout, and confirm:

- live heart rate becomes non-null;
- heart rate changes over time;
- disconnecting AirPods makes the value unavailable without ending the workout;
- reconnecting restores updates without starting a second workout.

- [ ] **Step 4: Verify live energy and lifecycle**

Confirm elapsed time and active energy update. Pause and resume. Lock the phone, wait, unlock it, and verify the session remains coherent. Background and foreground the app once.

- [ ] **Step 5: Verify Apple Health/Fitness output**

Finish once and confirm:

- one traditional strength-training workout appears;
- start time and duration are correct;
- available heart-rate and active-energy data are associated;
- repeating Finish does not create another workout.

- [ ] **Step 6: Record the gate result**

If every physical criterion passes, record the iOS version, iPhone model, AirPods firmware, and result in the implementation task handoff. If any criterion fails, preserve logs and the exact native error/state transition; do not begin production store integration until the root cause is resolved.

No commit is required when the physical gate passes without code changes. Any defect correction receives its own failing test where possible, focused commit, full verification, and push.

---

## Phase completion gate

This plan is complete only when:

- the existing application baseline remains green;
- the local Expo module builds from a clean iOS prebuild;
- authorization and truthful daily activity queries work without crashes;
- the native workout state machine starts, pauses, resumes, finishes, and discards idempotently;
- native dictionaries are validated before entering product state;
- Simulator behavior passes without pretending to validate sensors;
- a physical iPhone receives AirPods Pro 3 heart rate through HealthKit;
- one finished strength workout appears in Apple Health/Fitness without duplication;
- all code is committed and pushed to `main`.

After this gate, create the separate HealthKit domain-integration plan for persisted local sessions, completion reconciliation, retries, compact heart-rate history, and production UI state. The approved visual redesign remains a separate plan after the native and domain foundations are verified.
