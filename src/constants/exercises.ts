import type { Exercise } from '../types';

export const EXERCISE_LIBRARY: Exercise[] = [
  // CHEST
  { id: 'bench_press', name: 'Bench Press', muscleGroup: 'chest', equipment: 'Barbell' },
  { id: 'incline_db_press', name: 'Incline DB Press', muscleGroup: 'chest', equipment: 'Dumbbell' },
  { id: 'cable_fly', name: 'Cable Fly', muscleGroup: 'chest', equipment: 'Cable' },
  { id: 'dips', name: 'Chest Dips', muscleGroup: 'chest', equipment: 'Bodyweight' },
  { id: 'push_up', name: 'Push Up', muscleGroup: 'chest', equipment: 'Bodyweight' },
  { id: 'pec_deck', name: 'Pec Deck', muscleGroup: 'chest', equipment: 'Machine' },

  // BACK
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'back', equipment: 'Barbell' },
  { id: 'pull_up', name: 'Pull Up', muscleGroup: 'back', equipment: 'Bodyweight' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'Cable' },
  { id: 'bent_over_row', name: 'Bent Over Row', muscleGroup: 'back', equipment: 'Barbell' },
  { id: 'cable_row', name: 'Cable Row', muscleGroup: 'back', equipment: 'Cable' },
  { id: 'db_row', name: 'Dumbbell Row', muscleGroup: 'back', equipment: 'Dumbbell' },

  // SHOULDERS
  { id: 'ohp', name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'Barbell' },
  { id: 'db_lateral_raise', name: 'DB Lateral Raise', muscleGroup: 'shoulders', equipment: 'Dumbbell' },
  { id: 'face_pull', name: 'Face Pull', muscleGroup: 'shoulders', equipment: 'Cable' },
  { id: 'db_front_raise', name: 'DB Front Raise', muscleGroup: 'shoulders', equipment: 'Dumbbell' },

  // LEGS
  { id: 'squat', name: 'Squat', muscleGroup: 'legs', equipment: 'Barbell' },
  { id: 'leg_press', name: 'Leg Press', muscleGroup: 'legs', equipment: 'Machine' },
  { id: 'romanian_dl', name: 'Romanian Deadlift', muscleGroup: 'legs', equipment: 'Barbell' },
  { id: 'leg_curl', name: 'Leg Curl', muscleGroup: 'legs', equipment: 'Machine' },
  { id: 'leg_extension', name: 'Leg Extension', muscleGroup: 'legs', equipment: 'Machine' },
  { id: 'lunges', name: 'Lunges', muscleGroup: 'legs', equipment: 'Bodyweight' },
  { id: 'hack_squat', name: 'Hack Squat', muscleGroup: 'legs', equipment: 'Machine' },

  // ARMS
  { id: 'barbell_curl', name: 'Barbell Curl', muscleGroup: 'biceps', equipment: 'Barbell' },
  { id: 'hammer_curl', name: 'Hammer Curl', muscleGroup: 'biceps', equipment: 'Dumbbell' },
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', muscleGroup: 'triceps', equipment: 'Cable' },
  { id: 'skull_crusher', name: 'Skull Crusher', muscleGroup: 'triceps', equipment: 'Barbell' },
  { id: 'overhead_tricep', name: 'Overhead Tricep Extension', muscleGroup: 'triceps', equipment: 'Dumbbell' },

  // CORE
  { id: 'plank', name: 'Plank', muscleGroup: 'core', equipment: 'Bodyweight' },
  { id: 'cable_crunch', name: 'Cable Crunch', muscleGroup: 'core', equipment: 'Cable' },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', muscleGroup: 'core', equipment: 'Bodyweight' },

  // CALVES
  { id: 'calf_raise', name: 'Calf Raise', muscleGroup: 'calves', equipment: 'Machine' },
];

export function mergeExerciseLibrary(custom: Exercise[]): Exercise[] {
  return [...custom, ...EXERCISE_LIBRARY];
}

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  calves: 'Calves',
  forearms: 'Forearms',
  full_body: 'Full Body',
};
