import assert from 'node:assert/strict';
import test from 'node:test';
import { useWorkoutStore } from '../src/store/workoutStore.ts';

test('starts a routine with each exercise defaults', () => {
  useWorkoutStore.getState().cancelSession();
  useWorkoutStore.getState().startSessionFromRoutine('Push', [
    {
      exerciseId: 'bench_press',
      exerciseName: 'Bench Press',
      muscleGroup: 'chest',
      defaultSets: 2,
      defaultReps: 8,
      defaultWeight: 60,
    },
  ]);

  const exercise = useWorkoutStore.getState().session?.exercises[0];
  assert.equal(exercise?.sets.length, 2);
  assert.deepEqual(
    exercise?.sets.map(({ weight, reps, completed }) => ({
      weight,
      reps,
      completed,
    })),
    [
      { weight: 60, reps: 8, completed: false },
      { weight: 60, reps: 8, completed: false },
    ],
  );
});
