import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';
import {
  STORAGE_KEYS,
  type ActiveSession,
  type RoutineExercise,
  type SetEntry,
  type WorkoutExercise,
} from '../types';
import { generateId } from '../utils';
import {
  pauseActiveSession,
  resumeActiveSession,
} from './activeSessionTimer';
import {
  activeSessionPersistenceCallbacks,
  createOrderedStateStorage,
  parsePersistedWorkoutState,
  type PersistenceCallbacks,
} from './activeSessionPersistence';

export interface WorkoutStore {
  session: ActiveSession | null;

  startSession: (name: string) => void;
  startSessionFromRoutine: (
    name: string,
    exercises: RoutineExercise[],
  ) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  cancelSession: () => void;
  renameSession: (name: string) => void;

  addExercise: (exercise: Omit<WorkoutExercise, 'id' | 'sets'>) => void;
  removeExercise: (exerciseId: string) => void;
  replaceExercise: (
    workoutExerciseId: string,
    exercise: Omit<WorkoutExercise, 'id' | 'sets'>,
  ) => void;
  moveExercise: (workoutExerciseId: string, toIndex: number) => void;

  addSet: (workoutExerciseId: string, set?: Partial<SetEntry>) => void;
  updateSet: (
    workoutExerciseId: string,
    setId: string,
    updates: Partial<SetEntry>,
  ) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  toggleSetComplete: (workoutExerciseId: string, setId: string) => void;

  completedSetsCount: () => number;
  totalSetsCount: () => number;
}

const createWorkoutState: StateCreator<WorkoutStore> = (set, get) => ({
  session: null,

  startSession: (name) => {
    const now = Date.now();
    set({
      session: {
        sessionId: generateId(),
        workoutName: name,
        startTime: now,
        accumulatedMilliseconds: 0,
        runningSince: now,
        exercises: [],
      },
    });
  },

  startSessionFromRoutine: (name, routineExercises) => {
    const now = Date.now();
    const exercises: WorkoutExercise[] = routineExercises.map((exercise) => ({
      id: generateId(),
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      sets: Array.from({ length: exercise.defaultSets }, () => ({
        id: generateId(),
        weight: exercise.defaultWeight,
        reps: exercise.defaultReps,
        completed: false,
      })),
    }));
    set({
      session: {
        sessionId: generateId(),
        workoutName: name,
        startTime: now,
        accumulatedMilliseconds: 0,
        runningSince: now,
        exercises,
      },
    });
  },

  pauseSession: () =>
    set((state) => ({
      session: state.session
        ? pauseActiveSession(state.session, Date.now())
        : null,
    })),

  resumeSession: () =>
    set((state) => ({
      session: state.session
        ? resumeActiveSession(state.session, Date.now())
        : null,
    })),

  cancelSession: () => set({ session: null }),

  renameSession: (name) =>
    set((state) =>
      state.session
        ? { session: { ...state.session, workoutName: name } }
        : state,
    ),

  addExercise: (exercise) =>
    set((state) => {
      if (!state.session) return state;
      const newExercise: WorkoutExercise = {
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
          exercises: [...state.session.exercises, newExercise],
        },
      };
    }),

  removeExercise: (exerciseId) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          exercises: state.session.exercises.filter(
            (exercise) => exercise.id !== exerciseId,
          ),
        },
      };
    }),

  replaceExercise: (workoutExerciseId, replacement) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          exercises: state.session.exercises.map((exercise) =>
            exercise.id === workoutExerciseId
              ? { ...exercise, ...replacement }
              : exercise,
          ),
        },
      };
    }),

  moveExercise: (workoutExerciseId, toIndex) =>
    set((state) => {
      if (!state.session) return state;
      const fromIndex = state.session.exercises.findIndex(
        (exercise) => exercise.id === workoutExerciseId,
      );
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        toIndex >= state.session.exercises.length ||
        fromIndex === toIndex
      ) {
        return state;
      }
      const exercises = [...state.session.exercises];
      const [exercise] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, exercise);
      return { session: { ...state.session, exercises } };
    }),

  addSet: (workoutExerciseId, partial) =>
    set((state) => {
      if (!state.session) return state;
      const exercises = state.session.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet: SetEntry = {
          id: generateId(),
          weight: partial?.weight ?? lastSet?.weight ?? 0,
          reps: partial?.reps ?? lastSet?.reps ?? 0,
          completed: false,
        };
        return { ...exercise, sets: [...exercise.sets, newSet] };
      });
      return { session: { ...state.session, exercises } };
    }),

  updateSet: (workoutExerciseId, setId, updates) =>
    set((state) => {
      if (!state.session) return state;
      const exercises = state.session.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        const sets = exercise.sets.map((setEntry) =>
          setEntry.id === setId ? { ...setEntry, ...updates } : setEntry,
        );
        return { ...exercise, sets };
      });
      return { session: { ...state.session, exercises } };
    }),

  removeSet: (workoutExerciseId, setId) =>
    set((state) => {
      if (!state.session) return state;
      const exercises = state.session.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.filter((setEntry) => setEntry.id !== setId),
        };
      });
      return { session: { ...state.session, exercises } };
    }),

  toggleSetComplete: (workoutExerciseId, setId) =>
    set((state) => {
      if (!state.session) return state;
      const exercises = state.session.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        const sets = exercise.sets.map((setEntry) =>
          setEntry.id === setId
            ? { ...setEntry, completed: !setEntry.completed }
            : setEntry,
        );
        return { ...exercise, sets };
      });
      return { session: { ...state.session, exercises } };
    }),

  completedSetsCount: () => {
    const { session } = get();
    if (!session) return 0;
    return session.exercises.reduce(
      (count, exercise) =>
        count + exercise.sets.filter((setEntry) => setEntry.completed).length,
      0,
    );
  },

  totalSetsCount: () => {
    const { session } = get();
    if (!session) return 0;
    return session.exercises.reduce(
      (count, exercise) => count + exercise.sets.length,
      0,
    );
  },
});

export function createWorkoutStore(
  stateStorage: StateStorage<Promise<void>>,
  callbacks: PersistenceCallbacks = activeSessionPersistenceCallbacks,
) {
  const ordered = createOrderedStateStorage(stateStorage, callbacks);
  const store = create<WorkoutStore>()(
    persist(createWorkoutState, {
      name: STORAGE_KEYS.ACTIVE_SESSION,
      version: 1,
      storage: createJSONStorage(() => ordered.storage),
      partialize: (state) => ({ session: state.session }),
      skipHydration: true,
      merge: (persisted, current) =>
        persisted === undefined
          ? current
          : {
              ...current,
              ...parsePersistedWorkoutState(persisted),
            },
      migrate: (persisted, version) => {
        if (version === 0) return parsePersistedWorkoutState(persisted);
        throw new Error(`Unsupported active session version: ${version}`);
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) callbacks.onIssue('read', error);
      },
    }),
  );

  return { store, flushPersistence: ordered.flush };
}

const productionWorkoutStore = createWorkoutStore(AsyncStorage);

export const useWorkoutStore = productionWorkoutStore.store;
