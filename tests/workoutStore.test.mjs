import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkoutStore } from '../src/store/workoutStore.ts';

function createMemoryStorage() {
  const data = new Map();
  return {
    data,
    getItem: async (name) => data.get(name) ?? null,
    setItem: async (name, value) => {
      data.set(name, value);
    },
    removeItem: async (name) => {
      data.delete(name);
    },
  };
}

test('starts a routine with each exercise defaults', async () => {
  const memory = createMemoryStorage();
  const { store, flushPersistence } = createWorkoutStore(memory, {
    onIssue: () => {},
    onRecovered: () => {},
  });
  store.getState().startSessionFromRoutine('Push', [
    {
      exerciseId: 'bench_press',
      exerciseName: 'Bench Press',
      muscleGroup: 'chest',
      defaultSets: 2,
      defaultReps: 8,
      defaultWeight: 60,
    },
  ]);
  await flushPersistence();

  const exercise = store.getState().session?.exercises[0];
  assert.equal(
    typeof store.getState().session?.runningSince,
    'number',
  );
  assert.equal(
    store.getState().session?.accumulatedMilliseconds,
    0,
  );
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

test('starts routine exercises in their saved order', () => {
  const memory = createMemoryStorage();
  const { store } = createWorkoutStore(memory, {
    onIssue: () => {},
    onRecovered: () => {},
  });

  store.getState().startSessionFromRoutine('Upper', [
    {
      exerciseId: 'row',
      exerciseName: 'Row',
      muscleGroup: 'back',
      defaultSets: 1,
      defaultReps: 10,
      defaultWeight: 40,
    },
    {
      exerciseId: 'bench_press',
      exerciseName: 'Bench Press',
      muscleGroup: 'chest',
      defaultSets: 1,
      defaultReps: 8,
      defaultWeight: 60,
    },
  ]);

  assert.deepEqual(
    store.getState().session?.exercises.map((exercise) => exercise.exerciseId),
    ['row', 'bench_press'],
  );
});

test('renames, replaces, and reorders an active workout without losing sets', () => {
  const memory = createMemoryStorage();
  const { store } = createWorkoutStore(memory, {
    onIssue: () => {},
    onRecovered: () => {},
  });
  store.getState().startSession('Workout');
  store.getState().addExercise({
    exerciseId: 'bench_press',
    exerciseName: 'Bench Press',
  });
  store.getState().addExercise({ exerciseId: 'row', exerciseName: 'Row' });

  const [bench, row] = store.getState().session.exercises;
  store.getState().updateSet(bench.id, bench.sets[0].id, {
    weight: 80,
    reps: 5,
  });
  store.getState().renameSession('Upper');
  store.getState().replaceExercise(bench.id, {
    exerciseId: 'incline_press',
    exerciseName: 'Incline Press',
  });
  store.getState().moveExercise(row.id, 0);

  const session = store.getState().session;
  assert.equal(session.workoutName, 'Upper');
  assert.deepEqual(
    session.exercises.map((exercise) => exercise.exerciseId),
    ['row', 'incline_press'],
  );
  assert.deepEqual(session.exercises[1].sets[0], {
    ...bench.sets[0],
    weight: 80,
    reps: 5,
  });
});
