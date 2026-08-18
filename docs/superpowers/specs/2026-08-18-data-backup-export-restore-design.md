# Data Backup, Export, and Restore Design

**Date:** 2026-08-18
**Status:** Approved in conversation; written specification awaiting final review
**Scope:** Add automatic local recovery snapshots, reinstall-safe backup files, CSV workout export, and validated full-data restore without adding a dedicated data-management screen.

## Context

The app stores completed sessions, personal records, the display name, custom exercises, and routines in separate AsyncStorage keys. Active-workout persistence protects one unfinished workout through ordinary backgrounding, crashes, and relaunches, but the durable collections still have no versioned backup or restore path. Deleting the app can remove both AsyncStorage and files inside its private container.

The app has not yet been installed as a signed standalone iPhone build; it has only run in a Mac iOS simulator. Building automatic iCloud synchronization now would require an Apple Developer configuration, iCloud entitlements and containers, native synchronization behavior, and physical-device testing that the current distribution setup cannot support responsibly.

This design therefore separates two different safety goals:

1. Automatic local snapshots protect against a damaged local collection or a failed data change.
2. A user-saved backup in Files or iCloud Drive survives app deletion, simulator resets, reinstall, and device changes.

## Goals

- Preserve all durable personal data in one portable, versioned JSON format.
- Automatically maintain local recovery snapshots after durable data changes.
- Keep the three newest valid local snapshots and never remove an older snapshot until its replacement is fully written.
- Let the user save a current backup outside the app through the native iOS share sheet.
- Let the user restore either the newest automatic snapshot or a JSON backup selected from Files.
- Export completed workout sets as a spreadsheet-friendly CSV file.
- Validate an entire backup before changing any current data.
- Make restore crash-safe and recoverable if a write fails or the app terminates mid-restore.
- Keep all controls in a compact native action sheet opened from the existing Home avatar.
- Avoid a backend, account system, paid service, password management, and premature iCloud synchronization.

## Non-goals

- Automatic cross-device synchronization.
- Direct writes to an app-owned iCloud container.
- CloudKit, a hosted backend, accounts, or conflict resolution between devices.
- Including a currently active workout in portable or automatic backups.
- Importing CSV files. CSV is a human-readable export, not a lossless restore format.
- Password-encrypted backup files. Version 1 backups are readable JSON and must be stored somewhere the user trusts.
- A general Settings, Profile, or Data & Backup screen.
- UI redesign beyond making the avatar actionable and presenting native action sheets and alerts.

## Selected approach

Use a hybrid local-file workflow:

- Create rotating automatic snapshots in the app's document storage immediately after successful durable-data mutations. This work is triggered by saves rather than relying on iOS background execution, because iOS may suspend an app shortly after it leaves the foreground.
- Generate a fresh backup on demand and open the iOS share sheet so the user can save it to Files, iCloud Drive, AirDrop, or another chosen destination.
- Use the iOS document picker to select a portable JSON backup for restore.
- Use the same versioned JSON envelope for automatic snapshots and portable backups.
- Use pure codecs and validators for backup and CSV data, with thin adapters around AsyncStorage and Expo file APIs.

This approach is preferred over relying only on iPhone device backups because it gives the user an independent, inspectable restore file. It is preferred over immediate iCloud synchronization because it is testable in the current project, has no account or signing dependency, and avoids synchronization conflicts. Automatic iCloud storage can later consume the same versioned backup format when a signed standalone build and physical-device test path exist.

Relevant platform guidance:

- Apple notes that apps are typically suspended in the background and recommends using background modes sparingly: <https://developer.apple.com/documentation/Xcode/configuring-background-execution-modes>
- Apple documents iCloud containers and entitlements as explicit app capabilities: <https://developer.apple.com/documentation/Xcode/configuring-icloud-services>
- Expo SDK 57 provides maintained file, document-picker, and native sharing APIs: <https://docs.expo.dev/versions/latest/sdk/filesystem/>, <https://docs.expo.dev/versions/latest/sdk/document-picker/>, and <https://docs.expo.dev/versions/v57.0.0/sdk/sharing/>

## User experience

### Home entry point

The existing Home avatar becomes a touchable control. Tapping it opens a native action sheet titled **Data & Backup** with:

- **Save Backup to Files**
- **Restore Backup**
- **Export Workout CSV**
- **Cancel**

There is no new route, tab, settings page, or permanent dashboard card.

### Automatic recovery

The app maintains the three newest local JSON snapshots without asking the user. A snapshot is attempted after completed sessions, personal records, the display name, custom exercises, or routines change. Snapshot failure does not undo a successfully saved workout or other primary data. The failure is reported once, older snapshots remain intact, and the next durable change retries.

If startup detects malformed durable storage and a valid automatic snapshot exists, a native alert offers to recover the newest valid snapshot. The app never silently replaces current data. If no valid snapshot exists, it reports the problem without pretending recovery succeeded.

Choosing **Restore Backup** opens a second native action sheet with:

- **Latest Automatic Backup**, when one exists
- **Choose from Files**
- **Cancel**

### Saving an external backup

