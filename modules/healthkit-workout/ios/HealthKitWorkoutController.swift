import Foundation
import HealthKit

enum WorkoutState: String {
  case idle
  case starting
  case running
  case paused
  case ending
  case ended
  case failed
}

enum HealthKitWorkoutControllerError: Error {
  case authorizationFailed(Error?)
  case healthKitUnavailable
  case invalidWorkoutState(WorkoutState)
  case liveWorkoutUnavailable
  case queryFailed(Error)
  case workoutAlreadyActive
  case workoutSessionFailed(Error?)

  var code: String {
    switch self {
    case .authorizationFailed:
      return "authorization_failed"
    case .healthKitUnavailable, .liveWorkoutUnavailable:
      return "healthkit_unavailable"
    case .invalidWorkoutState:
      return "invalid_workout_state"
    case .queryFailed:
      return "query_failed"
    case .workoutAlreadyActive:
      return "workout_already_active"
    case .workoutSessionFailed:
      return "workout_session_failed"
    }
  }

  var message: String {
    switch self {
    case .authorizationFailed(let error):
      return error?.localizedDescription ?? "Apple Health authorization failed."
    case .healthKitUnavailable:
      return "Apple Health is unavailable on this device."
    case .invalidWorkoutState(let state):
      return "The workout command is invalid while the native state is \(state.rawValue)."
    case .liveWorkoutUnavailable:
      return "Live Apple Health workouts require iOS 26 or later."
    case .queryFailed(let error):
      return error.localizedDescription
    case .workoutAlreadyActive:
      return "A different Apple Health workout is already active."
    case .workoutSessionFailed(let error):
      return error?.localizedDescription ?? "The Apple Health workout session failed."
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

final class HealthKitWorkoutController: NSObject {
  typealias Payload = [String: Any]
  typealias PayloadCompletion = (
    Result<Payload, HealthKitWorkoutControllerError>
  ) -> Void
  typealias VoidCompletion = (
    Result<Void, HealthKitWorkoutControllerError>
  ) -> Void

  var onLiveMetrics: ((Payload) -> Void)?
  var onWorkoutStateChanged: ((Payload) -> Void)?

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

  private var state = WorkoutState.idle
  private var stateErrorCode: String?
  private var workoutSessionStorage: AnyObject?
  private var workoutBuilderStorage: AnyObject?

  @available(iOS 17.0, *)
  private var workoutSession: HKWorkoutSession? {
    get { workoutSessionStorage as? HKWorkoutSession }
    set { workoutSessionStorage = newValue }
  }

  @available(iOS 26.0, *)
  private var workoutBuilder: HKLiveWorkoutBuilder? {
    get { workoutBuilderStorage as? HKLiveWorkoutBuilder }
    set { workoutBuilderStorage = newValue }
  }
  private var localSessionID: String?
  private var finishEndDate: Date?
  private var startCompletion: VoidCompletion?
  private var finishCompletion: PayloadCompletion?
  private var lastFinishedWorkout: Payload?
  private var lastMetricsEmission: Date?

  func requestAuthorization(completion: @escaping VoidCompletion) {
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

  func readTodayActivity(completion: @escaping PayloadCompletion) {
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
        case .failure:
          // Activity goals are optional and may be unavailable in Simulator.
          break
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

  func startWorkout(
    localSessionID: String,
    startedAt: Double,
    completion: @escaping VoidCompletion
  ) {
    dispatchPrecondition(condition: .onQueue(.main))

    guard #available(iOS 26.0, *) else {
      completion(.failure(.liveWorkoutUnavailable))
      return
    }

    if state == .running, self.localSessionID == localSessionID {
      completion(.success(()))
      return
    }

    if let activeID = self.localSessionID, activeID != localSessionID {
      completion(.failure(.workoutAlreadyActive))
      return
    }

    guard state == .idle || state == .ended || state == .failed else {
      completion(.failure(.invalidWorkoutState(state)))
      return
    }

    clearActiveWorkout()
    lastFinishedWorkout = nil
    let startDate = Date(timeIntervalSince1970: startedAt / 1_000)

    do {
      let configuration = HKWorkoutConfiguration()
      configuration.activityType = .traditionalStrengthTraining
      configuration.locationType = .indoor

      let session = try HKWorkoutSession(
        healthStore: healthStore,
        configuration: configuration
      )
      let builder = session.associatedWorkoutBuilder()
      builder.dataSource = HKLiveWorkoutDataSource(
        healthStore: healthStore,
        workoutConfiguration: configuration
      )
      session.delegate = self
      builder.delegate = self

      workoutSession = session
      workoutBuilder = builder
      self.localSessionID = localSessionID
      startCompletion = completion
      lastMetricsEmission = nil
      setState(.starting)

      session.prepare()
      session.startActivity(with: startDate)
      builder.beginCollection(withStart: startDate) { [weak self, weak builder] success, error in
        DispatchQueue.main.async {
          guard let self, let builder, self.workoutBuilder === builder else {
            return
          }
          self.handleCollectionStarted(success: success, error: error)
        }
      }
    } catch {
      let controllerError = HealthKitWorkoutControllerError.workoutSessionFailed(
        error
      )
      setState(.failed, errorCode: controllerError.code)
      completion(.failure(controllerError))
    }
  }

  func pauseWorkout(completion: @escaping VoidCompletion) {
    dispatchPrecondition(condition: .onQueue(.main))

    guard #available(iOS 26.0, *) else {
      completion(.failure(.liveWorkoutUnavailable))
      return
    }

    if state == .paused {
      completion(.success(()))
      return
    }

    guard state == .running, let session = workoutSession else {
      completion(.failure(.invalidWorkoutState(state)))
      return
    }

    session.pause()
    setState(.paused)
    completion(.success(()))
  }

  func resumeWorkout(completion: @escaping VoidCompletion) {
    dispatchPrecondition(condition: .onQueue(.main))

    guard #available(iOS 26.0, *) else {
      completion(.failure(.liveWorkoutUnavailable))
      return
    }

    if state == .running {
      completion(.success(()))
      return
    }

    guard state == .paused, let session = workoutSession else {
      completion(.failure(.invalidWorkoutState(state)))
      return
    }

    session.resume()
    setState(.running)
    completion(.success(()))
  }

  func finishWorkout(completion: @escaping PayloadCompletion) {
    dispatchPrecondition(condition: .onQueue(.main))

    guard #available(iOS 26.0, *) else {
      completion(.failure(.liveWorkoutUnavailable))
      return
    }

    if state == .ended, let workout = lastFinishedWorkout {
      completion(.success(workout))
      return
    }

    guard
      state == .running || state == .paused,
      let session = workoutSession,
      workoutBuilder != nil
    else {
      completion(.failure(.invalidWorkoutState(state)))
      return
    }

    let endDate = Date()
    finishEndDate = endDate
    finishCompletion = completion
    setState(.ending)
    session.stopActivity(with: endDate)
  }

  func discardWorkout(completion: @escaping VoidCompletion) {
    dispatchPrecondition(condition: .onQueue(.main))

    if state == .idle {
      completion(.success(()))
      return
    }

    guard #available(iOS 26.0, *) else {
      completion(.failure(.liveWorkoutUnavailable))
      return
    }

    guard state != .ending else {
      completion(.failure(.invalidWorkoutState(state)))
      return
    }

    let interruptedStart = startCompletion
    startCompletion = nil
    let interruption = HealthKitWorkoutControllerError.invalidWorkoutState(
      state
    )

    workoutSession?.end()
    workoutBuilder?.discardWorkout()
    clearActiveWorkout()
    lastFinishedWorkout = nil
    setState(.idle)
    interruptedStart?(.failure(interruption))
    completion(.success(()))
  }

