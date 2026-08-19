import assert from 'node:assert/strict';
import test from 'node:test';

async function loadCodec() {
  const codec = await import('../src/services/storageCodec.ts').catch(
    () => null,
  );
  assert.ok(codec, 'storage codec must exist');
  return codec;
}

test('missing stored arrays are empty', async () => {
  const { parseStoredArray } = await loadCodec();
  assert.deepEqual(parseStoredArray(null, 'sessions'), []);
});

test('valid stored arrays are returned', async () => {
  const { parseStoredArray } = await loadCodec();
  assert.deepEqual(parseStoredArray('[{"id":"1"}]', 'sessions'), [
    { id: '1' },
  ]);
});

test('invalid stored data is never treated as empty', async () => {
  const { parseStoredArray } = await loadCodec();
  assert.throws(() => parseStoredArray('{broken', 'sessions'), /sessions/);
  assert.throws(() => parseStoredArray('{}', 'sessions'), /sessions/);
});

test('completed workout history deduplicates by Apple Health UUID', async () => {
  const { upsertWorkoutSession } = await loadCodec();
  const original = {
    id: 'local-original',
    name: 'Push',
    startTime: 1_000,
    durationSeconds: 60,
    exercises: [],
    totalVolume: 100,
    totalSets: 1,
    health: {
      status: 'saved',
      workoutUuid: '5D71A8FA-6D44-43D8-AD44-E9F7E819B8A6',
    },
  };
  const duplicate = {
    ...original,
    id: 'local-retry',
    durationSeconds: 65,
  };

  const updated = upsertWorkoutSession([original], duplicate);
  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, 'local-original');
  assert.equal(updated[0].durationSeconds, 65);
});

test('legacy completed workouts without Health fields remain compatible', async () => {
  const { upsertWorkoutSession } = await loadCodec();
  const legacy = {
    id: 'legacy',
    name: 'Legacy workout',
    startTime: 1_000,
    durationSeconds: 60,
    exercises: [],
    totalVolume: 100,
    totalSets: 1,
  };
  const current = { ...legacy, id: 'current', name: 'Current workout' };

  assert.deepEqual(upsertWorkoutSession([legacy], current), [current, legacy]);
});
