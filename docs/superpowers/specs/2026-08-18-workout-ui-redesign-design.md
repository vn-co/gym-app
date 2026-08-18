# Workout-First UI Redesign

**Date:** 2026-08-18
**Status:** Direction delegated to Codex and approved to proceed
**Scope:** Establish a softer performance-oriented visual system, replace the emoji tab bar with Apple Fitness-inspired navigation, and redesign the empty and active Workout experiences without changing workout data behavior.

## Context

The app's current dark and lime identity is recognizable, but the interface relies on pure black, repeated dark cards, emoji navigation, weak type hierarchy, and several controls that only appear after scrolling. The active Workout screen is the highest-frequency interaction and the most important place to improve first.

The user selected the compact **Performance Focus** direction, then requested a softer treatment, navigation inspired by Apple's Fitness app, and animation. The user delegated final design judgment and asked implementation to proceed.

This phase updates the shared foundation and navigation because the Workout screen cannot look intentional while sitting above the current emoji tab bar. It fully redesigns Workout first. Other screen layouts remain separate later phases, although shared color and typography token changes may improve their appearance automatically.

## Goals

- Make workout logging fast, legible, calm, and comfortable with one hand.
- Retain a dark athletic identity without harsh pure-black contrast or excessive neon.
- Reserve lime for progress, completion, selection, and primary actions.
- Replace emoji navigation with a consistent outline icon and label system.
- Give the tab bar a translucent, rounded, native iOS character inspired by Apple Fitness without copying Apple assets.
- Keep **Add exercise** and **Finish workout** available without scrolling.
- Improve exercise and set hierarchy while preserving the existing data-entry flow.
- Add brief motion that confirms actions without delaying repeated logging.
- Honor iOS Reduce Motion and preserve non-motion visual feedback.
- Preserve active-workout persistence, timers, finishing safety, and all existing storage behavior.

## Non-goals

- Redesigning Home, Routines, Progress, or Library layouts in this phase.
- Changing workout data types, persistence, calculations, or validation behavior.
- Adding rest timers, supersets, notes, plate calculators, history suggestions, gestures, or new workout features.
- Implementing automatic backup/export/restore.
- Copying Apple Fitness screens, icons, branding, or proprietary assets.
- Adopting Expo Router's alpha native-tabs API.
- Adding a custom font, large animation framework, or general-purpose icon dependency.
- Android-specific design work. The app remains iOS-only.

## Selected direction

Use a **soft performance** visual language:

- Deep graphite rather than pure black.
- Slightly lifted neutral surfaces with quiet borders.
- Off-white primary text and more legible secondary text.
- A softened yellow-green accent used sparingly.
- System typography so iOS renders San Francisco naturally.
- Compact spacing where data density matters and more breathing room around screen-level hierarchy.
- Rounded controls and cards, but not a card around every group of text.

The interface should feel athletic because it is direct, responsive, and data-focused—not because every element is bright, bold, or animated.

## Design tokens

Update the shared tokens to define semantic roles rather than screen-specific colors:

```text
Background                 #0B0D0C
Surface                    #171A18
Elevated surface           #1E221F
Input                      #232724
Border                     #292E2A
Primary text               #F3F5EF
Secondary text             #A1A69E
Muted text                 #71776F
Accent                     #C2E653
Accent pressed             #AACB43
Accent tint                #C2E65314
Danger                     #FF6B6B
Danger tint                #FF6B6B14
```

Keep the existing 4-point spacing foundation. Add only the semantic radii and type sizes needed by the redesigned components rather than creating a second token system.

Typography uses the iOS system font:

- Screen title: 28–32 pt, bold, tight tracking.
- Timer: 17–20 pt monospaced digits, semibold.
- Exercise title: 17 pt, bold.
- Set values: 17 pt, semibold with tabular numbers where supported.
- Body/action: 15 pt.
- Labels/metadata: 11–12 pt, semibold, restrained uppercase tracking.