  func getWorkoutState() -> Payload {
    dispatchPrecondition(condition: .onQueue(.main))
    return statePayload()
  }

  @available(iOS 26.0, *)
  private func handleCollectionStarted(success: Bool, error: Error?) {
    dispatchPrecondition(condition: .onQueue(.main))

    guard state == .starting, let builder = workoutBuilder else { return }
    guard success, error == nil else {
      failActiveWorkout(.workoutSessionFailed(error))
      return
    }

    let metadata = [
      "com.vlad.gymv1.localSessionId": localSessionID ?? "",
    ]
    builder.addMetadata(metadata) { [weak self, weak builder] success, error in
      DispatchQueue.main.async {
        guard let self, let builder, self.workoutBuilder === builder else {
          return
        }
        guard success, error == nil else {
          self.failActiveWorkout(.workoutSessionFailed(error))
          return
        }

        let completion = self.startCompletion
        self.startCompletion = nil
        self.setState(.running)
        completion?(.success(()))
      }
    }
  }

  @available(iOS 26.0, *)
  private func finalizeWorkout(
    session: HKWorkoutSession,
    builder: HKLiveWorkoutBuilder
  ) {
    dispatchPrecondition(condition: .onQueue(.main))

    guard
      state == .ending,
      workoutSession === session,
      workoutBuilder === builder,
      let endDate = finishEndDate
    else { return }

    builder.endCollection(withEnd: endDate) { [weak self, weak builder] success, error in
      DispatchQueue.main.async {
        guard let self, let builder, self.workoutBuilder === builder else {
          return
        }
        guard success, error == nil else {
          self.failActiveWorkout(.workoutSessionFailed(error))
          return
        }

        builder.finishWorkout { [weak self, weak builder] workout, error in
          DispatchQueue.main.async {
            guard let self, let builder, self.workoutBuilder === builder else {
              return
            }
            guard error == nil, let workout else {
              self.failActiveWorkout(.workoutSessionFailed(error))
              return
            }

            self.resolveFinishedWorkout(
              workout,
              session: session,
              builder: builder
            )
          }
        }
      }
    }
  }

