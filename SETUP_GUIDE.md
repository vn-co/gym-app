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
