# Gym Tracker — Setup Guide

## Prerequisites

- Node.js 20+
- Xcode 15+ (iOS only)
- Expo Go app on your iPhone (for quick testing) OR run on iOS Simulator

---

## 1. Create the project

```bash
# Option A: Use your existing gym-v3 folder (clear it first)
cd code/gym-v3
# Delete everything except .git if you want

# Option B: Fresh folder
mkdir gym-v1 && cd gym-v1
```

---

## 2. Install dependencies

```bash
npm install
```

Or if starting completely fresh (no package.json yet):

```bash
npx create-expo-app@latest . --template blank-typescript
# Then replace package.json with the one provided
npm install
```

Then install the specific packages:

```bash
npx expo install \
  @react-native-async-storage/async-storage \
  react-native-safe-area-context \
  react-native-screens \
  react-native-svg \
  zustand \
  expo-router
```

---

## 3. Complete Directory Structure

```
gym-v1/                         ← project root
├── app.json                    ← Expo config (iOS only, dark mode, scheme)
├── package.json                ← dependencies (SDK 57)
├── tsconfig.json               ← TypeScript strict config
├── babel.config.js             ← minimal, just babel-preset-expo
├── metro.config.js             ← stock expo metro config
│
├── app/                        ← Expo Router file-based routes
│   ├── _layout.tsx             ← Root layout: SafeAreaProvider + StatusBar
│   └── (tabs)/
│       ├── _layout.tsx         ← Tab bar layout (4 tabs)
│       ├── index.tsx           ← Home tab → renders HomeScreen
│       ├── workout.tsx         ← Workout tab → renders WorkoutScreen
│       ├── progress.tsx        ← Progress tab → renders ProgressScreen
│       └── library.tsx         ← Library tab → renders LibraryScreen
│
├── src/
│   ├── constants/
│   │   ├── tokens.ts           ← ALL colors, spacing, radius, font sizes/weights
│   │   └── exercises.ts        ← Static library of 32 exercises + muscle group labels
│   │
│   ├── types/
│   │   └── index.ts            ← All TypeScript interfaces + STORAGE_KEYS enum
│   │
│   ├── services/
│   │   └── storage.ts          ← ONLY file that touches AsyncStorage
│   │                              getSessions / saveSession / deleteSession
│   │                              getPersonalRecords / updatePersonalRecords
│   │                              getUserName / setUserName
│   │
│   ├── store/
│   │   └── workoutStore.ts     ← Zustand store for active workout session
│   │                              startSession / pauseSession / resumeSession
│   │                              addExercise / removeExercise
│   │                              addSet / updateSet / removeSet / toggleSetComplete
│   │
│   ├── hooks/
│   │   └── useWorkoutTimer.ts  ← setInterval that ticks the session clock
│   │
│   ├── utils/
│   │   └── index.ts            ← generateId, calcVolume, formatDuration,
│   │                              formatTimerDisplay, formatWeight, getGreeting,
│   │                              buildProgressData, getWeeklyConsistency, etc.
│   │
│   ├── screens/
│   │   ├── HomeScreen.tsx      ← Greeting, Start CTA, weekly dots, recent sessions
│   │   ├── WorkoutScreen.tsx   ← No-session state + active session with ExerciseCards
│   │   ├── ProgressScreen.tsx  ← Chart (7d/1m/1y), stats, personal records list
│   │   └── LibraryScreen.tsx   ← Searchable SectionList of all exercises
│   │
│   └── components/
│       ├── ui/
│       │   └── LineChart.tsx   ← SVG line chart (uses react-native-svg), no extra lib
│       └── workout/
│           ├── SessionHeader.tsx    ← Timer display, pause/resume, progress bar
│           ├── ExerciseCard.tsx     ← Exercise name + set rows + Add Set
│           ├── SetRow.tsx           ← SET / LBS / REPS inputs + checkbox
│           └── ExercisePicker.tsx  ← Modal sheet to search & pick exercises
│
└── assets/                     ← Put your icon.png and splash.png here
    ├── icon.png                ← 1024×1024 app icon
    └── splash.png              ← 1284×2778 splash screen
```

---

