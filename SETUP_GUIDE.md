# Gym Tracker Setup Guide

Gym Tracker is an iOS-first Expo/React Native app for personal workout logging. It runs fully offline and stores workouts, routines, records, and custom exercises on the device.

## Prerequisites

- Node.js 20.19.4 or newer
- npm 11 or a compatible npm version that honors `package-lock.json`
- Expo Go on the iPhone for development, or macOS with Xcode for the iOS Simulator/native builds

Windows can install dependencies, typecheck, test, and run the Expo development server. Apple requires macOS/Xcode for a local iOS Simulator or native iOS build; EAS can build iOS in the cloud later.

## Fresh checkout

```bash
git clone https://github.com/vn-co/gym-app.git
cd gym-app
npm ci
```

Use `npm ci`, not `npm install`, for normal setup. It installs the exact dependency tree committed in `package-lock.json` and catches manifest/lock drift.

## Verify the project

```bash
npm run check
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export --clear
```

- `npm run check` runs strict TypeScript and regression tests.
- Expo Doctor validates the SDK package matrix, app config, native peers, and assets.
- Expo export proves Metro can produce the iOS JavaScript bundle. `.expo-export` is disposable and should not be committed.

## Run during development

```bash
npm start
```

Scan the QR code with Expo Go on the iPhone. The phone and development computer must be able to reach each other.

On a Mac with Xcode:

```bash
npm run ios
```

## HealthKit Xcode Simulator checkpoint

HealthKit uses the local Swift module, so this checkpoint requires macOS, Xcode, and an iOS 26 Simulator. Expo Go cannot load this module. The Simulator checkpoint proves that Swift compiles, permissions and activity queries are callable, and the workout state machine completes without hardware data. It does not validate sensor accuracy.

### Build a clean development app

From the repository on the Mac:

```bash
git status --short
git pull --ff-only origin main
npm ci
npx expo prebuild --clean --platform ios
npx expo run:ios
```

`git status --short` must show no unexpected work before the clean prebuild. If Expo selects an older runtime, rerun `npx expo run:ios --device` and choose an iOS 26 Simulator. The generated `ios/` directory is disposable and ignored; native source remains in `modules/healthkit-workout`.

A successful checkpoint requires the app to launch without a Swift compiler error or native crash. The development-only **HealthKit / Device Proof** panel appears near the top of Home.

### Reset Health permissions and sample data

On the simulated iPhone, review app-specific access at:

**Settings → Privacy & Security → Health → Gym Tracker**

To reproduce the first authorization prompt from a completely clean Simulator, use the macOS Simulator menu:

**Device → Erase All Content and Settings…**

This full reset deletes every app and all data in that Simulator. After it finishes, rerun `npx expo run:ios`. Use the Settings path for ordinary permission changes; use the full reset only when the first-run sheet itself must be tested again.

To add sample activity where the selected Simulator runtime supports it:

1. Open the simulated **Health** app.
2. Go to **Browse → Activity → Steps → Add Data** and save a value for today.
3. Repeat for **Active Energy** if **Add Data** is available.
4. Return to Gym Tracker and press **Read today** again.

Health values that have no sample must remain **Unavailable**, not silently become zero. Activity-summary goals can remain unavailable when the Simulator does not provide them.

### Permission and activity proof

Run this sequence in the proof panel:

1. Press **Check availability** and confirm **Available**.
2. Press **Connect Apple Health** and open the system permission sheet.
3. Grant the requested workout and activity access.
4. Press **Read today** before adding sample data; missing fields must say **Unavailable**.
5. Add supported Health samples using the steps above.
6. Press **Read today** again and confirm the matching values update.

HealthKit intentionally does not reveal whether read access was denied. A denied read can therefore look the same as no data; the app must remain usable in either case.

### Workout lifecycle proof

Use the proof panel controls in this exact order:

1. Press **Start test workout** and confirm the state reaches **RUNNING**.
2. Press **Repeat start** and confirm the state stays **RUNNING**, with no second session or error.
3. Press **Pause workout** and confirm **PAUSED**.
4. Press **Pause workout** again and confirm it remains **PAUSED** without an error.
5. Press **Resume workout** and confirm **RUNNING**.
6. Press **Resume workout** again and confirm it remains **RUNNING** without an error.
7. Press **Finish workout**, confirm **ENDED**, and confirm one saved workout UUID appears.
8. Press **Start test workout** to create a fresh session, then **Discard workout** and confirm **IDLE**.
9. Complete the sequence with heart rate showing **Unavailable** and confirm there is no crash.

