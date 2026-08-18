import { HealthServiceError, type TodayActivity } from './types';

const nullableNonNegativeNumber = (
  record: Record<string, unknown>,
  key: keyof TodayActivity,
): number | null => {
  const value = record[key];

  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  throw new HealthServiceError(
    'invalid_native_payload',
    `HealthKit returned an invalid value for ${key}.`,
  );
};

export const normalizeTodayActivity = (value: unknown): TodayActivity => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new HealthServiceError(
      'invalid_native_payload',
      'HealthKit returned an invalid activity payload.',
    );
  }

  const record = value as Record<string, unknown>;

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
