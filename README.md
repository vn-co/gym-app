# Gym Tracker

Gym Tracker is an iOS-first Expo app for personal workout logging. It works
offline and keeps workouts, routines, personal records, custom exercises, and
unfinished-workout progress on the device.

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for installation, verification, and iPhone
development instructions.

## Workout experience

The current UI phase focuses on the complete Workout flow:

- Softer graphite surfaces with a restrained lime action color
- Rounded, translucent five-tab navigation with icons and labels
- A clear empty state and bottom sheet for naming a new workout
- An integrated active-workout timer and animated set progress
- Persistent Add exercise and Finish workout controls above navigation
- Larger set-entry targets, accessible completion controls, and brief feedback
- A matching searchable exercise picker with muscle-group filters
- Reduce Motion support for navigation, progress, set, and layout feedback

Active workout state and elapsed time survive backgrounding and app restarts.
Finishing a workout saves it before the unfinished draft is cleared; a failed
save leaves the workout open so it can be retried.

## UI scope

This release establishes the shared visual foundation and redesigns the Workout
screen first. Home, Routines, Progress, and Library use the new colors and tab
navigation, but their internal layouts remain future UI phases.

Automated checks and an iOS production bundle can be run from Windows. Final
visual review of blur, keyboard behavior, animations, Reduce Motion, and
one-handed reach still requires a Mac simulator and a physical iPhone.
