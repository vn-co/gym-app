import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findNewPersonalRecords,
  findPreviousComparableWorkout,
  getVolumeComparison,
} from '../src/utils/workoutCompletion.ts';

function workout(overrides = {}) {
  return {
    id: 'session_current',
    name: 'Push Day',
    startTime: 10_000,
    durationSeconds: 3_600,
    exercises: [],
    totalVolume: 1_120,
    totalSets: 4,
    ...overrides,
  };
}

test('compares volume neutrally with the previous comparable workout', () => {
  const previous = workout({ id: 'previous', totalVolume: 1_000 });
  assert.deepEqual(getVolumeComparison(1_120, previous), {
    percentage: 12,
    label: 'vs last Push Day',
  });
  assert.deepEqual(getVolumeComparison(900, previous), {
    percentage: -10,
    label: 'vs last Push Day',
  });
  assert.equal(getVolumeComparison(900).percentage, null);
});

test('finds the latest comparable workout without matching casing', () => {
  const latest = workout({ id: 'latest', name: 'push day' });
  assert.equal(
    findPreviousComparableWorkout('Push Day', [
      workout({ id: 'other', name: 'Legs' }),
      latest,
    ]),
    latest,
  );
});

test('reports only completed weight records that beat saved records', () => {
  const session = workout({
    exercises: [
      {
        id: 'workout_bench',
        exerciseId: 'bench_press',
        exerciseName: 'Bench Press',
        sets: [
          { id: 'one', weight: 80, reps: 5, completed: true },
          { id: 'two', weight: 90, reps: 2, completed: false },
        ],
      },
      {
        id: 'workout_row',
        exerciseId: 'row',
        exerciseName: 'Row',
        sets: [{ id: 'three', weight: 50, reps: 8, completed: true }],
      },
    ],
  });

  const records = findNewPersonalRecords(session, [
    {
      exerciseId: 'bench_press',
      exerciseName: 'Bench Press',
      weight: 75,
      reps: 5,
      setAt: 1,
      sessionId: 'old',
    },
    {
      exerciseId: 'row',
      exerciseName: 'Row',
      weight: 55,
      reps: 6,
      setAt: 1,
      sessionId: 'old',
    },
  ]);

  assert.deepEqual(records.map(({ exerciseName, weight, reps }) => ({
    exerciseName,
    weight,
    reps,
  })), [{ exerciseName: 'Bench Press', weight: 80, reps: 5 }]);
});
