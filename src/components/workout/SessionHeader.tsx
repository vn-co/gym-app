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

export function SessionHeader() {
  const session = useWorkoutStore((s) => s.session);
  const pauseSession = useWorkoutStore((s) => s.pauseSession);
  const resumeSession = useWorkoutStore((s) => s.resumeSession);
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

  return (
    <View style={styles.header}>
      <Text style={styles.label}>WORKOUT IN PROGRESS</Text>

      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {session.workoutName}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPaused ? 'Resume workout timer' : 'Pause workout timer'}
          hitSlop={4}
          onPress={isPaused ? resumeSession : pauseSession}
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

      <Text
        accessibilityLiveRegion="none"
        accessibilityLabel={`Workout time ${formatTimerDisplay(elapsedSeconds)}`}
        style={styles.timer}
      >
        {formatTimerDisplay(elapsedSeconds)}
      </Text>

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
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
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
  timer: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
    marginBottom: Spacing.xl,
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
