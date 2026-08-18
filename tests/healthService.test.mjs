import assert from 'node:assert/strict';
import test from 'node:test';
import { healthService } from '../src/health/healthService.ts';
import { normalizeTodayActivity } from '../src/health/normalizeHealthPayload.ts';
import { HealthServiceError } from '../src/health/types.ts';

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

test('preserves valid native activity values', () => {
  const activity = {
    activeEnergyKilocalories: 412.5,
    exerciseMinutes: 37,
    stepCount: 8_240,
    activeEnergyGoalKilocalories: 700,
    exerciseGoalMinutes: 45,
  };

  assert.deepEqual(normalizeTodayActivity(activity), activity);
});

test('normalizes missing native activity values to null', () => {
  assert.deepEqual(normalizeTodayActivity({}), {
    activeEnergyKilocalories: null,
    exerciseMinutes: null,
    stepCount: null,
    activeEnergyGoalKilocalories: null,
    exerciseGoalMinutes: null,
  });

  assert.deepEqual(
    normalizeTodayActivity({
      activeEnergyKilocalories: null,
      exerciseMinutes: null,
      stepCount: null,
      activeEnergyGoalKilocalories: null,
      exerciseGoalMinutes: null,
    }),
    {
      activeEnergyKilocalories: null,
      exerciseMinutes: null,
      stepCount: null,
      activeEnergyGoalKilocalories: null,
      exerciseGoalMinutes: null,
    },
  );
});

test('rejects invalid native activity values with a stable code', () => {
  for (const value of [null, [], 'not-a-record']) {
    assert.throws(
      () => normalizeTodayActivity(value),
      (error) =>
        error instanceof HealthServiceError &&
        error.code === 'invalid_native_payload',
    );
  }

  const keys = [
    'activeEnergyKilocalories',
    'exerciseMinutes',
    'stepCount',
    'activeEnergyGoalKilocalories',
    'exerciseGoalMinutes',
  ];
  const invalidValues = [-1, Number.NaN, Number.POSITIVE_INFINITY, '12', true];

  for (const key of keys) {
    for (const value of invalidValues) {
      assert.throws(
        () => normalizeTodayActivity({ [key]: value }),
        (error) =>
          error instanceof HealthServiceError &&
          error.code === 'invalid_native_payload',
      );
    }
  }
});
