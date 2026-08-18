import assert from 'node:assert/strict';
import test from 'node:test';
import { finishActiveWorkout } from '../src/services/finishActiveWorkout.ts';

const active = {
  sessionId: 'session_1',
  workoutName: 'Push',
  startTime: 1_000,
  accumulatedMilliseconds: 2_000,
  runningSince: 10_000,
  exercises: [
    {
      id: 'workout_exercise_1',
      exerciseId: 'bench_press',
      exerciseName: 'Bench Press',
      sets: [
        {
          id: 'set_1',
          weight: 60,
          reps: 8,
          completed: true,
        },
        {
          id: 'set_2',
          weight: 70,
          reps: 3,
          completed: false,
        },
      ],
    },
  ],
};

test('saves the completed workout before clearing its active draft', async () => {
  const calls = [];
  const completed = await finishActiveWorkout(active, 13_500, {
    saveSession: async (session) => calls.push(['session', session.id]),
    updatePersonalRecords: async (session) =>
      calls.push(['records', session.id]),
    clearActiveSession: () => calls.push(['clear']),
  });

  assert.equal(completed.durationSeconds, 5);
  assert.equal(completed.totalVolume, 480);
  assert.equal(completed.totalSets, 1);
  assert.equal(completed.endTime, 13_500);
  assert.deepEqual(calls, [
    ['session', 'session_1'],
    ['records', 'session_1'],
    ['clear'],
  ]);
});

test('keeps the active draft when the workout save fails', async () => {
  const calls = [];

  await assert.rejects(
    finishActiveWorkout(active, 13_500, {
      saveSession: async () => {
        throw new Error('disk full');
      },
      updatePersonalRecords: async () => calls.push('records'),
      clearActiveSession: () => calls.push('clear'),
    }),
    /disk full/,
  );
  assert.deepEqual(calls, []);
});

test('keeps the active draft when personal-record saving fails', async () => {
  const calls = [];

  await assert.rejects(
    finishActiveWorkout(active, 13_500, {
      saveSession: async () => calls.push('session'),
      updatePersonalRecords: async () => {
        calls.push('records');
        throw new Error('records unavailable');
      },
      clearActiveSession: () => calls.push('clear'),
    }),
    /records unavailable/,
  );
  assert.deepEqual(calls, ['session', 'records']);
});
