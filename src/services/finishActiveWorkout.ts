import type { ActiveSession, WorkoutSession } from '../types';
import { getElapsedSeconds } from '../store/activeSessionTimer';
import { calcVolume } from '../utils';

interface FinishDependencies {
  saveSession: (session: WorkoutSession) => Promise<void>;
  updatePersonalRecords: (session: WorkoutSession) => Promise<void>;
  clearActiveSession: () => void;
}

export async function finishActiveWorkout(
  session: ActiveSession,
  endTime: number,
  dependencies: FinishDependencies,
): Promise<WorkoutSession> {
  const completed: WorkoutSession = {
    id: session.sessionId,
    name: session.workoutName,
    startTime: session.startTime,
    endTime,
    durationSeconds: getElapsedSeconds(session, endTime),
    exercises: session.exercises,
    totalVolume: session.exercises.reduce(
      (total, exercise) => total + calcVolume(exercise.sets),
      0,
    ),
    totalSets: session.exercises.reduce(
      (total, exercise) =>
        total + exercise.sets.filter((setEntry) => setEntry.completed).length,
      0,
    ),
  };

  await dependencies.saveSession(completed);
  await dependencies.updatePersonalRecords(completed);
  dependencies.clearActiveSession();
  return completed;
}
