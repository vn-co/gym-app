import type { PersonalRecord, WorkoutSession } from '../types';

export function buildPersonalRecordHistory(
  sessions: WorkoutSession[],
): PersonalRecord[] {
  const bestWeights = new Map<string, number>();
  const history: PersonalRecord[] = [];

  const chronological = [...sessions].sort(
    (left, right) => left.startTime - right.startTime,
  );
  for (const session of chronological) {
    for (const exercise of session.exercises) {
      const bestSet = exercise.sets
        .filter((setEntry) => setEntry.completed && setEntry.weight > 0)
        .sort((left, right) => right.weight - left.weight)[0];
      if (!bestSet) continue;

      const previousBest = bestWeights.get(exercise.exerciseId) ?? 0;
      if (bestSet.weight <= previousBest) continue;
      bestWeights.set(exercise.exerciseId, bestSet.weight);
      history.push({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        weight: bestSet.weight,
        reps: bestSet.reps,
        setAt: session.startTime,
        sessionId: session.id,
      });
    }
  }

  return history.sort((left, right) => right.setAt - left.setAt);
}