The timer is no longer the loudest visual element. The workout name anchors the screen; time and progress support it.

## Navigation

Keep the installed, stable Expo Router JavaScript `Tabs` navigator. Style it as an elevated, rounded dock using Expo's stable `BlurView` as the background. This avoids basing core navigation on `expo-router/unstable-native-tabs`, which remains alpha in SDK 57.

The tab bar retains the five stable top-level destinations:

1. Home
2. Workout
3. Routines
4. Progress
5. Library

Each tab uses a small outline SVG icon and a visible text label. Selected state uses the accent color, a subtle tinted icon container, and slightly stronger label weight. Unselected state uses muted text. The active-workout indicator remains available on Workout as a small accent dot/badge without shifting layout.

Use the already-installed `react-native-svg` package for a focused internal icon set. Do not add an icon library or depend on Apple's SF Symbols names. Each icon receives an accessibility label from the tab navigator.

The dock accounts for bottom safe-area insets, keeps at least 44-point hit targets, and remains visible across top-level tabs. It is navigation only; workout actions stay in a separate action bar above it, matching Apple's guidance not to mix actions into a tab bar.

## Empty Workout state

The empty Workout tab receives a real screen hierarchy instead of a centered emoji:

- Screen title **Workout** at the top.
- A restrained dumbbell outline inside two overlapping graphite circles, built with the internal icon and Views rather than an emoji or image dependency.
- Headline **Ready when you are**.
- Supporting text explaining that the user can start an empty workout or use a routine from the Routines tab.
- One primary **Start workout** button.

Starting a workout keeps the current name-entry behavior. The modal is visually updated into a compact bottom-sheet-style card with a clear title, input, Cancel, and Start actions. It retains keyboard submission and default-name behavior.

## Active Workout structure

### Session header

The header contains:

- Small **Workout in progress** label.
- Workout name as the primary heading.
- Compact elapsed timer directly below the name.
- 44-point pause/resume control aligned to the right.
- Completed-set summary and percentage.
- Thin animated progress bar.

The session header is visually integrated with the background rather than enclosed in a large card. It scrolls with content; introducing a collapsing or sticky secondary header is deferred until physical testing proves it necessary.

### Exercise cards

Each exercise remains a focused card because it groups repeated set inputs. The card includes:

- Exercise title.
- Quiet menu button with a 44-point target.
- Column labels for set, kilograms, reps, and completion.
- At least 44-point interactive set rows.
- Neutral inputs with strong numeric contrast.
- A soft tinted completed row plus accent check control.
- A compact **Add set** text action.

The existing remove confirmation remains. The menu gains an accessibility label containing the exercise name.

### Persistent workout actions

A floating action bar sits above the tab dock while a workout is active:

- Secondary **Add exercise** icon button with an accessibility label.
- Primary **Finish workout** button.

The primary finish action uses accent, not danger, because finishing is the successful path. Its existing validation and confirmation remain, but the confirmation's **Finish** button uses the normal action style rather than destructive red. **Cancel workout** stays as a quiet destructive text action after the exercise list and retains destructive confirmation.

The ScrollView adds enough bottom content inset that the final card and cancel action can scroll above both action and tab bars. The action bar does not render when no session exists.

## Exercise picker

Preserve the current exercise-picker behavior and search/library content. Restyle its sheet, search field, rows, section labels, close control, and selected/pressed feedback to match the new tokens. Functional changes to filtering or exercise data are out of scope.

## Motion system

Use React Native's built-in `Animated` and `LayoutAnimation` APIs. Do not add Reanimated for this phase.

Motion is short and functional:

- Set completion: check control scales from 0.92 to 1 with a tight spring while row tint fades in.
- Session progress: bar width eases to the new percentage over roughly 200 ms.
- Exercise add/remove: surrounding cards settle with a brief layout animation.
- Pause/resume: icon crossfade or scale transition.
- Tab selection: selected icon settles from 0.94 to 1 and tint changes.
- Modal/sheet: use existing native fade/slide behavior, not custom choreography.

