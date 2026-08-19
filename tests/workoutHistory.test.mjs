import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPersonalRecordHistory } from '../src/utils/workoutHistory.ts';

function session(id, startTime, weight, completed = true) {
  return {
    id,
    name: 'Push Day',
    startTime,
    durationSeconds: 3_600,
    totalVolume: weight * 5,
    totalSets: 1,
    exercises: [
      {
        id: `workout_${id}`,
        exerciseId: 'bench_press',
        exerciseName: 'Bench Press',
        sets: [{ id: `set_${id}`, weight, reps: 5, completed }],
      },
    ],
  };
}

test('reconstructs PR history chronologically from completed local workouts', () => {
  const history = buildPersonalRecordHistory([
    session('latest', 3_000, 90),
    session('first', 1_000, 60),
    session('middle', 2_000, 80),
  ]);

  assert.deepEqual(
    history.map(({ sessionId, weight }) => ({ sessionId, weight })),
    [
      { sessionId: 'latest', weight: 90 },
      { sessionId: 'middle', weight: 80 },
      { sessionId: 'first', weight: 60 },
    ],
  );
});

test('ignores incomplete and non-record sets', () => {
  const history = buildPersonalRecordHistory([
    session('first', 1_000, 70),
    session('lower', 2_000, 65),
    session('incomplete', 3_000, 100, false),
  ]);

  assert.deepEqual(
    history.map(({ sessionId, weight }) => ({ sessionId, weight })),
    [{ sessionId: 'first', weight: 70 }],
  );
});
