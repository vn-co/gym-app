import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activeSessionPersistenceCallbacks,
  clearPersistenceIssue,
  createOrderedStateStorage,
  getPersistenceIssueSnapshot,
  parsePersistedWorkoutState,
} from '../src/store/activeSessionPersistence.ts';
import { getElapsedMilliseconds } from '../src/store/activeSessionTimer.ts';
import { createWorkoutStore } from '../src/store/workoutStore.ts';
import { STORAGE_KEYS } from '../src/types/index.ts';

function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  let writeCount = 0;
  return {
    data,
    get writeCount() {
      return writeCount;
    },
    getItem: async (name) => data.get(name) ?? null,
    setItem: async (name, value) => {
      writeCount += 1;
      data.set(name, value);
    },
    removeItem: async (name) => {
      data.delete(name);
    },
  };
}

const validSession = {
  sessionId: 'session_1',
  workoutName: 'Push',
  startTime: 1_000,
  accumulatedMilliseconds: 2_500,
  runningSince: 5_000,
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
      ],
    },
  ],
};

test('accepts valid running, paused, and empty active-session payloads', () => {
  assert.deepEqual(parsePersistedWorkoutState({ session: validSession }), {
    session: validSession,
  });
  assert.deepEqual(
    parsePersistedWorkoutState({
      session: { ...validSession, runningSince: null },
    }),
    { session: { ...validSession, runningSince: null } },
  );
  assert.deepEqual(parsePersistedWorkoutState({ session: null }), {
    session: null,
  });
});

test('rejects malformed active-session payloads', () => {
  const malformed = [
    {},
    { session: { ...validSession, accumulatedMilliseconds: -1 } },
    { session: { ...validSession, runningSince: 'now' } },
    { session: { ...validSession, exercises: {} } },
    {
      session: {
        ...validSession,
        exercises: [
          {
            ...validSession.exercises[0],
            sets: [{ ...validSession.exercises[0].sets[0], reps: -1 }],
          },
        ],
      },
    },
  ];

  for (const value of malformed) {
    assert.throws(
      () => parsePersistedWorkoutState(value),
      /invalid active session/i,
    );
  }
});

test('ordered storage leaves the newest write in place', async () => {
  const data = new Map();
  let writeCount = 0;
  let releaseFirstWrite = () => {};
  const firstWriteBlocked = new Promise((resolve) => {
    releaseFirstWrite = resolve;
  });
  const base = {
    getItem: async (name) => data.get(name) ?? null,
    setItem: async (name, value) => {
      writeCount += 1;
      if (writeCount === 1) await firstWriteBlocked;
      data.set(name, value);
    },
    removeItem: async (name) => {
      data.delete(name);
    },
  };
  const ordered = createOrderedStateStorage(base, {
    onIssue: () => {},
    onRecovered: () => {},
  });

  const first = ordered.storage.setItem('key', 'old');
  const second = ordered.storage.setItem('key', 'new');
  await Promise.resolve();
  releaseFirstWrite();
  await Promise.all([first, second]);
  await ordered.flush();

  assert.equal(await base.getItem('key'), 'new');
});

test('repeated write failures coalesce until storage recovers', async () => {
  clearPersistenceIssue();
  let failing = true;
  const data = new Map();
  const base = {
    getItem: async (name) => data.get(name) ?? null,
    setItem: async (name, value) => {
      if (failing) throw new Error('disk full');
      data.set(name, value);
    },
    removeItem: async (name) => {
      data.delete(name);
    },
  };
  const ordered = createOrderedStateStorage(
    base,
    activeSessionPersistenceCallbacks,
  );

  await ordered.storage.setItem('key', 'one');
  const firstIssue = getPersistenceIssueSnapshot();
  await ordered.storage.setItem('key', 'two');
  const repeatedIssue = getPersistenceIssueSnapshot();

  assert.equal(firstIssue?.operation, 'write');
  assert.equal(firstIssue?.message, 'disk full');
  assert.equal(repeatedIssue?.id, firstIssue?.id);

  failing = false;
  await ordered.storage.setItem('key', 'three');
  assert.equal(getPersistenceIssueSnapshot(), null);
  assert.equal(await base.getItem('key'), 'three');
});

