import { requireNativeModule } from 'expo';
import type { NativeHealthKitWorkoutModule } from './HealthKitWorkout.types';

export default requireNativeModule<NativeHealthKitWorkoutModule>(
  'HealthKitWorkout',
);
