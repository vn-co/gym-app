import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Colors,
  FontSize,
  FontWeight,
  MotionDuration,
  Radius,
  Spacing,
} from '../../constants/tokens';
import { useWorkoutStore } from '../../store/workoutStore';
import { formatTimerDisplay } from '../../utils';
import { useWorkoutTimer } from '../../hooks/useWorkoutTimer';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  getMotionDuration,
  getProgressPercentage,
} from '../../utils/uiPresentation';
import { AppIcon } from '../icons/AppIcon';
import type {
  HealthWorkoutState,
  LiveHealthMetrics,
} from '../../health/types';

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
  const session = useWorkoutStore((s) => s.session);
  const completedSets = useWorkoutStore((s) => s.completedSetsCount());
  const totalSets = useWorkoutStore((s) => s.totalSetsCount());
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
        : 'HEALTH METRICS UNAVAILABLE';

  return (
    <View style={styles.header}>
      <View style={styles.eyebrowRow}>
        <Text style={styles.label}>WORKOUT IN PROGRESS</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit workout"
          hitSlop={8}
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
          accessibilityLabel={isPaused ? 'Resume workout timer' : 'Pause workout timer'}
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
            color={Colors.accent}
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
      <Text style={styles.healthStatus}>{healthLabel}</Text>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {completedSets} of {totalSets} sets complete
        </Text>
        <Text style={styles.progressPercentage}>{percentage}%</Text>
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
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  editText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  metricStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  metricItem: { flex: 1 },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  healthStatus: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    letterSpacing: 0.7,
    marginBottom: Spacing.xl,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  progressPercentage: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    height: 6,
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
