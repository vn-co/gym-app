import type { NativeModule } from 'expo';

export type NativeHealthRecord = Record<string, unknown>;

export type HealthKitWorkoutModuleEvents = {
  onWorkoutStateChanged: (payload: NativeHealthRecord) => void;
  onLiveMetrics: (payload: NativeHealthRecord) => void;
};

export interface NativeHealthKitWorkoutModule
  extends NativeModule<HealthKitWorkoutModuleEvents> {
  isHealthDataAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<void>;
  readTodayActivity(): Promise<NativeHealthRecord>;
  startWorkout(localSessionId: string, startedAt: number): Promise<void>;
  pauseWorkout(): Promise<void>;
  resumeWorkout(): Promise<void>;
  finishWorkout(): Promise<NativeHealthRecord>;
  discardWorkout(): Promise<void>;
  getWorkoutState(): Promise<NativeHealthRecord>;
}
