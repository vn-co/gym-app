import Foundation
import HealthKit

enum HealthKitWorkoutControllerError: Error {
  case authorizationFailed(Error?)
  case healthKitUnavailable
  case queryFailed(Error)

  var code: String {
    switch self {
    case .authorizationFailed:
      return "authorization_failed"
    case .healthKitUnavailable:
      return "healthkit_unavailable"
    case .queryFailed:
      return "query_failed"
    }
  }

  var message: String {
    switch self {
    case .authorizationFailed(let error):
      return error?.localizedDescription ?? "Apple Health authorization failed."
    case .healthKitUnavailable:
      return "Apple Health is unavailable on this device."
    case .queryFailed(let error):
      return error.localizedDescription
    }
  }
}

private final class TodayActivityAccumulator: @unchecked Sendable {
  var activeEnergyKilocalories: Double?
  var exerciseMinutes: Double?
  var stepCount: Double?
  var activeEnergyGoalKilocalories: Double?
  var exerciseGoalMinutes: Double?
  var firstError: HealthKitWorkoutControllerError?
}

final class HealthKitWorkoutController {
  private let healthStore = HKHealthStore()
  private let workout = HKObjectType.workoutType()
  private let heartRate = HKObjectType.quantityType(forIdentifier: .heartRate)!
  private let activeEnergy = HKObjectType.quantityType(
    forIdentifier: .activeEnergyBurned
  )!
  private let steps = HKObjectType.quantityType(forIdentifier: .stepCount)!
  private let exerciseTime = HKObjectType.quantityType(
    forIdentifier: .appleExerciseTime
  )!
  private let activitySummary = HKObjectType.activitySummaryType()

  func requestAuthorization(
    completion: @escaping (Result<Void, HealthKitWorkoutControllerError>) -> Void
  ) {
    guard HKHealthStore.isHealthDataAvailable() else {
      completion(.failure(.healthKitUnavailable))
      return
    }

    let sharing: Set<HKSampleType> = [workout, activeEnergy]
    let reading: Set<HKObjectType> = [
      workout,
      heartRate,
      activeEnergy,
      steps,
      exerciseTime,
      activitySummary,
    ]

    healthStore.requestAuthorization(toShare: sharing, read: reading) {
      success,
      error in
      guard success, error == nil else {
        completion(.failure(.authorizationFailed(error)))
        return
      }

      completion(.success(()))
    }
  }

  func readTodayActivity(
    completion: @escaping (
      Result<[String: Any], HealthKitWorkoutControllerError>
    ) -> Void
  ) {
    guard HKHealthStore.isHealthDataAvailable() else {
      completion(.failure(.healthKitUnavailable))
      return
    }

    let now = Date()
    let start = Calendar.current.startOfDay(for: now)
    let resultQueue = DispatchQueue(label: "com.vlad.gymv1.healthkit.today")
    let group = DispatchGroup()
    let activity = TodayActivityAccumulator()

    group.enter()
    cumulativeSum(
      for: activeEnergy,
      unit: .kilocalorie(),
      start: start,
      end: now
    ) { result in
      resultQueue.async {
        switch result {
        case .success(let value):
          activity.activeEnergyKilocalories = value
        case .failure(let error):
          activity.firstError = activity.firstError ?? error
        }
        group.leave()
      }
    }

    group.enter()
    cumulativeSum(
      for: exerciseTime,
      unit: .minute(),
      start: start,
      end: now
    ) { result in
      resultQueue.async {
        switch result {
        case .success(let value):
          activity.exerciseMinutes = value
        case .failure(let error):
          activity.firstError = activity.firstError ?? error
        }
        group.leave()
      }
    }

    group.enter()
    cumulativeSum(for: steps, unit: .count(), start: start, end: now) {
      result in
      resultQueue.async {
        switch result {
        case .success(let value):
          activity.stepCount = value
        case .failure(let error):
          activity.firstError = activity.firstError ?? error
        }
        group.leave()
      }
    }

    group.enter()
    todayGoals(at: now) { result in
      resultQueue.async {
        switch result {
        case .success(let goals):
          activity.activeEnergyGoalKilocalories = goals.activeEnergy
          activity.exerciseGoalMinutes = goals.exercise
        case .failure(let error):
          activity.firstError = activity.firstError ?? error
        }
        group.leave()
      }
    }

    group.notify(queue: resultQueue) {
      if let error = activity.firstError {
        completion(.failure(error))
        return
      }

      completion(.success([
        "activeEnergyKilocalories": self.javascriptValue(
          activity.activeEnergyKilocalories
        ),
        "exerciseMinutes": self.javascriptValue(activity.exerciseMinutes),
        "stepCount": self.javascriptValue(activity.stepCount),
        "activeEnergyGoalKilocalories": self.javascriptValue(
          activity.activeEnergyGoalKilocalories
        ),
        "exerciseGoalMinutes": self.javascriptValue(
          activity.exerciseGoalMinutes
        ),
      ]))
    }
  }

  private func cumulativeSum(
    for type: HKQuantityType,
    unit: HKUnit,
    start: Date,
    end: Date,
    completion: @escaping (
      Result<Double?, HealthKitWorkoutControllerError>
    ) -> Void
  ) {
    let predicate = HKQuery.predicateForSamples(
      withStart: start,
      end: end,
      options: .strictStartDate
    )
    let query = HKStatisticsQuery(
      quantityType: type,
      quantitySamplePredicate: predicate,
      options: .cumulativeSum
    ) { _, statistics, error in
      if let error {
        completion(.failure(.queryFailed(error)))
        return
      }

      completion(.success(
        statistics?.sumQuantity()?.doubleValue(for: unit)
      ))
    }

    healthStore.execute(query)
  }

  private func todayGoals(
    at date: Date,
    completion: @escaping (
      Result<
        (activeEnergy: Double?, exercise: Double?),
        HealthKitWorkoutControllerError
      >
    ) -> Void
  ) {
    var components = Calendar.current.dateComponents(
      [.era, .year, .month, .day],
      from: date
    )
    components.calendar = Calendar.current

    let predicate = HKQuery.predicateForActivitySummary(with: components)
    let query = HKActivitySummaryQuery(predicate: predicate) {
      _,
      summaries,
      error in
      if let error {
        completion(.failure(.queryFailed(error)))
        return
      }

      guard let summary = summaries?.first else {
        completion(.success((nil, nil)))
        return
      }

      completion(.success((
        summary.activeEnergyBurnedGoal.doubleValue(for: .kilocalorie()),
        summary.appleExerciseTimeGoal.doubleValue(for: .minute())
      )))
    }

    healthStore.execute(query)
  }

  private func javascriptValue(_ value: Double?) -> Any {
    guard let value else { return NSNull() }
    return value
  }
}
