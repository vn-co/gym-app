import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '../../constants/tokens';
import { healthService } from '../../health/healthService';
import type {
  LiveHealthMetrics,
  TodayActivity,
  WorkoutStateSnapshot,
} from '../../health/types';

interface ProofButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}

function ProofButton({ label, onPress, disabled, danger }: ProofButtonProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        danger && styles.buttonDanger,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.buttonText, danger && styles.buttonDangerText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const formatValue = (
  value: number | null | undefined,
  suffix = '',
  fractionDigits = 0,
) =>
  value === null || value === undefined
    ? 'Unavailable'
    : `${value.toFixed(fractionDigits)}${suffix}`;

export function HealthKitProofPanel() {
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [activity, setActivity] = useState<TodayActivity | null>(null);
  const [workoutState, setWorkoutState] = useState<WorkoutStateSnapshot>({
    state: 'idle',
  });
  const [metrics, setMetrics] = useState<LiveHealthMetrics | null>(null);
  const [finishedUuid, setFinishedUuid] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const retryRef = useRef<(() => Promise<void>) | null>(null);

  const run = useCallback(async (operation: () => Promise<void>) => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await operation();
      retryRef.current = null;
    } catch (error) {
      retryRef.current = operation;
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Apple Health could not complete the request.',
      );
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribeState = healthService.subscribeToWorkoutState(
      setWorkoutState,
    );
    const unsubscribeMetrics = healthService.subscribeToLiveMetrics(setMetrics);

    void run(async () => {
      setWorkoutState(await healthService.getWorkoutState());
    });

    return () => {
      unsubscribeState();
      unsubscribeMetrics();
    };
  }, [run]);

  if (!__DEV__) return null;

  const state = workoutState.state;
  const canStart = state === 'idle' || state === 'ended' || state === 'failed';
  const canPauseOrResume = state === 'running' || state === 'paused';
  const canFinish = state === 'running' || state === 'paused';
  const canDiscard = state !== 'idle' && state !== 'ending';

  const checkAvailability = () =>
    run(async () => {
      setAvailability(await healthService.isHealthDataAvailable());
    });
  const connect = () => run(() => healthService.requestAuthorization());
  const readActivity = () =>
    run(async () => {
      setActivity(await healthService.readTodayActivity());
    });
  const start = () =>
    run(async () => {
      setMetrics(null);
      setFinishedUuid(null);
      await healthService.startWorkout(`health-proof-${Date.now()}`, Date.now());
    });
  const pauseOrResume = () =>
    run(() =>
      state === 'paused'
        ? healthService.resumeWorkout()
        : healthService.pauseWorkout(),
    );
  const finish = () =>
    run(async () => {
      const workout = await healthService.finishWorkout();
      setMetrics(workout);
      setFinishedUuid(workout.workoutUuid);
    });
  const discard = () =>
    run(async () => {
      await healthService.discardWorkout();
      setMetrics(null);
      setFinishedUuid(null);
    });

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>HEALTHKIT / DEVICE PROOF</Text>
          <Text style={styles.title}>Native workout signal</Text>
        </View>
        <View style={styles.statePill}>
          <View style={styles.stateDot} />
          <Text style={styles.stateText}>{state.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.readoutGrid}>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>AVAILABILITY</Text>
          <Text style={styles.readoutValue}>
            {availability === null
              ? 'Not checked'
              : availability
                ? 'Available'
                : 'Unavailable'}
          </Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>ELAPSED</Text>
          <Text style={styles.readoutValue}>
            {formatValue(metrics?.elapsedSeconds, ' sec')}
          </Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>ACTIVE ENERGY</Text>
          <Text style={styles.readoutValue}>
            {formatValue(metrics?.activeEnergyKilocalories, ' kcal', 1)}
          </Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>HEART RATE</Text>
          <Text style={styles.readoutValue}>
            {formatValue(metrics?.heartRateBpm, ' bpm')}
          </Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>AVERAGE HEART RATE</Text>
          <Text style={styles.readoutValue}>
            {formatValue(metrics?.averageHeartRateBpm, ' bpm')}
          </Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>MAX HEART RATE</Text>
          <Text style={styles.readoutValue}>
            {formatValue(metrics?.maximumHeartRateBpm, ' bpm')}
          </Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>TODAY MOVE</Text>
          <Text style={styles.readoutValue}>
            {formatValue(activity?.activeEnergyKilocalories, ' kcal', 1)}
          </Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>TODAY EXERCISE</Text>
          <Text style={styles.readoutValue}>
            {formatValue(activity?.exerciseMinutes, ' min')}
          </Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>TODAY STEPS</Text>
          <Text style={styles.readoutValue}>
            {formatValue(activity?.stepCount)}
          </Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>MOVE GOAL</Text>
          <Text style={styles.readoutValue}>
            {formatValue(activity?.activeEnergyGoalKilocalories, ' kcal')}
          </Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>EXERCISE GOAL</Text>
          <Text style={styles.readoutValue}>
            {formatValue(activity?.exerciseGoalMinutes, ' min')}
          </Text>
        </View>
      </View>

      {finishedUuid ? (
        <View style={styles.uuidBox}>
          <Text style={styles.readoutLabel}>SAVED WORKOUT UUID</Text>
          <Text selectable style={styles.uuidText}>
            {finishedUuid}
          </Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        <ProofButton
          label="Check availability"
          disabled={busy}
          onPress={checkAvailability}
        />
        <ProofButton
          label="Connect Apple Health"
          disabled={busy}
          onPress={connect}
        />
        <ProofButton label="Read today" disabled={busy} onPress={readActivity} />
        <ProofButton
          label="Start test workout"
          disabled={busy || !canStart}
          onPress={start}
        />
        <ProofButton
          label={state === 'paused' ? 'Resume workout' : 'Pause workout'}
          disabled={busy || !canPauseOrResume}
          onPress={pauseOrResume}
        />
        <ProofButton
          label="Finish workout"
          disabled={busy || !canFinish}
          onPress={finish}
        />
        <ProofButton
          danger
          label="Discard workout"
          disabled={busy || !canDiscard}
          onPress={discard}
        />
      </View>

      {errorMessage ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              if (retryRef.current) void run(retryRef.current);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#101310',
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    color: Colors.accent,
    fontFamily: 'monospace',
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  statePill: {
    alignItems: 'center',
    backgroundColor: Colors.accentBg,
    borderColor: Colors.borderAccent,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  stateDot: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    height: 6,
    width: 6,
  },
  stateText: {
    color: Colors.accent,
    fontFamily: 'monospace',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  readoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  readout: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    flexBasis: '47%',
    flexGrow: 1,
    padding: Spacing.md,
  },
  readoutLabel: {
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  readoutValue: {
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  uuidBox: {
    backgroundColor: Colors.accentBg,
    borderColor: Colors.borderAccent,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  uuidText: {
    color: Colors.accent,
    fontFamily: 'monospace',
    fontSize: FontSize.xs,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.bgCardAlt,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  buttonDanger: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger,
  },
  buttonDisabled: { opacity: 0.35 },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  buttonDangerText: { color: Colors.danger },
  errorRow: {
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: FontSize.sm,
  },
  retryText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
