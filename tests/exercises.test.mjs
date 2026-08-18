import assert from 'node:assert/strict';
import test from 'node:test';
import * as exercises from '../src/constants/exercises.ts';

test('custom exercises are available before the static catalog', () => {
  assert.equal(typeof exercises.mergeExerciseLibrary, 'function');
  const custom = {
    id: 'custom_1',
    name: 'My Lift',
    muscleGroup: 'legs',
    equipment: 'Other',
  };

  const merged = exercises.mergeExerciseLibrary([custom]);
  assert.equal(merged[0], custom);
  assert.ok(merged.some((exercise) => exercise.id === 'bench_press'));
});
