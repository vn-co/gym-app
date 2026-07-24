import { create } from 'zustand';
import type { ActiveSession, WorkoutExercise, SetEntry } from '../types';
import { generateId } from '../utils';

interface WorkoutStore {
  session: ActiveSession | null;

  // Session lifecycle
  startSession: (name: string) => void;
  startSessionFromRoutine: (name: string, exercises: Omit<WorkoutExercise, 'id' | 'sets'>[], defaultSets: number, defaultReps: number, defaultWeight: number[]) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  cancelSession: () => void;
  tickSecond: () => void;

  // Exercise management
  addExercise: (exercise: Omit<WorkoutExercise, 'id' | 'sets'>) => void;
  removeExercise: (exerciseId: string) => void;

  // Set management
  addSet: (workoutExerciseId: string, set?: Partial<SetEntry>) => void;
  updateSet: (workoutExerciseId: string, setId: string, updates: Partial<SetEntry>) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  toggleSetComplete: (workoutExerciseId: string, setId: string) => void;

  // Selectors
  completedSetsCount: () => number;
  totalSetsCount: () => number;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  session: null,

  startSession: (name) => {
    set({
      session: {
        sessionId: generateId(),
        workoutName: name,
        startTime: Date.now(),
        elapsedSeconds: 0,
        exercises: [],
        isRunning: true,
        isPaused: false,
      },
    });
  },

  startSessionFromRoutine: (name, exerciseDefs, defaultSetsArr, defaultRepsArr, defaultWeightsArr) => {
    const exercises: WorkoutExercise[] = exerciseDefs.map((def, i) => ({
      id: generateId(),
      exerciseId: def.exerciseId,
      exerciseName: def.exerciseName,
      sets: Array.from({ length: defaultSetsArr[i] ?? 3 }, () => ({
        id: generateId(),
        weight: defaultWeightsArr[i] ?? 0,
        reps: defaultRepsArr[i] ?? 10,
        completed: false,
      })),
    }));
    set({
      session: {
        sessionId: generateId(),
        workoutName: name,
        startTime: Date.now(),
        elapsedSeconds: 0,
        exercises,
        isRunning: true,
        isPaused: false,
      },
    });
  },

  pauseSession: () =>
    set((state) => ({
      session: state.session ? { ...state.session, isPaused: true, isRunning: false } : null,
    })),

  resumeSession: () =>
    set((state) => ({
      session: state.session ? { ...state.session, isPaused: false, isRunning: true } : null,
    })),

  cancelSession: () => set({ session: null }),

  tickSecond: () =>
    set((state) => {
      if (!state.session || !state.session.isRunning) return state;
      return {
        session: {
          ...state.session,
          elapsedSeconds: state.session.elapsedSeconds + 1,
        },
      };
    }),

  addExercise: (exercise) =>
    set((state) => {
      if (!state.session) return state;
      const newEx: WorkoutExercise = {
        ...exercise,
        id: generateId(),
        sets: [
          {
            id: generateId(),
            weight: 0,
            reps: 0,
            completed: false,
          },
        ],
      };
      return {
        session: {
          ...state.session,
          exercises: [...state.session.exercises, newEx],
        },
      };
    }),

  removeExercise: (exerciseId) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          exercises: state.session.exercises.filter((e) => e.id !== exerciseId),
        },
      };
    }),

  addSet: (workoutExerciseId, partial) =>
    set((state) => {
      if (!state.session) return state;
      const exercises = state.session.exercises.map((ex) => {
        if (ex.id !== workoutExerciseId) return ex;
        // Pre-fill from last set
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: SetEntry = {
          id: generateId(),
          weight: partial?.weight ?? lastSet?.weight ?? 0,
          reps: partial?.reps ?? lastSet?.reps ?? 0,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { session: { ...state.session, exercises } };
    }),

  updateSet: (workoutExerciseId, setId, updates) =>
    set((state) => {
      if (!state.session) return state;
      const exercises = state.session.exercises.map((ex) => {
        if (ex.id !== workoutExerciseId) return ex;
        const sets = ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s));
        return { ...ex, sets };
      });
      return { session: { ...state.session, exercises } };
    }),

  removeSet: (workoutExerciseId, setId) =>
    set((state) => {
      if (!state.session) return state;
      const exercises = state.session.exercises.map((ex) => {
        if (ex.id !== workoutExerciseId) return ex;
        return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
      });
      return { session: { ...state.session, exercises } };
    }),

  toggleSetComplete: (workoutExerciseId, setId) =>
    set((state) => {
      if (!state.session) return state;
      const exercises = state.session.exercises.map((ex) => {
        if (ex.id !== workoutExerciseId) return ex;
        const sets = ex.sets.map((s) =>
          s.id === setId ? { ...s, completed: !s.completed } : s,
        );
        return { ...ex, sets };
      });
      return { session: { ...state.session, exercises } };
    }),

  completedSetsCount: () => {
    const { session } = get();
    if (!session) return 0;
    return session.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0,
    );
  },

  totalSetsCount: () => {
    const { session } = get();
    if (!session) return 0;
    return session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  },
}));