Choosing **Save Backup to Files** reads the current durable data, validates the generated payload, writes a temporary JSON file, and opens the native share sheet. The default filename is:

```text
gym-tracker-backup-YYYY-MM-DD-HHmmss.json
```

The share sheet lets the user choose the external destination. The app must not claim that the file was saved to iCloud Drive because the sharing API cannot verify which destination the user chose. Dismissing the share sheet leaves all app data unchanged.

This explicit save is the reinstall-safe boundary. Automatic snapshots inside the app protect local failures but are removed if the app container is deleted.

### Restoring

Portable restore accepts JSON backups only. The document picker copies the selected file into the app cache before reading it. After validation, an alert previews:

- Export date
- Number of completed workout sessions
- Number of personal records
- Number of routines
- Number of custom exercises
- Display name

The alert states that current durable data will be replaced. Nothing is written until the user confirms **Replace Data**.

Restore is blocked while an active workout exists. The user must finish or cancel that workout first so a restored exercise library or history cannot conflict with a live session.

After a successful restore, the app writes a new automatic snapshot, refreshes data-backed screens through their existing focus loaders, and reports success. The app does not force navigation.

### CSV export

Choosing **Export Workout CSV** writes one row per completed set and opens the native share sheet. The filename is:

```text
gym-workout-history-YYYY-MM-DD-HHmmss.csv
```

The CSV uses UTF-8, correct CSV quoting, ISO 8601 timestamps, and kilograms. Its columns are:

```text
session_id
workout_name
started_at
ended_at
duration_seconds
exercise_id
exercise_name
set_number
weight_kg
reps
volume_kg
session_notes
```

Only completed sets are exported. The JSON backup retains the exact stored workout structures, including any incomplete set entries that remain in completed sessions.

## Backup format

Version 1 uses a self-identifying JSON envelope:

```json
{
  "format": "gym-tracker-backup",
  "schemaVersion": 1,
  "exportedAt": "2026-08-18T12:34:56.000Z",
  "data": {
    "userName": "Vlad",
    "sessions": [],
    "personalRecords": [],
    "customExercises": [],
    "routines": []
  }
}
```

The format includes only durable data:

- `userName`
- `sessions`
- `personalRecords`
- `customExercises`
- `routines`

It deliberately excludes the active workout. An active workout is time-sensitive live state; copying it to another installation later could produce an incorrect elapsed duration or an accidental duplicate completion. The existing active-workout persistence remains responsible for same-install crash and relaunch recovery.

`schemaVersion` is independent of the app release version. Version 1 readers reject unsupported newer versions with a clear message. Future format changes add explicit migrations rather than guessing the meaning of old data.

## Validation rules

Validation is implemented with focused TypeScript type guards rather than adding a runtime schema dependency. The validator checks the complete object graph before restore, including:

- Exact format identifier and supported integer schema version
- Valid ISO export timestamp
- A trimmed display name between 1 and 80 characters
- Arrays for all durable collections
- Non-empty string IDs and names
- Supported muscle-group values
- Finite, non-negative weights and volume values
- Non-negative integer repetitions, durations, and set counts
- Finite timestamps and consistent optional fields
- Boolean set completion flags
- Structurally valid session exercises, routine exercises, custom exercises, and personal records
- A 10 MiB file-size limit before parsing

Unknown top-level format versions are rejected. Validation failure includes a safe, actionable reason but never echoes the entire imported file.

## Automatic snapshot lifecycle

Snapshots live in a dedicated directory under the app document directory. Each snapshot uses the portable format and a timestamped filename.

Snapshot writes follow this order:

1. Read all durable AsyncStorage values as one logical dataset.
2. Decode and validate that dataset.
3. Serialize a versioned backup envelope.
4. Write a new temporary file in the snapshot directory.
5. Read and validate the temporary file.
6. Move it to its final timestamped filename.
7. After the new snapshot is valid, delete snapshots older than the newest three.

Snapshot requests are serialized and coalesced so an older, slower request cannot become the newest recovery copy after a later mutation. A failed write leaves the previous snapshots untouched.

## Restore transaction and crash recovery

Restore is a full replacement, not a merge. Merge semantics would create duplicate sessions and ambiguous conflicts between routines, exercises, records, and IDs.

AsyncStorage stores the durable collections under separate keys, so a normal user-initiated restore uses a small journal to make replacement recoverable:

1. Validate the chosen backup completely.
2. Create and validate a pre-restore automatic snapshot.
3. Read the exact current raw values for every durable key.
4. Write a restore journal containing those previous raw values.
5. Batch-write the replacement values.
6. Read every key back and validate the reconstructed dataset.
7. Remove the restore journal only after verification succeeds.
8. Create a post-restore automatic snapshot.

If a write or verification step fails, the app restores the journaled values, verifies the rollback, and reports failure. If the app terminates with a journal present, a root startup recovery boundary restores the previous values before data-backed navigation renders, then clears the journal. The previous dataset is favored over completing an interrupted restore because it is the last state known to have been valid.