  @available(iOS 26.0, *)
  private func resolveFinishedWorkout(
    _ workout: HKWorkout,
    session: HKWorkoutSession,
    builder: HKLiveWorkoutBuilder
  ) {
    dispatchPrecondition(condition: .onQueue(.main))

    var payload = metricsPayload(from: builder, capturedAt: workout.endDate)
    payload["workoutUuid"] = workout.uuid.uuidString
    payload["startTime"] = milliseconds(workout.startDate)
    payload["endTime"] = milliseconds(workout.endDate)
    payload["elapsedSeconds"] = workout.duration

    let completion = finishCompletion
    finishCompletion = nil
    lastFinishedWorkout = payload
    completion?(.success(payload))

    session.end()
    clearActiveWorkout()
    setState(.ended)
  }

  @available(iOS 26.0, *)
  private func emitLiveMetrics(from builder: HKLiveWorkoutBuilder) {
    dispatchPrecondition(condition: .onQueue(.main))

    guard state == .running, workoutBuilder === builder else { return }
    let capturedAt = Date()
    if let lastMetricsEmission,
      capturedAt.timeIntervalSince(lastMetricsEmission) < 1 {
      return
    }

    lastMetricsEmission = capturedAt
    onLiveMetrics?(metricsPayload(from: builder, capturedAt: capturedAt))
  }

  @available(iOS 26.0, *)
  private func metricsPayload(
    from builder: HKLiveWorkoutBuilder,
    capturedAt: Date
  ) -> Payload {
    let activeEnergyStatistics = builder.statistics(for: activeEnergy)
    let heartRateStatistics = builder.statistics(for: heartRate)
    let heartRateUnit = HKUnit.count().unitDivided(by: .minute())

    return [
      "elapsedSeconds": builder.elapsedTime(at: capturedAt),
      "activeEnergyKilocalories": javascriptValue(
        activeEnergyStatistics?.sumQuantity()?.doubleValue(
          for: .kilocalorie()
        )
      ),
      "heartRateBpm": javascriptValue(
        heartRateStatistics?.mostRecentQuantity()?.doubleValue(
          for: heartRateUnit
        )
      ),
      "averageHeartRateBpm": javascriptValue(
        heartRateStatistics?.averageQuantity()?.doubleValue(for: heartRateUnit)
      ),
      "maximumHeartRateBpm": javascriptValue(
        heartRateStatistics?.maximumQuantity()?.doubleValue(for: heartRateUnit)
      ),
      "capturedAt": milliseconds(capturedAt),
    ]
  }

