import assert from 'node:assert/strict';
import test from 'node:test';
import { healthService } from '../src/health/healthService.ts';
import {
  normalizeFinishedHealthWorkout,
  normalizeLiveHealthMetrics,
  normalizeTodayActivity,
  normalizeWorkoutState,
} from '../src/health/normalizeHealthPayload.ts';
import { HealthServiceError } from '../src/health/types.ts';

const assertInvalidNativePayload = (operation) => {
  assert.throws(
    operation,
    (error) =>
      error instanceof HealthServiceError &&
      error.code === 'invalid_native_payload',
  );
};

const validMetrics = {
  elapsedSeconds: 312.5,
  activeEnergyKilocalories: 48.2,
  heartRateBpm: 132,
  averageHeartRateBpm: 124,
  maximumHeartRateBpm: 151,
  capturedAt: 1_755_500_000_000,
};

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
    assertInvalidNativePayload(() => normalizeTodayActivity(value));
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
      assertInvalidNativePayload(() =>
        normalizeTodayActivity({ [key]: value }),
      );
    }
  }
});

test('preserves every valid native workout state', () => {
  const states = [
    'idle',
    'starting',
    'running',
    'paused',
    'ending',
    'ended',
    'failed',
  ];

  for (const state of states) {
    assert.deepEqual(normalizeWorkoutState({ state }), { state });
  }

  assert.deepEqual(
    normalizeWorkoutState({
      state: 'failed',
      errorCode: 'workout_session_failed',
    }),
    { state: 'failed', errorCode: 'workout_session_failed' },
  );
});

test('preserves valid live workout metrics', () => {
  assert.deepEqual(normalizeLiveHealthMetrics(validMetrics), validMetrics);
});

test('preserves a valid finished workout', () => {
  const workout = {
    ...validMetrics,
    workoutUuid: '5D71A8FA-6D44-43D8-AD44-E9F7E819B8A6',
    startTime: 1_755_499_687_500,
    endTime: 1_755_500_000_000,
  };

  assert.deepEqual(normalizeFinishedHealthWorkout(workout), workout);
});

test('rejects unknown native workout states', () => {
  assertInvalidNativePayload(() =>
    normalizeWorkoutState({ state: 'cancelling' }),
  );
});

test('rejects negative native workout elapsed time', () => {
  assertInvalidNativePayload(() =>
    normalizeLiveHealthMetrics({ ...validMetrics, elapsedSeconds: -1 }),
  );
});

test('rejects malformed native workout UUIDs', () => {
  assertInvalidNativePayload(() =>
    normalizeFinishedHealthWorkout({
      ...validMetrics,
      workoutUuid: 'not-a-healthkit-uuid',
      startTime: 1_755_499_687_500,
      endTime: 1_755_500_000_000,
    }),
  );
});

test('rejects a native workout that ends before it starts', () => {
  assertInvalidNativePayload(() =>
    normalizeFinishedHealthWorkout({
      ...validMetrics,
      workoutUuid: '5D71A8FA-6D44-43D8-AD44-E9F7E819B8A6',
      startTime: 1_755_500_000_001,
      endTime: 1_755_500_000_000,
    }),
  );
});
