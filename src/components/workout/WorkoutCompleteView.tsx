import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  MotionDuration,
  Radius,
  Spacing,
} from '../../constants/tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type {
  HeartRateSample,
  PersonalRecord,
  WorkoutSession,
} from '../../types';
import { calcVolume, formatDuration, formatWeight } from '../../utils';
import { getVolumeComparison } from '../../utils/workoutCompletion';
import { getMotionDuration } from '../../utils/uiPresentation';
import { AppIcon } from '../icons/AppIcon';
import { AmbientBackdrop } from '../ui/AmbientBackdrop';

interface Props {
  workout: WorkoutSession;
  previousComparable?: WorkoutSession;
  newRecords: PersonalRecord[];
  bottomInset: number;
  onDone: () => void;
}

function HeartRateGraph({ samples }: { samples: HeartRateSample[] }) {
  if (samples.length < 2) {
    return (
      <View style={styles.graphEmpty}>
        <Text style={styles.graphEmptyTitle}>No heart-rate trace</Text>
        <Text style={styles.graphEmptyText}>
          The workout is saved even when a sensor is unavailable.
        </Text>
      </View>
    );
  }

  const width = 320;
  const height = 122;
  const values = samples.map((sample) => sample.bpm);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 10);
  const path = samples
    .map((sample, index) => {
      const x = (index / (samples.length - 1)) * width;
      const y = height - ((sample.bpm - minimum) / range) * (height - 22) - 11;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <View style={styles.graphWrap}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={path}
          fill="none"
          stroke={Colors.accent}
          strokeWidth={11}
          strokeOpacity={0.08}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={path}
          fill="none"
          stroke={Colors.chartLine}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View style={styles.graphRange}>
        <Text style={styles.graphRangeText}>{Math.round(minimum)} bpm</Text>
        <Text style={styles.graphRangeText}>{Math.round(maximum)} bpm</Text>
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value}
        {unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export function WorkoutCompleteView({
  workout,
  previousComparable,
  newRecords,
  bottomInset,
  onDone,
}: Props) {
  const reduceMotion = useReducedMotion();
  const entrance = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const comparison = getVolumeComparison(
    workout.totalVolume,
    previousComparable,
  );
  const health = workout.health;
  const healthSaved = health?.status === 'saved';
  const samples = health?.heartRateSamples ?? [];
  const comparisonValue =
    comparison.percentage == null
      ? 'First comparable session'
      : `${comparison.percentage >= 0 ? '+' : ''}${comparison.percentage}% ${comparison.label}`;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: getMotionDuration(reduceMotion, MotionDuration.standard),
      useNativeDriver: true,
    }).start();
  }, [entrance, reduceMotion]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return (
    <View style={styles.root}>
      <AmbientBackdrop intensity="hero" />
      <Animated.View
        style={[
          styles.animatedContent,
          { opacity: entrance, transform: [{ translateY }] },
        ]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomInset + Spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.completeIcon}>
              <AppIcon
                name="check"
                size={24}
                color={Colors.bg}
                strokeWidth={2.5}
              />
            </View>
            <Text style={styles.eyebrow}>SESSION SAVED</Text>
            <Text style={styles.title}>Workout complete</Text>
            <Text style={styles.workoutName}>{workout.name}</Text>
          </View>

          <View style={styles.metricStrip}>
            <Metric
              label="TIME"
              value={formatDuration(workout.durationSeconds)}
            />
            <View style={styles.metricDivider} />
            <Metric
              label="ACTIVE"
              value={
                health?.activeEnergyKilocalories == null
                  ? '—'
                  : String(Math.round(health.activeEnergyKilocalories))
              }
              unit="kcal"
            />
            <View style={styles.metricDivider} />
            <Metric
              label="AVG HEART"
              value={
                health?.averageHeartRateBpm == null
                  ? '—'
                  : String(Math.round(health.averageHeartRateBpm))
              }
              unit="bpm"
            />
          </View>

          <View style={styles.volumeCard}>
            <View style={styles.volumeTop}>
              <Text style={styles.sectionLabel}>TOTAL VOLUME</Text>
              <Text style={styles.volumeSets}>{workout.totalSets} sets</Text>
            </View>
            <Text style={styles.volumeValue}>
              {formatWeight(workout.totalVolume)}
              <Text style={styles.volumeUnit}> kg</Text>
            </Text>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonMark} />
              <Text style={styles.comparisonText}>{comparisonValue}</Text>
            </View>
          </View>

          {newRecords.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
              {newRecords.map((record) => (
                <View key={record.exerciseId} style={styles.recordCard}>
                  <View style={styles.recordBadge}>
                    <Text style={styles.recordBadgeText}>NEW PR</Text>
                  </View>
                  <View style={styles.recordCopy}>
                    <Text style={styles.recordName}>{record.exerciseName}</Text>
                    <Text style={styles.recordDetail}>
                      {formatWeight(record.weight)} kg × {record.reps} reps
                    </Text>
                  </View>
                  <Text style={styles.recordSpark}>✦</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionLabel}>HEART RATE</Text>
              <Text style={styles.sectionMeta}>
                {health?.averageHeartRateBpm == null
                  ? 'No data'
                  : `${Math.round(health.averageHeartRateBpm)} avg · ${health.maximumHeartRateBpm == null ? '—' : Math.round(health.maximumHeartRateBpm)} max`}
              </Text>
            </View>
            <View style={styles.graphCard}>
              <HeartRateGraph samples={samples} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionLabel}>EXERCISE BREAKDOWN</Text>
              <Text style={styles.sectionMeta}>
                {workout.exercises.length} exercises
              </Text>
            </View>
            <View style={styles.breakdown}>
              {workout.exercises.map((exercise, index) => {
                const completedSets = exercise.sets.filter(
                  (setEntry) => setEntry.completed,
                );
                const record = newRecords.some(
                  (item) => item.exerciseId === exercise.exerciseId,
                );
                const bestSet = completedSets.reduce<
                  (typeof completedSets)[number] | null
                >((best, setEntry) => {
                  if (!best || setEntry.weight > best.weight) return setEntry;
                  if (
                    setEntry.weight === best.weight &&
                    setEntry.reps > best.reps
                  ) {
                    return setEntry;
                  }
                  return best;
                }, null);

                return (
                  <View key={exercise.id} style={styles.exerciseRow}>
                    <Text style={styles.exerciseIndex}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                    <View style={styles.exerciseCopy}>
                      <View style={styles.exerciseNameRow}>
                        <Text style={styles.exerciseName}>
                          {exercise.exerciseName}
                        </Text>
                        {record ? (
                          <Text style={styles.exercisePr}>PR</Text>
                        ) : null}
                      </View>
                      <Text style={styles.exerciseMeta}>
                        {completedSets.length} sets ·{' '}
                        {formatWeight(calcVolume(completedSets))} kg volume
                      </Text>
                      <Text style={styles.exerciseSetDetails}>
                        {completedSets.length === 0
                          ? 'No completed sets'
                          : completedSets
                              .map(
                                (setEntry) =>
                                  `${formatWeight(setEntry.weight)} × ${setEntry.reps}`,
                              )
                              .join('   ·   ')}
                      </Text>
                    </View>
                    {bestSet ? (
                      <View style={styles.bestSet}>
                        <Text style={styles.bestSetLabel}>BEST</Text>
                        <Text style={styles.bestSetValue}>
                          {formatWeight(bestSet.weight)}×{bestSet.reps}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.healthStatus}>
            <View
              style={[
                styles.healthDot,
                !healthSaved && styles.healthDotUnavailable,
              ]}
            />
            <View style={styles.healthCopy}>
              <Text style={styles.healthTitle}>
                {healthSaved
                  ? 'Saved to Apple Health'
                  : health?.status === 'failed'
                    ? 'Apple Health save failed'
                    : 'Saved locally'}
              </Text>
              <Text style={styles.healthDetail}>
                {healthSaved
                  ? 'This strength session is linked to your Apple Health history.'
                  : 'Your exercises, sets, and records are safe on this device.'}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done with workout summary"
            style={({ pressed }) => [
              styles.doneButton,
              pressed && styles.pressed,
            ]}
            onPress={onDone}
          >
            <Text style={styles.doneText}>Done</Text>
            <View style={styles.doneIcon}>
              <AppIcon name="check" size={18} color={Colors.bg} />
            </View>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  animatedContent: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  completeIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    marginBottom: Spacing.lg,
    shadowColor: Colors.accent,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1.2,
    textAlign: 'center',
  },
  workoutName: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  metricStrip: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  metric: {
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
    letterSpacing: 0.9,
    marginBottom: 7,
    textAlign: 'center',
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
    fontSize: 9,
    fontWeight: FontWeight.medium,
  },
  volumeCard: {
    overflow: 'hidden',
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  volumeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
  },
  volumeSets: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  volumeValue: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: 50,
    letterSpacing: -1.4,
    marginTop: Spacing.md,
  },
  volumeUnit: {
    color: Colors.textMuted,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
  },
  comparisonRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  comparisonMark: {
    width: 16,
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentSoft,
  },
  comparisonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionMeta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  recordCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  recordBadge: {
    minWidth: 58,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    marginRight: Spacing.md,
  },
  recordBadgeText: {
    color: Colors.bg,
    fontSize: 9,
    fontWeight: FontWeight.heavy,
    letterSpacing: 0.5,
  },
  recordCopy: {
    flex: 1,
  },
  recordName: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.lg,
  },
  recordDetail: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  recordSpark: {
    color: Colors.accent,
    fontSize: FontSize.xl,
  },
  graphCard: {
    overflow: 'hidden',
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  graphWrap: {
    paddingTop: Spacing.xs,
  },
  graphRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  graphRangeText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontVariant: ['tabular-nums'],
  },
  graphEmpty: {
    height: 134,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  graphEmptyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  graphEmptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  exerciseRow: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseIndex: {
    width: 34,
    color: Colors.textMuted,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
  },
  exerciseCopy: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  exerciseName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  exercisePr: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },
  exerciseMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  exerciseSetDetails: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.data,
    fontSize: 10,
    lineHeight: 17,
    marginTop: Spacing.xs,
  },
  bestSet: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  bestSetLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.8,
  },
  bestSetValue: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    marginTop: 6,
    marginRight: Spacing.md,
  },
  healthDotUnavailable: {
    backgroundColor: Colors.textMuted,
  },
  healthCopy: {
    flex: 1,
  },
  healthTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  healthDetail: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 19,
    marginTop: Spacing.xs,
  },
  doneButton: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent,
    paddingLeft: Spacing.lg,
    paddingRight: 5,
  },
  doneIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000018',
  },
  doneText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