No repeated pulsing, glowing, bouncing, parallax, or timer animation is added. Input updates and navigation remain immediately interactive while animation runs.

Tokenized durations are 160 ms for direct control feedback and 220 ms for progress or layout settling. The completion spring uses a tight, low-bounce configuration and never blocks the next tap.

A small `useReducedMotion` hook reads the platform setting and subscribes to changes. With Reduce Motion enabled, layout movement and scale effects are disabled; state colors, checkmarks, labels, and progress values still communicate every change.

## Components and boundaries

### Shared foundation

- `tokens.ts` owns semantic colors, spacing, radii, sizes, and animation durations.
- A small internal icon module owns the five tab icons and workout action glyphs.
- `useReducedMotion` owns the system preference and has no workout dependency.

### Navigation

- The tab layout configures routing, safe-area dimensions, blur background, and labels.
- A reusable animated tab icon owns only selection presentation and active-workout badge rendering.

### Workout composition

- `WorkoutScreen` remains the behavioral coordinator for start, finish, cancel, picker, and alerts.
- `SessionHeader` owns session summary, timer, pause/resume, and progress presentation.
- `ExerciseCard` owns the exercise group and layout animation boundary.
- `SetRow` owns numeric inputs and completion feedback.
- A new focused action-bar component owns the persistent Add/Finish layout and receives callbacks; it does not access storage.

Avoid moving stable workout behavior merely to make the files look different. Refactor only where a clear visual component boundary reduces `WorkoutScreen` size or prevents duplicated layout logic.

## Accessibility

- All icon-only controls have descriptive accessibility labels and button roles.
- Interactive targets are at least 44 by 44 points.
- Text and meaningful controls maintain usable contrast against their surfaces.
- Completion is communicated by checkmark, label/state, and color—not color alone.
- Tab destinations always include visible labels.
- Numeric fields preserve suitable keyboard types and return-key behavior.
- Dynamic timer text does not announce every second to VoiceOver.
- Reduce Motion is honored without removing state feedback.
- Text truncates safely rather than overlapping controls for longer workout or exercise names.

## Error and edge states

- Storage and finish errors retain the existing safe alerts and active session.
- Zero exercises displays the session header, persistent Add exercise action, and an inline prompt to add the first exercise.
- A long workout name truncates to one line without moving pause/resume offscreen.
- Many exercises remain scrollable above fixed bottom controls.
- Keyboard appearance cannot permanently hide or trap workout actions; inputs remain scrollable into view.
- Paused state remains visually distinct through icon and accessible label, not timer color alone.

## Testing and verification

Behavioral regression coverage remains mandatory for active-workout persistence, timer calculations, store mutations, finish durability, storage codecs, and utilities.

Add focused tests only for new pure behavior:

- Navigation metadata contains the five stable routes, labels, and icon identifiers.
- Motion preferences return zero/disabled transitions when Reduce Motion is enabled.
- Progress presentation clamps valid percentages without generating invalid widths.

Visual components are verified through TypeScript, an iOS production export, and focused manual review on the Mac iOS simulator. Windows cannot execute the iOS simulator, so the implementation must not claim physical or simulator visual verification from this machine.

Project verification:

```bash
npm ci
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo-doctor
npx expo export --platform ios --output-dir <temporary-directory> --clear
git diff --check
```

The later physical-device phase must verify one-handed reach, keyboard behavior, blur performance, safe-area spacing, animation feel, Reduce Motion, text scaling, and contrast on an iPhone.

## Delivery boundary

This phase ends when shared tokens, the five-tab navigation, Workout empty state, active Workout screen, session header, exercise cards, set rows, picker styling, persistent action bar, and specified motion are implemented, verified, committed, and pushed to `main`.

Home, Routines, Progress, and Library layout redesigns remain later sequential phases. Backup/export/restore remains specified but unimplemented and can resume after the UI sequence chosen by the user.
