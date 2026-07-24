import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, type WorkoutSession, type PersonalRecord, type Exercise, type Routine } from '../types';

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
    return raw ? (JSON.parse(raw) as WorkoutSession[]) : [];
  } catch {
    return [];
  }
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const sessions = await getSessions();
  const existing = sessions.findIndex((s) => s.id === session.id);
  if (existing >= 0) {
    sessions[existing] = session;
  } else {
    sessions.unshift(session);
  }
  await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await getSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
}

export async function getSessionsInRange(
  fromTimestamp: number,
  toTimestamp: number,
): Promise<WorkoutSession[]> {
  const sessions = await getSessions();
  return sessions.filter(
    (s) => s.startTime >= fromTimestamp && s.startTime <= toTimestamp,
  );
}

// ─── Personal Records ────────────────────────────────────────────────────────

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS);
    return raw ? (JSON.parse(raw) as PersonalRecord[]) : [];
  } catch {
    return [];
  }
}

export async function updatePersonalRecords(
  session: WorkoutSession,
): Promise<void> {
  const prs = await getPersonalRecords();

  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (!set.completed || set.weight === 0) continue;
      const existing = prs.find((pr) => pr.exerciseId === ex.exerciseId);
      if (!existing || set.weight > existing.weight) {
        const idx = prs.findIndex((pr) => pr.exerciseId === ex.exerciseId);
        const newPR: PersonalRecord = {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          weight: set.weight,
          reps: set.reps,
          setAt: session.startTime,
          sessionId: session.id,
        };
        if (idx >= 0) {
          prs[idx] = newPR;
        } else {
          prs.push(newPR);
        }
      }
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(prs));
}

// ─── User Name ───────────────────────────────────────────────────────────────

export async function getUserName(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME)) ?? 'Athlete';
  } catch {
    return 'Athlete';
  }
}

export async function setUserName(name: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
}

// ─── Custom Exercises ─────────────────────────────────────────────────────────

export async function getCustomExercises(): Promise<Exercise[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES);
    return raw ? (JSON.parse(raw) as Exercise[]) : [];
  } catch {
    return [];
  }
}

export async function saveCustomExercise(exercise: Exercise): Promise<void> {
  const exercises = await getCustomExercises();
  exercises.unshift(exercise);
  await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(exercises));
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const exercises = await getCustomExercises();
  const filtered = exercises.filter((e) => e.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(filtered));
}

// ─── Routines ─────────────────────────────────────────────────────────────────

export async function getRoutines(): Promise<Routine[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ROUTINES);
    return raw ? (JSON.parse(raw) as Routine[]) : [];
  } catch {
    return [];
  }
}

export async function saveRoutine(routine: Routine): Promise<void> {
  const routines = await getRoutines();
  const idx = routines.findIndex((r) => r.id === routine.id);
  if (idx >= 0) {
    routines[idx] = routine;
  } else {
    routines.unshift(routine);
  }
  await AsyncStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
}

export async function deleteRoutine(id: string): Promise<void> {
  const routines = await getRoutines();
  const filtered = routines.filter((r) => r.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(filtered));
}

export async function touchRoutineLastUsed(id: string): Promise<void> {
  const routines = await getRoutines();
  const idx = routines.findIndex((r) => r.id === id);
  if (idx >= 0) {
    routines[idx] = { ...routines[idx], lastUsedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  }
}
