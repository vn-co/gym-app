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
