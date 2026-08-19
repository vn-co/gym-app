import { requireOptionalNativeModule } from 'expo';
import type { NativeHealthKitWorkoutModule } from './HealthKitWorkout.types';

export default requireOptionalNativeModule<NativeHealthKitWorkoutModule>(
  'HealthKitWorkout',
);
