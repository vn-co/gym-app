import HealthKitWorkout from '../../modules/healthkit-workout';
import {
  normalizeFinishedHealthWorkout,
  normalizeLiveHealthMetrics,
  normalizeTodayActivity,
  normalizeWorkoutState,
} from './normalizeHealthPayload';
import { HealthServiceError, type HealthService } from './types';

const toHealthServiceError = (error: unknown): HealthServiceError => {
  if (error instanceof HealthServiceError) return error;

  const code =
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code
      ? error.code
      : 'healthkit_error';
  const message =
    error instanceof Error && error.message
      ? error.message
      : 'Apple Health could not complete the request.';

  return new HealthServiceError(code, message);
};

const fromNative = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw toHealthServiceError(error);
  }
};

export const healthService: HealthService = {
  isHealthDataAvailable: () =>
    fromNative(() => HealthKitWorkout.isHealthDataAvailable()),
  requestAuthorization: () =>
    fromNative(() => HealthKitWorkout.requestAuthorization()),
  readTodayActivity: async () =>
    normalizeTodayActivity(
      await fromNative(() => HealthKitWorkout.readTodayActivity()),
    ),
  startWorkout: (localSessionId, startedAt) =>
    fromNative(() =>
      HealthKitWorkout.startWorkout(localSessionId, startedAt),
    ),
  pauseWorkout: () => fromNative(() => HealthKitWorkout.pauseWorkout()),
  resumeWorkout: () => fromNative(() => HealthKitWorkout.resumeWorkout()),
  finishWorkout: async () =>
    normalizeFinishedHealthWorkout(
      await fromNative(() => HealthKitWorkout.finishWorkout()),
    ),
  discardWorkout: () => fromNative(() => HealthKitWorkout.discardWorkout()),
  getWorkoutState: async () =>
    normalizeWorkoutState(
      await fromNative(() => HealthKitWorkout.getWorkoutState()),
    ),
  subscribeToWorkoutState: (listener) => {
    const subscription = HealthKitWorkout.addListener(
      'onWorkoutStateChanged',
      (payload) => listener(normalizeWorkoutState(payload)),
    );
    return () => subscription.remove();
  },
  subscribeToLiveMetrics: (listener) => {
    const subscription = HealthKitWorkout.addListener(
      'onLiveMetrics',
      (payload) => listener(normalizeLiveHealthMetrics(payload)),
    );
    return () => subscription.remove();
  },
};
