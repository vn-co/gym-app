import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  MotionDuration,
  Radius,
  Spacing,
} from '../../constants/tokens';
import type {
  HealthWorkoutState,
  LiveHealthMetrics,
} from '../../health/types';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWorkoutTimer } from '../../hooks/useWorkoutTimer';
import { useWorkoutStore } from '../../store/workoutStore';
import { formatTimerDisplay } from '../../utils';
import {
  getMotionDuration,
  getProgressPercentage,
} from '../../utils/uiPresentation';
import { AppIcon } from '../icons/AppIcon';

interface Props {
  metrics: LiveHealthMetrics | null;
  healthState: HealthWorkoutState;
  onEdit: () => void;
  onTogglePause: () => void;
}

export function SessionHeader({
  metrics,
  healthState,
  onEdit,
  onTogglePause,
}: Props) {
  const session = useWorkoutStore((state) => state.session);
  const completedSets = useWorkoutStore((state) =>
    state.completedSetsCount(),
  );
  const totalSets = useWorkoutStore((state) => state.totalSetsCount());
  const elapsedSeconds = useWorkoutTimer(session);
  const reduceMotion = useReducedMotion();
  const percentage = getProgressPercentage(completedSets, totalSets);
  const progress = useRef(new Animated.Value(percentage)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage,
      duration: getMotionDuration(reduceMotion, MotionDuration.standard),
      useNativeDriver: false,
    }).start();
  }, [percentage, progress, reduceMotion]);

  if (!session) return null;

  const isPaused = session.runningSince === null;
  const progressWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  const healthLabel =
    healthState === 'running' || healthState === 'paused'
      ? 'APPLE HEALTH LIVE'
      : healthState === 'starting' || healthState === 'ending'
        ? 'CONNECTING TO APPLE HEALTH'
        : 'LOCAL METRICS ONLY';

  return (
    <View style={styles.header}>
      <View style={styles.eyebrowRow}>
        <View style={styles.liveLabel}>
          <View style={styles.liveDot} />
          <Text style={styles.label}>WORKOUT LIVE</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit workout"
          hitSlop={8}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.controlButtonPressed,
          ]}
          onPress={onEdit}
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {session.workoutName}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isPaused ? 'Resume workout timer' : 'Pause workout timer'
          }
          hitSlop={4}
          onPress={onTogglePause}
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlButtonPressed,
          ]}
        >
          <AppIcon
            name={isPaused ? 'play' : 'pause'}
            size={20}
            color={Colors.bg}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>

      <View style={styles.metricStrip}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>TIME</Text>
          <Text
            accessibilityLiveRegion="none"
            accessibilityLabel={`Workout time ${formatTimerDisplay(elapsedSeconds)}`}
            style={styles.metricValue}
          >
            {formatTimerDisplay(elapsedSeconds)}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>ACTIVE</Text>
          <Text style={styles.metricValue}>
            {metrics?.activeEnergyKilocalories == null
              ? '—'
              : Math.round(metrics.activeEnergyKilocalories)}
            <Text style={styles.metricUnit}> kcal</Text>
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>HEART</Text>
          <Text style={styles.metricValue}>
            {metrics?.heartRateBpm == null
              ? '—'
              : Math.round(metrics.heartRateBpm)}
            <Text style={styles.metricUnit}> bpm</Text>
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.healthStatus}>{healthLabel}</Text>
        <Text style={styles.progressText}>
          {completedSets}/{totalSets} SETS
        </Text>
      </View>
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  eyebrowRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  liveLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
  },
  editButton: {
    minWidth: 54,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.bgElevated,
  },
  editText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1.2,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.97 }],
  },
  metricStrip: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
    marginBottom: 6,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  metricUnit: {
    color: Colors.textMuted,
    fontFamily: undefined,
    fontSize: 9,
    fontWeight: FontWeight.medium,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  healthStatus: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.8,
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
});
