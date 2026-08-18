import ExpoModulesCore
import HealthKit

public final class HealthKitWorkoutModule: Module {
  private lazy var controller: HealthKitWorkoutController = {
    let controller = HealthKitWorkoutController()
    controller.onWorkoutStateChanged = { [weak self] payload in
      self?.sendEvent(
        "onWorkoutStateChanged",
        payload.mapValues { Optional($0) }
      )
    }
    controller.onLiveMetrics = { [weak self] payload in
      self?.sendEvent("onLiveMetrics", payload.mapValues { Optional($0) })
    }
    return controller
  }()

  public func definition() -> ModuleDefinition {
    Name("HealthKitWorkout")

    Events("onWorkoutStateChanged", "onLiveMetrics")

    AsyncFunction("isHealthDataAvailable") {
      HKHealthStore.isHealthDataAvailable()
    }

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      self.controller.requestAuthorization { result in
        self.settle(result, promise: promise)
      }
    }.runOnQueue(.main)

    AsyncFunction("readTodayActivity") { (promise: Promise) in
      self.controller.readTodayActivity { result in
        self.settle(result, promise: promise)
      }
    }.runOnQueue(.main)

    AsyncFunction("startWorkout") {
      (localSessionID: String, startedAt: Double, promise: Promise) in
      self.controller.startWorkout(
        localSessionID: localSessionID,
        startedAt: startedAt
      ) { result in
        self.settle(result, promise: promise)
      }
    }.runOnQueue(.main)

    AsyncFunction("pauseWorkout") { (promise: Promise) in
      self.controller.pauseWorkout { result in
        self.settle(result, promise: promise)
      }
    }.runOnQueue(.main)

    AsyncFunction("resumeWorkout") { (promise: Promise) in
      self.controller.resumeWorkout { result in
        self.settle(result, promise: promise)
      }
    }.runOnQueue(.main)

    AsyncFunction("finishWorkout") { (promise: Promise) in
      self.controller.finishWorkout { result in
        self.settle(result, promise: promise)
      }
    }.runOnQueue(.main)

    AsyncFunction("discardWorkout") { (promise: Promise) in
      self.controller.discardWorkout { result in
        self.settle(result, promise: promise)
      }
    }.runOnQueue(.main)

    AsyncFunction("getWorkoutState") {
      self.controller.getWorkoutState()
    }.runOnQueue(.main)
  }

  private func settle(
    _ result: Result<Void, HealthKitWorkoutControllerError>,
    promise: Promise
  ) {
    switch result {
    case .success:
      promise.resolve()
    case .failure(let error):
      promise.reject(error.code, error.message)
    }
  }

  private func settle(
    _ result: Result<HealthKitWorkoutController.Payload, HealthKitWorkoutControllerError>,
    promise: Promise
  ) {
    switch result {
    case .success(let payload):
      promise.resolve(payload)
    case .failure(let error):
      promise.reject(error.code, error.message)
    }
  }
}
