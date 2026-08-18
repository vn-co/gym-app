import type { NativeModule } from 'expo';

export type NativeHealthRecord = Record<string, unknown>;
export type NativeHealthValue = number | null;
export type NativeWorkoutState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'ending'
  | 'ended'
  | 'failed';

export type NativeWorkoutStatePayload = {
  state: NativeWorkoutState;
  errorCode?: string;
};

export type NativeLiveMetricsPayload = {
  elapsedSeconds: number;
  activeEnergyKilocalories: NativeHealthValue;
  heartRateBpm: NativeHealthValue;
  averageHeartRateBpm: NativeHealthValue;
  maximumHeartRateBpm: NativeHealthValue;
  capturedAt: number;
};

export type NativeFinishedHealthWorkoutPayload = NativeLiveMetricsPayload & {
  workoutUuid: string;
  startTime: number;
  endTime: number;
};

export type HealthKitWorkoutModuleEvents = {
  onWorkoutStateChanged: (payload: NativeWorkoutStatePayload) => void;
  onLiveMetrics: (payload: NativeLiveMetricsPayload) => void;
};

export interface NativeHealthKitWorkoutModule
  extends NativeModule<HealthKitWorkoutModuleEvents> {
  isHealthDataAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<void>;
  readTodayActivity(): Promise<NativeHealthRecord>;
  startWorkout(localSessionId: string, startedAt: number): Promise<void>;
  pauseWorkout(): Promise<void>;
  resumeWorkout(): Promise<void>;
  finishWorkout(): Promise<NativeFinishedHealthWorkoutPayload>;
  discardWorkout(): Promise<void>;
  getWorkoutState(): Promise<NativeWorkoutStatePayload>;
}
