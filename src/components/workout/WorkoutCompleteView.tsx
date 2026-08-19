import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '../../constants/tokens';
import type {
  HeartRateSample,
  PersonalRecord,
  WorkoutSession,
} from '../../types';
import { calcVolume, formatDuration, formatWeight } from '../../utils';
import { getVolumeComparison } from '../../utils/workoutCompletion';
import { AppIcon } from '../icons/AppIcon';

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
        <Text style={styles.graphEmptyText}>
          Not enough heart-rate samples for a graph.
        </Text>
      </View>
    );
  }

  const width = 320;
  const height = 112;
  const values = samples.map((sample) => sample.bpm);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 10);
  const path = samples
    .map((sample, index) => {
      const x = (index / (samples.length - 1)) * width;
      const y = height - ((sample.bpm - minimum) / range) * (height - 16) - 8;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <View style={styles.graphWrap}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={path}
          fill="none"
          stroke={Colors.chartLine}
          strokeWidth={3}
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

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
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
  const comparison = getVolumeComparison(
    workout.totalVolume,
    previousComparable,
  );
  const health = workout.health;
  const healthSaved = health?.status === 'saved';
  const samples = health?.heartRateSamples ?? [];

  return (
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
          <AppIcon name="check" size={28} color={Colors.bg} strokeWidth={2.4} />
        </View>
        <Text style={styles.eyebrow}>SESSION SAVED</Text>
        <Text style={styles.title}>Workout complete</Text>
        <Text style={styles.workoutName}>{workout.name}</Text>
      </View>

      <View style={styles.metricGrid}>
        <Metric label="DURATION" value={formatDuration(workout.durationSeconds)} />
        <Metric label="VOLUME" value={formatWeight(workout.totalVolume)} unit="kg" />
        <Metric label="SETS" value={String(workout.totalSets)} />
        <Metric
          label="ACTIVE"
          value={
            health?.activeEnergyKilocalories == null
              ? '—'
              : String(Math.round(health.activeEnergyKilocalories))
          }
          unit="kcal"
        />
      </View>

      <View style={styles.volumeContext}>
        <View>
          <Text style={styles.sectionLabel}>VOLUME CONTEXT</Text>
          <Text style={styles.contextLabel}>{comparison.label}</Text>
        </View>
        <Text style={styles.contextValue}>
          {comparison.percentage == null
            ? '—'
            : `${comparison.percentage >= 0 ? '+' : ''}${comparison.percentage}%`}
        </Text>
      </View>

      {newRecords.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
          {newRecords.map((record) => (
            <View key={record.exerciseId} style={styles.recordRow}>
              <View style={styles.recordMark}>
                <Text style={styles.recordMarkText}>PR</Text>
              </View>
              <View style={styles.recordCopy}>
                <Text style={styles.recordName}>{record.exerciseName}</Text>
                <Text style={styles.recordDetail}>
                  {formatWeight(record.weight)} kg × {record.reps} reps
                </Text>
              </View>
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
              : `${Math.round(health.averageHeartRateBpm)} bpm avg`}
          </Text>
        </View>
        <HeartRateGraph samples={samples} />
        {health?.maximumHeartRateBpm != null ? (
          <Text style={styles.heartPeak}>
            Peak {Math.round(health.maximumHeartRateBpm)} bpm
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>EXERCISE BREAKDOWN</Text>
        {workout.exercises.map((exercise, index) => {
          const completedSets = exercise.sets.filter(
            (setEntry) => setEntry.completed,
          );
          const record = newRecords.some(
            (item) => item.exerciseId === exercise.exerciseId,
          );
          return (
            <View key={exercise.id} style={styles.exerciseRow}>
              <Text style={styles.exerciseIndex}>{index + 1}</Text>
              <View style={styles.exerciseCopy}>
                <View style={styles.exerciseNameRow}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  {record ? <Text style={styles.exercisePr}>PR</Text> : null}
                </View>
                <Text style={styles.exerciseMeta}>
                  {completedSets.length} sets · {formatWeight(calcVolume(completedSets))} kg
                </Text>
                {completedSets.length > 0 ? (
                  <Text style={styles.exerciseSetDetails}>
                    {completedSets
                      .map(
                        (setEntry) =>
                          `${formatWeight(setEntry.weight)} kg × ${setEntry.reps}`,
                      )
                      .join('  ·  ')}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
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
                : 'Apple Health unavailable'}
          </Text>
          <Text style={styles.healthDetail}>
            {healthSaved
              ? 'Your local workout and Apple Health session are linked.'
              : 'Your workout is still saved safely on this device.'}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Done with workout summary"
        style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
        onPress={onDone}
      >
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  completeIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.heavy,
    letterSpacing: -1,
  },
  workoutName: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  metric: {
    width: '50%',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.border,
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
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  volumeContext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xxl,
    marginBottom: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.9,
  },
  contextLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  contextValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  section: { marginBottom: Spacing.xxl },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionMeta: { color: Colors.textSecondary, fontSize: FontSize.sm },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recordMark: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  recordMarkText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.heavy,
  },
  recordCopy: { flex: 1 },
  recordName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  recordDetail: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  graphWrap: {
    paddingTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  graphRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
  },
  graphRangeText: { color: Colors.textMuted, fontSize: FontSize.xs },
  graphEmpty: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  graphEmptyText: { color: Colors.textMuted, fontSize: FontSize.sm },
  heartPeak: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  exerciseRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseIndex: {
    width: 32,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  exerciseCopy: { flex: 1 },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  exerciseName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  exercisePr: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  exerciseMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  exerciseSetDetails: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
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
  healthDotUnavailable: { backgroundColor: Colors.textMuted },
  healthCopy: { flex: 1 },
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
    height: 54,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: Colors.bg,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
