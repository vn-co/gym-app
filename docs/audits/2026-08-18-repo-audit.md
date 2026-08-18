# Gym App Repository Audit

**Date:** 2026-08-18
**Repository:** `vn-co/gym-app`
**Branch audited:** `main` at `5172504`
**Scope:** Build health, TypeScript, data integrity, state, analytics, dependencies, security, usability, accessibility, documentation, and unnecessary complexity.

## Outcome

The app has a sensible small-project structure, thin Expo Router routes, strict TypeScript enabled, a single persistence service, and no backend or network attack surface. The audited commit was not reproducible or release-ready: a clean install failed, the iOS export failed, TypeScript reported five errors, Expo Doctor reported four failed checks, and the one-year analytics view dropped most valid workouts.

The stabilization work in `docs/superpowers/plans/2026-08-18-gym-app-stabilization.md` fixes the verified build and behavior defects without redesigning the product.

## Stabilization result

The verified repair pass completed on `main` with these outcomes:

- `npm ci` succeeds from the committed manifest and lockfile.
- Strict TypeScript and unused-declaration checks pass.
- Eight regression tests pass across routine defaults, progress buckets, comparison windows, numeric input, storage decoding, and custom exercise merging.
- Expo Doctor passes all 21 checks.
- Metro exports the production iOS bundle successfully.
- Storage read/parse failures now stop read-modify-write operations and display a user-facing error rather than presenting empty history.
- Manual workouts can select saved custom exercises.
- The dependency audit still reports 23 transitive advisories (15 high, 8 moderate, 0 critical). They remain documented because npm's forced fix proposes unsupported Expo/React Native downgrades.

## Post-audit follow-up: active workout recovery

The 2026-08-18 recovery phase resolves the memory-only active-workout risk:

- One versioned active session is persisted through Zustand and AsyncStorage.
- Meaningful workout mutations are written in order; the timer display does not write once per second.
- Running duration is derived from timestamps, so backgrounding and process termination do not undercount it.
- Explicitly paused time remains paused after restoration.
- Startup hydration settles before workout-dependent navigation renders and does not force a redirect.
- Corrupt or unavailable active-session storage surfaces one coalesced warning without discarding the in-memory workout.
- Completion clears the active draft only after both the completed session and personal records save successfully.

## Verified findings

| Priority | Finding | Evidence | Disposition |
| --- | --- | --- | --- |
| P0 | Clean installs are broken because `package-lock.json` does not describe the peer dependency tree required by `package.json`. | `npm ci` exits with `EUSAGE` and dozens of missing lock entries. Git history shows commit `b69f742` removed 442 lockfile lines while changing dependencies. | Fix now. |
| P0 | The project does not bundle from a fresh checkout. | `npx expo export --platform ios` cannot resolve `babel-preset-expo` through the project-level stock Babel config. | Delete the unnecessary stock Babel config and verify a production bundle. |
| P0 | Expo configuration is invalid for the installed SDK. | Expo Doctor rejects legacy `expo.splash`, cannot find `assets/icon.png`, reports missing direct peer `expo-constants`, and detects the Hermes regression in React Native `0.86.0`. | Fix config, use the existing asset path, add the required Expo modules, and align React Native to `0.86.2`. |
| P0 | Strict TypeScript does not pass. | `npx tsc --noEmit` reports an unsupported `StatusBar` prop and a scalar/array contract mismatch in `startSessionFromRoutine`. | Fix now and enforce typechecking through an npm script. |
| P1 | The one-year progress chart ignores six days out of every seven. | `buildProgressData(..., '1y')` creates weekly labels but filters each bucket through only a 24-hour window. A session from yesterday produced `chartedVolume: 0`. | Add regression coverage and use real seven-day buckets. |
| P1 | Storage corruption or read failure is reported as valid empty data. A later write can then overwrite recoverable history with a new empty-based list. | Every collection getter catches all errors and returns `[]`; every save performs read-modify-write. | Make missing data return `[]`, but propagate invalid JSON and I/O failures; show user-facing errors and keep the active form/session intact. |
| P1 | Active workouts exist only in memory. An app reload, process eviction, or crash loses the current workout. The one-second counter can also undercount while iOS backgrounds the app. | The Zustand store has no hydration/persistence and `tickSecond` only increments from a foreground interval. | Resolved 2026-08-18 with versioned session persistence, ordered writes, startup hydration, and timestamp-derived timing. |
| P1 | Local history has no schema version, migration, export, or backup path. Uninstalling the app can permanently remove all workout data. | Raw unversioned arrays are stored only in AsyncStorage. | Deferred product/data task before long-term daily use. |
| P2 | Custom exercises cannot be added to an empty/manual workout. | `ExercisePicker` reads only `EXERCISE_LIBRARY`; Routines and Library separately merge custom exercises. | Fix now with one shared merge function and an injected picker list. |
| P2 | Progress UI can claim that a selected range has data when all sessions are outside that range. Seven-day percent change compares unequal windows. | `hasData` checks all stored sessions; the split is 3 days versus 4 days. | Fix now with point-level data detection and equal comparison windows. |
| P2 | Calendar boundaries assume every day is exactly 86,400,000 ms. That is false across daylight-saving changes in Europe/Paris. | Progress and weekly consistency add milliseconds instead of advancing calendar dates. | Fix now and cover the shared date-bucket behavior. |
| P2 | Decimal input is fragile for comma-decimal locales and accepts numeric prefixes such as `12abc`. | Weight fields use `parseFloat` directly. | Normalize comma decimals and reject non-finite, negative, and malformed values. |
| P2 | There is no loading-error state, route error boundary, or meaningful accessibility metadata on icon-only controls. | Screens assume storage succeeds; interactive emoji/glyph controls lack roles and labels. | Storage feedback is fixed now. Error boundaries and accessibility move with the planned UI redesign so the interaction layer is changed once. |
| P2 | The setup guide and ignore file are stale or malformed. | The guide documents four tabs, pounds, and missing features that now exist. `.gitignore` begins with shell command text and `expo-env.d.ts` is tracked despite being generated. | Fix now. |
| P3 | Several files contain dead imports/variables, while stock config wrappers and unused exported helpers add maintenance surface. | `tsc --noUnusedLocals --noUnusedParameters` reports 19 unused declarations. Repository search finds no callers for several exported helpers. | Remove proven local dead code now; list larger deletions below for a later cleanup decision. |