Do not pass this checkpoint if Start reports that live workouts require a newer iOS version, if any state becomes stuck, if duplicate commands return an error, or if Finish returns no UUID.

### Record and verify the checkpoint

Record these details with the test result:

- Git commit SHA: `git rev-parse HEAD`
- Xcode version: `xcodebuild -version`
- Simulator model and iOS version
- Permission/activity result
- Start/pause/resume/finish/discard result
- Returned workout UUID

Then run the repository gate:

```bash
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export/healthkit-simulator --clear
git diff --check
```

All commands must exit successfully. The current Expo workflow is documented in [local app development](https://docs.expo.dev/guides/local-app-development/) and the [Expo CLI reference](https://docs.expo.dev/more/expo-cli/).

### Physical-device warning

Simulator calories and heart rate are not hardware evidence. Do not use generated or manually entered values to approve the sensor integration. Real-time heart-rate and active-energy proof belongs to the signed physical-iPhone checkpoint, using a compatible connected sensor and `npx expo run:ios --device`.

## Project structure

```text
app/                         Expo Router routes and five-tab navigation
src/components/              Reusable workout, routine, and chart UI
src/constants/               Design tokens and the static exercise catalog
src/hooks/                   Workout timer behavior
src/screens/                 Home, Workout, Routines, Progress, Library
src/services/                AsyncStorage boundary and data decoding
src/store/                   Active workout Zustand state
src/types/                   Shared domain and persistence contracts
src/utils/                   IDs, formatting, analytics, numeric parsing
tests/                       Node-based regression tests run through tsx
assets/                      Current icon and splash artwork
docs/audits/                 Repository audit reports
docs/superpowers/plans/      Saved implementation plans
```

The five tabs are:

1. Home — routine shortcuts, consistency, and recent workouts
2. Workout — timer, exercise selection, sets, weight in kilograms, and reps
3. Routines — reusable exercise/default-set templates
4. Progress — range charts and personal records
5. Library — static and custom exercises

## Local data

All user data is stored in AsyncStorage:

| Data | Key |
| --- | --- |
| Workout sessions | `gym_sessions` |
| Personal records | `gym_prs` |
| Display name | `gym_user_name` |
| Custom exercises | `gym_custom_exercises` |
| Routines | `gym_routines` |
| Unfinished workout | `gym_active_session` |

Missing keys are treated as empty. Invalid JSON or storage I/O failures are surfaced instead of silently replacing history with an empty list.

Unfinished workouts are restored before the app displays workout-dependent content. A running timer catches up from timestamps after the phone is locked, the app is backgrounded, or the process is restarted. An explicitly paused workout remains paused. Finishing successfully or confirming cancellation clears the saved draft.

Current limitations:

- AsyncStorage data is not encrypted.
- There is no schema migration, export/import, or backup flow yet.
- Uninstalling the app can remove all local history.

These are tracked as the next data-durability phase in the repository audit.

## Working between Windows and Mac

Use the same Git repository on both machines:

```bash
git status
git pull --ff-only
# work, verify, commit, and push
git push
```

On the other machine, run `git pull --ff-only` and `npm ci`. Re-cloning for every handoff is unnecessary and makes stale or forgotten changes harder to spot.

## App icon and splash

`app.json` currently uses:

- `assets/logo.png` for the app icon
- `assets/splash.png` through the `expo-splash-screen` config plugin

Both assets are functional placeholders. Replace them during the planned UI/brand redesign, then validate the splash screen in a release/internal build because Expo Go cannot reproduce the final native launch screen exactly.

## Standalone iPhone build later

The planned deployment path is an EAS internal-distribution build, not an immediate public App Store release. The high-level flow is:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview
```

Do this after active-session persistence, data export/backup, and the UI redesign are complete. See the official Expo guides for [internal distribution](https://docs.expo.dev/build/internal-distribution/) and [EAS Build](https://docs.expo.dev/build/introduction/).