test('persists mutations and restores the latest running session', async () => {
  const memory = createMemoryStorage();
  const first = createWorkoutStore(memory, {
    onIssue: () => {},
    onRecovered: () => {},
  });
  first.store.getState().startSession('Push');
  first.store.getState().addExercise({
    exerciseId: 'bench_press',
    exerciseName: 'Bench Press',
  });
  const exercise = first.store.getState().session.exercises[0];
  first.store.getState().updateSet(exercise.id, exercise.sets[0].id, {
    weight: 60,
    reps: 8,
    completed: true,
  });
  await first.flushPersistence();

  const raw = memory.data.get(STORAGE_KEYS.ACTIVE_SESSION);
  const serialized = JSON.parse(raw);
  assert.equal(serialized.version, 1);
  assert.equal(serialized.state.session.exercises[0].sets[0].weight, 60);

  const restored = createWorkoutStore(memory, {
    onIssue: () => {},
    onRecovered: () => {},
  });
  await restored.store.persist.rehydrate();
  assert.equal(restored.store.getState().session.workoutName, 'Push');
  assert.equal(
    restored.store.getState().session.exercises[0].sets[0].completed,
    true,
  );
  assert.equal(
    typeof restored.store.getState().session.runningSince,
    'number',
  );
});

test('restores paused sessions without accumulating closed time', async () => {
  const memory = createMemoryStorage();
  const first = createWorkoutStore(memory, {
    onIssue: () => {},
    onRecovered: () => {},
  });
  first.store.getState().startSession('Paused');
  first.store.getState().pauseSession();
  await first.flushPersistence();

  const restored = createWorkoutStore(memory, {
    onIssue: () => {},
    onRecovered: () => {},
  });
  await restored.store.persist.rehydrate();
  const session = restored.store.getState().session;
  assert.equal(session.runningSince, null);
  assert.equal(
    getElapsedMilliseconds(session, Date.now() + 60_000),
    session.accumulatedMilliseconds,
  );
});

test('missing and corrupt storage both settle hydration safely', async () => {
  const missingIssues = [];
  const missing = createWorkoutStore(createMemoryStorage(), {
    onIssue: (...args) => missingIssues.push(args),
    onRecovered: () => {},
  });
  await missing.store.persist.rehydrate();
  assert.equal(missing.store.getState().session, null);
  assert.deepEqual(missingIssues, []);

  const corruptIssues = [];
  const corruptMemory = createMemoryStorage({
    [STORAGE_KEYS.ACTIVE_SESSION]: '{broken',
  });
  const corrupt = createWorkoutStore(corruptMemory, {
    onIssue: (...args) => corruptIssues.push(args),
    onRecovered: () => {},
  });
  await corrupt.store.persist.rehydrate();
  assert.equal(corrupt.store.getState().session, null);
  assert.equal(corruptIssues.length, 1);
  assert.equal(corruptIssues[0][0], 'read');
});

test('cancel clears the draft and elapsed display does not write', async () => {
  const memory = createMemoryStorage();
  const workout = createWorkoutStore(memory, {
    onIssue: () => {},
    onRecovered: () => {},
  });
  workout.store.getState().startSession('Push');
  await workout.flushPersistence();
  const writesAfterStart = memory.writeCount;
  const session = workout.store.getState().session;

  getElapsedMilliseconds(session, Date.now() + 1_000);
  getElapsedMilliseconds(session, Date.now() + 2_000);
  assert.equal(memory.writeCount, writesAfterStart);

  workout.store.getState().cancelSession();
  await workout.flushPersistence();
  const serialized = JSON.parse(
    memory.data.get(STORAGE_KEYS.ACTIVE_SESSION),
  );
  assert.equal(serialized.state.session, null);
});