## Dependency and security review

- No credentials, private keys, environment files, or obvious secrets are tracked.
- The app has no API client, authentication, analytics SDK, ads, or remote database. Its runtime network and account blast radius is therefore very small.
- AsyncStorage is not encrypted. Workout history and the display name should be treated as device-local convenience data, not secret storage.
- npm currently reports transitive advisories through Expo, Metro, React Native, and their build tooling. npm's suggested forced remediation downgrades Expo/React Native across major compatibility boundaries, so `npm audit fix --force` is not an acceptable repair. Reassess after aligning the supported SDK 57 patch versions and on each future Expo SDK upgrade.

## UI and interaction map

- **Home:** greeting, empty-workout CTA, routine shortcuts, weekly consistency, recent sessions.
- **Workout:** session name modal, timer/pause, exercise picker, set entry/completion, finish/cancel.
- **Routines:** routine list, create/edit builder, exercise defaults, start/delete.
- **Progress:** range selector, volume chart, low/average/peak, personal records.
- **Library:** search/grouped exercise list, custom exercise creation/deletion.

The current UI is functional but visually uniform: rounded cards, borders, emoji icons, and equal visual weight are repeated across every screen. The redesign should establish typography, surface hierarchy, iconography, controls, accessibility, motion/haptics, and dense workout-specific set interactions before changing screens. Workout should be the first redesigned screen, then the system should propagate to Home, Routines, Progress, and Library.

## Ponytail complexity audit

Ranked, report-only findings:

1. `delete:` remove the unread `lastUsedAt` field and `touchRoutineLastUsed` write path unless routines will actually be sorted by recency. Replacement: nothing. [`src/types/index.ts`, `src/services/storage.ts`, Home/Routines screens]
2. `native:` delete stock `babel.config.js` and `metro.config.js` wrappers. Replacement: Expo defaults; add a config file only when customization exists.
3. `delete:` remove unused store/service APIs (`removeSet`, `deleteSession`, `getSessionsInRange`) until a UI path consumes them. Replacement: nothing.
4. `delete:` remove unused formatters and declarations (`formatDuration`, `formatDate`, `muscleGroups`, unused imports, and the unused `now`). Replacement: nothing.
5. `shrink:` use one exercise-library merge function instead of rebuilding `[...custom, ...static]` in multiple screens. Replacement: a small pure helper.
6. `shrink:` the routine builder and workout picker duplicate search/filter/chip UI. Replacement: one picker during the UI redesign, when its final interaction is known.

`net: approximately -70 lines, -1 unnecessary direct dependency possible.`

## Deferred sequence

1. Add versioned storage migrations plus JSON/CSV export and an import/restore path.
2. Redesign Workout using real mobile reference patterns, then propagate the design system and accessibility semantics.
3. Test the release UI on the physical iPhone.
4. Add EAS internal-distribution configuration and produce the standalone iOS build.
