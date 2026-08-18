import ExpoModulesCore
import HealthKit

public final class HealthKitWorkoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HealthKitWorkout")

    Events("onWorkoutStateChanged", "onLiveMetrics")

    AsyncFunction("isHealthDataAvailable") {
      HKHealthStore.isHealthDataAvailable()
    }
  }
}
