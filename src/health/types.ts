export type HealthWorkoutState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'ending'
  | 'ended'
  | 'failed';

export interface TodayActivity {
  activeEnergyKilocalories: number | null;
  exerciseMinutes: number | null;
  stepCount: number | null;
  activeEnergyGoalKilocalories: number | null;
  exerciseGoalMinutes: number | null;
}

export interface LiveHealthMetrics {
  elapsedSeconds: number;
  activeEnergyKilocalories: number | null;
  heartRateBpm: number | null;
  averageHeartRateBpm: number | null;
  maximumHeartRateBpm: number | null;
  capturedAt: number;
}

export interface FinishedHealthWorkout extends LiveHealthMetrics {
  workoutUuid: string;
  startTime: number;
  endTime: number;
}

export interface WorkoutStateSnapshot {
  state: HealthWorkoutState;
  errorCode?: string;
}

export type Unsubscribe = () => void;

export interface HealthService {
  isHealthDataAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<void>;
  readTodayActivity(): Promise<TodayActivity>;
  startWorkout(localSessionId: string, startedAt: number): Promise<void>;
  pauseWorkout(): Promise<void>;
  resumeWorkout(): Promise<void>;
  finishWorkout(): Promise<FinishedHealthWorkout>;
  discardWorkout(): Promise<void>;
  getWorkoutState(): Promise<WorkoutStateSnapshot>;
  subscribeToWorkoutState(
    listener: (state: WorkoutStateSnapshot) => void,
  ): Unsubscribe;
  subscribeToLiveMetrics(
    listener: (metrics: LiveHealthMetrics) => void,
  ): Unsubscribe;
}

export class HealthServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HealthServiceError';
  }
}