## 4. File Sources (where each file's content comes from)

| File                                        | Source                                        |
| ------------------------------------------- | --------------------------------------------- |
| `app.json`                                  | Provided — copy as-is                         |
| `package.json`                              | Provided — copy as-is, then run `npm install` |
| `tsconfig.json`                             | Provided — copy as-is                         |
| `babel.config.js`                           | Provided — copy as-is                         |
| `metro.config.js`                           | Provided — copy as-is                         |
| `app/_layout.tsx`                           | Provided — copy as-is                         |
| `app/(tabs)/_layout.tsx`                    | Provided — copy as-is                         |
| `app/(tabs)/index.tsx`                      | Provided — copy as-is                         |
| `app/(tabs)/workout.tsx`                    | Provided — copy as-is                         |
| `app/(tabs)/progress.tsx`                   | Provided — copy as-is                         |
| `app/(tabs)/library.tsx`                    | Provided — copy as-is                         |
| `src/constants/tokens.ts`                   | Provided — copy as-is                         |
| `src/constants/exercises.ts`                | Provided — copy as-is                         |
| `src/types/index.ts`                        | Provided — copy as-is                         |
| `src/services/storage.ts`                   | Provided — copy as-is                         |
| `src/store/workoutStore.ts`                 | Provided — copy as-is                         |
| `src/hooks/useWorkoutTimer.ts`              | Provided — copy as-is                         |
| `src/utils/index.ts`                        | Provided — copy as-is                         |
| `src/screens/HomeScreen.tsx`                | Provided — copy as-is                         |
| `src/screens/WorkoutScreen.tsx`             | Provided — copy as-is                         |
| `src/screens/ProgressScreen.tsx`            | Provided — copy as-is                         |
| `src/screens/LibraryScreen.tsx`             | Provided — copy as-is                         |
| `src/components/ui/LineChart.tsx`           | Provided — copy as-is                         |
| `src/components/workout/SessionHeader.tsx`  | Provided — copy as-is                         |
| `src/components/workout/ExerciseCard.tsx`   | Provided — copy as-is                         |
| `src/components/workout/SetRow.tsx`         | Provided — copy as-is                         |
| `src/components/workout/ExercisePicker.tsx` | Provided — copy as-is                         |
| `assets/icon.png`                           | Add your own 1024×1024 PNG                    |
| `assets/splash.png`                         | Add your own splash PNG (optional)            |

---

## 5. Run on your iPhone

### Via Expo Go (easiest — no Xcode needed)

```bash
npx expo start
# Scan the QR code with your iPhone's Camera app
# Expo Go opens the app directly
```

### Via iOS Simulator

```bash
npx expo start --ios
```

### Via physical device with dev build

```bash
npx expo run:ios --device
# Requires Xcode + Apple Developer account (free tier works)
```

---

## 6. Reset cache if something breaks

```bash
npx expo start --clear
```

---

## 7. Where data lives

All data is stored in **AsyncStorage on your device** — completely local, no internet.

| Data                      | AsyncStorage key       |
| ------------------------- | ---------------------- |
| All workout sessions      | `gym_sessions`         |
| Personal records          | `gym_prs`              |
| Your name                 | `gym_user_name`        |
| Custom exercises (future) | `gym_custom_exercises` |

To set your name: add a settings screen later or temporarily call `setUserName('Vlad')` from `storage.ts` in a `useEffect` on first launch.

---

## 8. What's NOT included (intentionally)

- No backend, no Supabase, no auth, no network calls
- No calories tracking (would need Apple HealthKit — different native module)
- No workout templates (can be added on top of the existing data model)
- NativeWind skipped — SDK 57 + NW v5 is still preview; plain StyleSheet is stable and zero-config

---

## 9. Adding your name (quick way)

In `src/screens/HomeScreen.tsx`, inside the `load()` function, after `getUserName()` resolves, you'll see it defaults to `'Athlete'`. To set it permanently:

```ts
// One-time: run this somewhere in your app on first launch
import { setUserName } from '../services/storage';
await setUserName('Vlad');
```

Or add a simple Settings screen later — the `setUserName` function in `storage.ts` is already wired up.
