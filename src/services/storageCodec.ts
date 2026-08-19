import type { WorkoutSession } from '../types';

export function parseStoredArray<T>(raw: string | null, key: string): T[] {
  if (raw === null) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new TypeError('Expected an array');
    }
    return parsed as T[];
  } catch (cause) {
    throw new Error(`Invalid stored data for ${key}`, { cause });
  }
}

export function upsertWorkoutSession(
  sessions: WorkoutSession[],
  session: WorkoutSession,
): WorkoutSession[] {
  const workoutUuid = session.health?.workoutUuid;
  const existingIndex = sessions.findIndex(
    (saved) =>
      saved.id === session.id ||
      (workoutUuid !== undefined &&
        saved.health?.workoutUuid === workoutUuid),
  );
  if (existingIndex < 0) return [session, ...sessions];

  const updated = [...sessions];
  const existing = updated[existingIndex];
  updated[existingIndex] = {
    ...session,
    id: existing.id,
  };
  return updated;
}
