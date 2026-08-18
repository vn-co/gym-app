import ExpoModulesCore
import HealthKit

public final class HealthKitWorkoutModule: Module {
  private let controller = HealthKitWorkoutController()

  public func definition() -> ModuleDefinition {
    Name("HealthKitWorkout")

    Events("onWorkoutStateChanged", "onLiveMetrics")

    AsyncFunction("isHealthDataAvailable") {
      HKHealthStore.isHealthDataAvailable()
    }

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      self.controller.requestAuthorization { result in
        switch result {
        case .success:
          promise.resolve()
        case .failure(let error):
          promise.reject(error.code, error.message)
        }
      }
    }

    AsyncFunction("readTodayActivity") { (promise: Promise) in
      self.controller.readTodayActivity { result in
        switch result {
        case .success(let activity):
          promise.resolve(activity)
        case .failure(let error):
          promise.reject(error.code, error.message)
        }
      }
    }
  }
}
