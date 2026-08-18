import type { StateStorage } from 'zustand/middleware';
import type { ActiveSession, SetEntry, WorkoutExercise } from '../types';

export type PersistenceOperation = 'read' | 'write' | 'remove';

export interface PersistenceIssue {
  id: number;
  operation: PersistenceOperation;
  message: string;
}

export interface PersistenceCallbacks {
  onIssue: (operation: PersistenceOperation, error: unknown) => void;
  onRecovered: () => void;
}

let issueSequence = 0;
let persistenceIssue: PersistenceIssue | null = null;
const issueListeners = new Set<() => void>();

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown storage error';
}

export function reportPersistenceIssue(
  operation: PersistenceOperation,
  error: unknown,
): void {
  const message = getErrorMessage(error);
  if (
    persistenceIssue?.operation === operation &&
    persistenceIssue.message === message
  ) {
    return;
  }

  persistenceIssue = { id: ++issueSequence, operation, message };
  issueListeners.forEach((listener) => listener());
}

export function clearPersistenceIssue(): void {
  if (persistenceIssue === null) return;
  persistenceIssue = null;
  issueListeners.forEach((listener) => listener());
}

export function getPersistenceIssueSnapshot(): PersistenceIssue | null {
  return persistenceIssue;
}

export function subscribePersistenceIssue(listener: () => void): () => void {
  issueListeners.add(listener);
  return () => issueListeners.delete(listener);
}

export const activeSessionPersistenceCallbacks: PersistenceCallbacks = {
  onIssue: reportPersistenceIssue,
  onRecovered: clearPersistenceIssue,
};

export function createOrderedStateStorage(
  base: StateStorage<Promise<void>>,
  callbacks: PersistenceCallbacks,
): {
  storage: StateStorage<Promise<void>>;
  flush: () => Promise<void>;
} {
  let tail = Promise.resolve();

  const enqueue = (
    operation: Exclude<PersistenceOperation, 'read'>,
    work: () => Promise<void>,
  ): Promise<void> => {
    const result = tail.then(async () => {
      try {
        await work();
        callbacks.onRecovered();
      } catch (error) {
        callbacks.onIssue(operation, error);
      }
    });
    tail = result;
    return result;
  };

  return {
    storage: {
      async getItem(name) {
        try {
          const value = await base.getItem(name);
          callbacks.onRecovered();
          return value;
        } catch (error) {
          callbacks.onIssue('read', error);
          throw error;
        }
      },
      setItem: (name, value) =>
        enqueue('write', () => base.setItem(name, value)),
      removeItem: (name) =>
        enqueue('remove', () => base.removeItem(name)),
    },
    flush: () => tail,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && value >= 0
  );
}

function isSetEntry(value: unknown): value is SetEntry {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonNegativeFiniteNumber(value.weight) &&
    isNonNegativeFiniteNumber(value.reps) &&
    typeof value.completed === 'boolean'
  );
}

function isWorkoutExercise(value: unknown): value is WorkoutExercise {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.exerciseId) &&
    isNonEmptyString(value.exerciseName) &&
    Array.isArray(value.sets) &&
    value.sets.every(isSetEntry)
  );
}

function isActiveSession(value: unknown): value is ActiveSession {
  return (
    isRecord(value) &&
    isNonEmptyString(value.sessionId) &&
    isNonEmptyString(value.workoutName) &&
    isNonNegativeFiniteNumber(value.startTime) &&
    isNonNegativeFiniteNumber(value.accumulatedMilliseconds) &&
    (value.runningSince === null ||
      isNonNegativeFiniteNumber(value.runningSince)) &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isWorkoutExercise)
  );
}

export function parsePersistedWorkoutState(
  value: unknown,
): { session: ActiveSession | null } {
  if (!isRecord(value) || !Object.hasOwn(value, 'session')) {
    throw new Error('Invalid active session data');
  }

  if (value.session === null) return { session: null };
  if (!isActiveSession(value.session)) {
    throw new Error('Invalid active session data');
  }
  return { session: value.session };
}
