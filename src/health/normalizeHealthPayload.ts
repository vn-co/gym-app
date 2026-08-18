import {
  HealthServiceError,
  type FinishedHealthWorkout,
  type HealthWorkoutState,
  type LiveHealthMetrics,
  type TodayActivity,
  type WorkoutStateSnapshot,
} from './types';

const workoutStates = new Set<HealthWorkoutState>([
  'idle',
  'starting',
  'running',
  'paused',
  'ending',
  'ended',
  'failed',
]);

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const invalidPayload = (message: string): never => {
  throw new HealthServiceError('invalid_native_payload', message);
};

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return invalidPayload(`HealthKit returned an invalid ${label} payload.`);
  }

  return value as Record<string, unknown>;
};

const nonNegativeNumber = (
  record: Record<string, unknown>,
  key: string,
): number => {
  const value = record[key];

  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  return invalidPayload(`HealthKit returned an invalid value for ${key}.`);
};

const nullableNonNegativeNumber = (
  record: Record<string, unknown>,
  key: string,
): number | null => {
  const value = record[key];

  if (value === null || value === undefined) return null;
  return nonNegativeNumber(record, key);
};

export const normalizeTodayActivity = (value: unknown): TodayActivity => {
  const record = asRecord(value, 'activity');

  return {
    activeEnergyKilocalories: nullableNonNegativeNumber(
      record,
      'activeEnergyKilocalories',
    ),
    exerciseMinutes: nullableNonNegativeNumber(record, 'exerciseMinutes'),
    stepCount: nullableNonNegativeNumber(record, 'stepCount'),
    activeEnergyGoalKilocalories: nullableNonNegativeNumber(
      record,
      'activeEnergyGoalKilocalories',
    ),
    exerciseGoalMinutes: nullableNonNegativeNumber(
      record,
      'exerciseGoalMinutes',
    ),
  };
};

export const normalizeWorkoutState = (
  value: unknown,
): WorkoutStateSnapshot => {
  const record = asRecord(value, 'workout state');
  const state = record.state;

  if (
    typeof state !== 'string' ||
    !workoutStates.has(state as HealthWorkoutState)
  ) {
    return invalidPayload('HealthKit returned an unknown workout state.');
  }

  const errorCode = record.errorCode;
  if (errorCode !== undefined && (typeof errorCode !== 'string' || !errorCode)) {
    return invalidPayload('HealthKit returned an invalid workout error code.');
  }

  return errorCode === undefined
    ? { state: state as HealthWorkoutState }
    : { state: state as HealthWorkoutState, errorCode };
};

export const normalizeLiveHealthMetrics = (
  value: unknown,
): LiveHealthMetrics => {
  const record = asRecord(value, 'live workout metrics');

  return {
    elapsedSeconds: nonNegativeNumber(record, 'elapsedSeconds'),
    activeEnergyKilocalories: nullableNonNegativeNumber(
      record,
      'activeEnergyKilocalories',
    ),
    heartRateBpm: nullableNonNegativeNumber(record, 'heartRateBpm'),
    averageHeartRateBpm: nullableNonNegativeNumber(
      record,
      'averageHeartRateBpm',
    ),
    maximumHeartRateBpm: nullableNonNegativeNumber(
      record,
      'maximumHeartRateBpm',
    ),
    capturedAt: nonNegativeNumber(record, 'capturedAt'),
  };
};

export const normalizeFinishedHealthWorkout = (
  value: unknown,
): FinishedHealthWorkout => {
  const record = asRecord(value, 'finished workout');
  const metrics = normalizeLiveHealthMetrics(record);
  const workoutUuid = record.workoutUuid;
  const startTime = nonNegativeNumber(record, 'startTime');
  const endTime = nonNegativeNumber(record, 'endTime');

  if (typeof workoutUuid !== 'string' || !uuidPattern.test(workoutUuid)) {
    return invalidPayload('HealthKit returned an invalid workout UUID.');
  }
  if (endTime < startTime) {
    return invalidPayload('HealthKit returned an invalid workout time range.');
  }

  return {
    ...metrics,
    workoutUuid,
    startTime,
    endTime,
  };
};
