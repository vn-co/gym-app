import type {
  PersonalRecord,
  WorkoutSession,
} from '../types';

export interface VolumeComparison {
  percentage: number | null;
  label: string;
}

export function getVolumeComparison(
  currentVolume: number,
  previous?: WorkoutSession,
): VolumeComparison {
  if (!previous) {
    return { percentage: null, label: 'First comparable workout' };
  }
  if (previous.totalVolume <= 0) {
    return { percentage: null, label: `Previous ${previous.name} had no volume` };
  }

  const percentage = Math.round(
    ((currentVolume - previous.totalVolume) / previous.totalVolume) * 100,
  );
  return {
    percentage,
    label: `vs last ${previous.name}`,
  };
}

export function findPreviousComparableWorkout(
  workoutName: string,
  sessions: WorkoutSession[],
): WorkoutSession | undefined {
  const comparableName = workoutName.trim().toLocaleLowerCase();
  return sessions.find(
    (session) => session.name.trim().toLocaleLowerCase() === comparableName,
  );
}

export function findNewPersonalRecords(
  session: WorkoutSession,
  existingRecords: PersonalRecord[],
): PersonalRecord[] {
  return session.exercises.flatMap((exercise) => {
    const bestSet = exercise.sets
      .filter((setEntry) => setEntry.completed && setEntry.weight > 0)
      .sort((a, b) => b.weight - a.weight)[0];
    if (!bestSet) return [];

    const previous = existingRecords.find(
      (record) => record.exerciseId === exercise.exerciseId,
    );
    if (previous && previous.weight >= bestSet.weight) return [];

    return [{
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      weight: bestSet.weight,
      reps: bestSet.reps,
      setAt: session.startTime,
      sessionId: session.id,
    }];
  });
}
