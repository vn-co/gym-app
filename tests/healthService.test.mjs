import assert from 'node:assert/strict';
import test from 'node:test';
import { healthService } from '../src/health/healthService.ts';

test('reports HealthKit unavailable outside the iOS native build', async () => {
  assert.equal(await healthService.isHealthDataAvailable(), false);
  assert.deepEqual(await healthService.getWorkoutState(), { state: 'idle' });
});

test('rejects native-only operations with a stable unavailable code', async () => {
  await assert.rejects(
    healthService.startWorkout('session-1', 1_000),
    (error) => error?.code === 'healthkit_unavailable',
  );
});