  @available(iOS 26.0, *)
  private func failActiveWorkout(
    _ error: HealthKitWorkoutControllerError
  ) {
    dispatchPrecondition(condition: .onQueue(.main))
    guard state != .failed else { return }

    let pendingStart = startCompletion
    let pendingFinish = finishCompletion
    startCompletion = nil
    finishCompletion = nil

    workoutSession?.end()
    workoutBuilder?.discardWorkout()
    clearActiveWorkout()
    setState(.failed, errorCode: error.code)
    pendingStart?(.failure(error))
    pendingFinish?(.failure(error))
  }

  private func setState(_ state: WorkoutState, errorCode: String? = nil) {
    dispatchPrecondition(condition: .onQueue(.main))

    guard self.state != state || stateErrorCode != errorCode else { return }
    self.state = state
    stateErrorCode = errorCode
    onWorkoutStateChanged?(statePayload())
  }

  private func statePayload() -> Payload {
    var payload: Payload = ["state": state.rawValue]
    if let stateErrorCode {
      payload["errorCode"] = stateErrorCode
    }
    return payload
  }

  @available(iOS 26.0, *)
  private func clearActiveWorkout() {
    workoutSession?.delegate = nil
    workoutBuilder?.delegate = nil
    workoutSession = nil
    workoutBuilder = nil
    localSessionID = nil
    finishEndDate = nil
    startCompletion = nil
    finishCompletion = nil
    lastMetricsEmission = nil
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

  private func milliseconds(_ date: Date) -> Double {
    date.timeIntervalSince1970 * 1_000
  }
}

@available(iOS 26.0, *)
extension HealthKitWorkoutController: HKWorkoutSessionDelegate {
  func workoutSession(
    _ workoutSession: HKWorkoutSession,
    didChangeTo toState: HKWorkoutSessionState,
    from fromState: HKWorkoutSessionState,
    date: Date
  ) {
    DispatchQueue.main.async { [weak self, weak workoutSession] in
      guard
        let self,
        let workoutSession,
        self.workoutSession === workoutSession
      else { return }

      if toState == .stopped {
        if self.state == .ending, let builder = self.workoutBuilder {
          self.finalizeWorkout(session: workoutSession, builder: builder)
        }
        return
      }

      switch toState {
      case .paused where self.state == .running:
        self.setState(.paused)
      case .running where self.state == .paused:
        self.setState(.running)
      case .ended where self.state != .ended && self.state != .failed:
        self.failActiveWorkout(.workoutSessionFailed(nil))
      default:
        break
      }
    }
  }

  func workoutSession(
    _ workoutSession: HKWorkoutSession,
    didFailWithError error: Error
  ) {
    DispatchQueue.main.async { [weak self, weak workoutSession] in
      guard
        let self,
        let workoutSession,
        self.workoutSession === workoutSession
      else { return }

      self.failActiveWorkout(.workoutSessionFailed(error))
    }
  }
}

@available(iOS 26.0, *)
extension HealthKitWorkoutController: HKLiveWorkoutBuilderDelegate {
  func workoutBuilder(
    _ workoutBuilder: HKLiveWorkoutBuilder,
    didCollectDataOf collectedTypes: Set<HKSampleType>
  ) {
    DispatchQueue.main.async { [weak self, weak workoutBuilder] in
      guard let self, let workoutBuilder else { return }
      self.emitLiveMetrics(from: workoutBuilder)
    }
  }

  func workoutBuilderDidCollectEvent(
    _ workoutBuilder: HKLiveWorkoutBuilder
  ) {}
}
