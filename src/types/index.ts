// ─── Exercise Library ───────────────────────────────────────────────────────

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'calves'
  | 'forearms'
  | 'full_body';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  notes?: string;
}

// ─── Workout Data ────────────────────────────────────────────────────────────

export interface SetEntry {
  id: string;
  weight: number;    // lbs
  reps: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: SetEntry[];
}

export interface WorkoutSession {
  id: string;
  name: string;
  startTime: number;   // ms timestamp
  endTime?: number;    // ms timestamp
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalVolume: number; // lbs
  totalSets: number;
  notes?: string;
}

// ─── Active Session (Zustand) ────────────────────────────────────────────────

export interface ActiveSession {
  sessionId: string;
  workoutName: string;
  startTime: number;
  elapsedSeconds: number;
  exercises: WorkoutExercise[];
  isRunning: boolean;
  isPaused: boolean;
}

// ─── Personal Records ────────────────────────────────────────────────────────

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  setAt: number; // ms timestamp
  sessionId: string;
}

// ─── Progress Analytics ──────────────────────────────────────────────────────

export type ProgressRange = '7d' | '1m' | '1y';

export interface ProgressDataPoint {
  date: string;       // 'Mon', 'Tue' etc or date string
  timestamp: number;
  volume: number;
}

export interface ProgressStats {
  low: number;
  avg: number;
  peak: number;
  percentChange: number;
}

// ─── Routines ────────────────────────────────────────────────────────────────

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number; // lbs, 0 = bodyweight
}

export interface Routine {
  id: string;
  name: string;          // "Push Day", "Pull Day", "Legs"
  emoji: string;         // user-chosen emoji for the card
  exercises: RoutineExercise[];
  createdAt: number;
  lastUsedAt?: number;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  SESSIONS: 'gym_sessions',
  PERSONAL_RECORDS: 'gym_prs',
  USER_NAME: 'gym_user_name',
  CUSTOM_EXERCISES: 'gym_custom_exercises',
  ROUTINES: 'gym_routines',
} as const;
