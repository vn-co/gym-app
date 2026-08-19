import HealthKitWorkout from '../../modules/healthkit-workout';
import {
  normalizeFinishedHealthWorkout,
  normalizeLiveHealthMetrics,
  normalizeTodayActivity,
  normalizeWorkoutState,
} from './normalizeHealthPayload';
import { HealthServiceError, type HealthService } from './types';

const nativeModule = () => {
  if (!HealthKitWorkout) {
    throw new HealthServiceError(
      'healthkit_unavailable',
      'Apple Health requires a development build containing the HealthKit module.',
    );
  }
  return HealthKitWorkout;
};

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
  isHealthDataAvailable: () => {
    if (!HealthKitWorkout) return Promise.resolve(false);
    const module = HealthKitWorkout;
    return fromNative(() => module.isHealthDataAvailable());
  },
  requestAuthorization: () =>
    fromNative(() => nativeModule().requestAuthorization()),
  readTodayActivity: async () =>
    normalizeTodayActivity(
      await fromNative(() => nativeModule().readTodayActivity()),
    ),
  startWorkout: (localSessionId, startedAt) =>
    fromNative(() =>
      nativeModule().startWorkout(localSessionId, startedAt),
    ),
  pauseWorkout: () => fromNative(() => nativeModule().pauseWorkout()),
  resumeWorkout: () => fromNative(() => nativeModule().resumeWorkout()),
  finishWorkout: async () =>
    normalizeFinishedHealthWorkout(
      await fromNative(() => nativeModule().finishWorkout()),
    ),
  discardWorkout: () => fromNative(() => nativeModule().discardWorkout()),
  getWorkoutState: async () => {
    if (!HealthKitWorkout) return { state: 'idle' };
    const module = HealthKitWorkout;
    return normalizeWorkoutState(
      await fromNative(() => module.getWorkoutState()),
    );
  },
  subscribeToWorkoutState: (listener) => {
    if (!HealthKitWorkout) return () => {};
    const subscription = HealthKitWorkout.addListener(
      'onWorkoutStateChanged',
      (payload) => listener(normalizeWorkoutState(payload)),
    );
    return () => subscription.remove();
  },
  subscribeToLiveMetrics: (listener) => {
    if (!HealthKitWorkout) return () => {};
    const subscription = HealthKitWorkout.addListener(
      'onLiveMetrics',
      (payload) => listener(normalizeLiveHealthMetrics(payload)),
    );
    return () => subscription.remove();
  },
};
