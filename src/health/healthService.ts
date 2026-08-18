import { HealthServiceError, type HealthService } from './types';

const unavailable = () =>
  Promise.reject(
    new HealthServiceError(
      'healthkit_unavailable',
      'Apple Health requires the installed iPhone development build.',
    ),
  );

export const healthService: HealthService = {
  isHealthDataAvailable: async () => false,
  requestAuthorization: unavailable,
  readTodayActivity: unavailable,
  startWorkout: unavailable,
  pauseWorkout: unavailable,
  resumeWorkout: unavailable,
  finishWorkout: unavailable,
  discardWorkout: unavailable,
  getWorkoutState: async () => ({ state: 'idle' }),
  subscribeToWorkoutState: () => () => {},
  subscribeToLiveMetrics: () => () => {},
};