Corruption recovery is the explicit exception to step 2. When the current dataset is already invalid, the app cannot create a valid pre-restore snapshot. It still journals the exact invalid raw values for diagnosis and rollback, then replaces them with the user-confirmed newest valid automatic snapshot. No invalid snapshot is published as a recovery point.

The restore-journal boundary always settles and never leaves startup waiting indefinitely. If rollback itself fails, it reports the unresolved storage error, retains the journal for the next launch, and allows the existing screen-level storage errors to remain visible rather than claiming the data is healthy.

## Components and boundaries

The implementation should keep the following responsibilities separate:

### Backup codec

- Defines the versioned envelope.
- Builds a backup from decoded durable data.
- Parses and validates imported or snapshotted JSON.
- Has no React Native, Expo, filesystem, or AsyncStorage dependency.

### CSV codec

- Converts completed sessions to deterministic CSV.
- Owns column order, ISO timestamp conversion, completed-set filtering, and escaping.
- Has no platform dependency.

### Durable-data adapter

- Reads all backup-relevant AsyncStorage keys.
- Converts validated backup data into exact storage values.
- Owns the restore journal, verified replacement, and rollback.
- Does not know about action sheets, alerts, document picking, or sharing.

### Snapshot service

- Builds, validates, rotates, and lists local automatic snapshots.
- Serializes/coalesces snapshot requests.
- Exposes the newest valid snapshot for recovery.
- Does not import the existing high-level storage service, avoiding a circular dependency.

### Portable-file service

- Uses Expo FileSystem for temporary files.
- Uses Expo Sharing to present backup and CSV files.
- Uses Expo DocumentPicker with immediate cache copying for restore selection.
- Does not perform restore writes itself.

### Startup recovery boundaries

- An outer restore-journal boundary resolves an interrupted restore before the existing workout-persistence gate hydrates and before navigation renders.
- The existing workout-persistence gate then hydrates the active session.
- An inner durable-data health boundary validates the durable collections and offers the latest valid automatic snapshot when possible.
- If an active workout exists, corruption recovery is deferred until the workout is finished or cancelled, preserving the same active-workout guard as manual restore.
- Neither boundary redirects after successful recovery.

### Home action coordinator

- Opens native action sheets and confirmation alerts.
- Checks active-workout state before restore.
- Orchestrates services and presents success or failure messages.
- Keeps file and storage logic outside `HomeScreen`.

## Error handling

- Cancellation of a share sheet, document picker, restore preview, or confirmation is a normal outcome and produces no error alert.
- Invalid, oversized, unreadable, or unsupported backup files never trigger writes.
- A restore error preserves or rolls back to the previously validated dataset.
- An interrupted restore is recovered before the normal app UI renders.
- Automatic snapshot failure never changes the result of the primary durable save.
- Repeated automatic snapshot failures are coalesced so the user is not flooded with alerts.
- Existing automatic snapshots are retained until a new snapshot has been written and validated.
- Temporary share and import files may be deleted after use; failure to delete a cache file is non-fatal.
- Share availability is checked before opening the native sheet.
- User-facing errors explain what remains safe and what action to retry.

## Dependencies

Install only Expo-maintained, SDK-aligned packages through `npx expo install`:

- `expo-file-system`
- `expo-document-picker`
- `expo-sharing`

No runtime validation, CSV, cloud, encryption, or state-management dependency is added.

## Test strategy

Pure codec tests cover:

- Deterministic backup generation.
- Acceptance of a complete valid version 1 backup.
- Rejection of malformed JSON, wrong format identifiers, unsupported versions, oversized input, invalid nested objects, invalid timestamps, and non-finite numbers.
- CSV column order, completed-set filtering, set numbering, volume calculations, ISO timestamps, Unicode, commas, quotes, and newlines.

Durable-data and restore tests use injected storage adapters to cover:

- Complete replacement of all durable keys.
- No writes before validation and confirmation.
- Pre-restore journal creation.
- Read-back verification.
- Rollback after a partial write or verification failure.
- Startup rollback when an interrupted journal exists.
- Journal retention if rollback cannot be verified.
- Active-workout restore blocking.

Snapshot tests use an injected file adapter to cover:

- Snapshot creation after a durable mutation.
- Temporary-file validation before publication.
- Retention of exactly the three newest valid snapshots.
- Preservation of older snapshots after write failure.
- Serialized/coalesced requests preserving newest data.
- Selection of the newest valid snapshot when a newer file is corrupt.

Project verification remains:

```bash
npm ci
npm run check
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo-doctor
npx expo export --platform ios --output-dir <temporary-directory> --clear
git diff --check
```

Physical iPhone verification remains a later explicit phase because the app does not yet have a standalone iPhone installation. That phase must verify the share sheet, saving into iCloud Drive, document selection, reinstall restore, and behavior when iCloud Drive is unavailable.

## Delivery boundary

This phase ends when the automatic snapshot, portable JSON backup, JSON restore, CSV export, compact avatar-menu controls, recovery behavior, tests, and documentation are implemented, verified, committed, and pushed to `main`.

It does not add automatic iCloud synchronization or perform the broader UI redesign. Those remain separate decisions after a signed standalone build and physical-device test path exist.
