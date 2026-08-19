import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
} from '../../constants/tokens';
import type { WorkoutSession } from '../../types';
import {
  calcVolume,
  formatDuration,
  formatSessionTime,
  formatShortDate,
  formatWeight,
} from '../../utils';

interface Props {
  session: WorkoutSession;
}

function healthStatus(session: WorkoutSession): string {
  if (session.health?.status === 'saved') return 'Saved to Health';
  if (session.health?.status === 'failed') return 'Health save failed';
  return 'Local only';
}

export function WorkoutHistoryItem({ session }: Props) {
  const [expanded, setExpanded] = useState(false);
  const health = session.health;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${session.name}`}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        onPress={() => setExpanded((current) => !current)}
      >
        <View style={styles.dateBlock}>
          <Text style={styles.date}>{formatShortDate(session.startTime)}</Text>
          <Text style={styles.time}>{formatSessionTime(session.startTime)}</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1}>{session.name}</Text>
          <Text style={styles.summary}>
            {formatDuration(session.durationSeconds)} · {formatWeight(session.totalVolume)} kg
          </Text>
        </View>
        <View style={styles.statusBlock}>
          <Text
            style={[
              styles.healthStatus,
              health?.status === 'saved' && styles.healthStatusSaved,
            ]}
          >
            {healthStatus(session)}
          </Text>
          <Text style={styles.disclosure}>{expanded ? '−' : '+'}</Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          <View style={styles.metricStrip}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>ACTIVE</Text>
              <Text style={styles.metricValue}>
                {health?.activeEnergyKilocalories == null
                  ? '—'
                  : Math.round(health.activeEnergyKilocalories)}
                <Text style={styles.metricUnit}> kcal</Text>
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>AVG HR</Text>
              <Text style={styles.metricValue}>
                {health?.averageHeartRateBpm == null
                  ? '—'
                  : Math.round(health.averageHeartRateBpm)}
                <Text style={styles.metricUnit}> bpm</Text>
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>MAX HR</Text>
              <Text style={styles.metricValue}>
                {health?.maximumHeartRateBpm == null
                  ? '—'
                  : Math.round(health.maximumHeartRateBpm)}
                <Text style={styles.metricUnit}> bpm</Text>
              </Text>
            </View>
          </View>

          {session.exercises.map((exercise) => {
            const completedSets = exercise.sets.filter(
              (setEntry) => setEntry.completed,
            );
            return (
              <View key={exercise.id} style={styles.exerciseRow}>
                <View style={styles.exerciseHeading}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  <Text style={styles.exerciseVolume}>
                    {formatWeight(calcVolume(completedSets))} kg
                  </Text>
                </View>
                <Text style={styles.setDetails}>
                  {completedSets.length === 0
                    ? 'No completed sets'
                    : completedSets
                        .map(
                          (setEntry) =>
                            `${formatWeight(setEntry.weight)} kg × ${setEntry.reps}`,
                        )
                        .join('  ·  ')}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  pressed: { opacity: 0.7 },
  dateBlock: { width: 54 },
  date: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  time: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 3 },
  titleBlock: { flex: 1, paddingRight: Spacing.sm },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  summary: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 },
  statusBlock: { alignItems: 'flex-end' },
  healthStatus: { color: Colors.textMuted, fontSize: FontSize.xs },
  healthStatusSaved: { color: Colors.accent },
  disclosure: {
    color: Colors.textSecondary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.medium,
    marginTop: 4,
  },
  details: { paddingBottom: Spacing.lg },
  metricStrip: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  metric: { flex: 1 },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
  },
  exerciseRow: { paddingVertical: Spacing.sm },
  exerciseHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  exerciseVolume: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontVariant: ['tabular-nums'],
  },
  setDetails: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
});
