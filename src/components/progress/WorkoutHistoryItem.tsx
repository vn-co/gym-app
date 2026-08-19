import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
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
  if (session.health?.status === 'saved') return 'Health synced';
  if (session.health?.status === 'failed') return 'Sync failed';
  return 'Local only';
}

export function WorkoutHistoryItem({ session }: Props) {
  const [expanded, setExpanded] = useState(false);
  const health = session.health;

  return (
    <View style={[styles.container, expanded && styles.containerExpanded]}>
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
          <Text style={styles.name} numberOfLines={1}>
            {session.name}
          </Text>
          <Text style={styles.summary}>
            {formatDuration(session.durationSeconds)} ·{' '}
            {formatWeight(session.totalVolume)} kg
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
          <View style={styles.disclosure}>
            <Text style={styles.disclosureText}>{expanded ? '−' : '+'}</Text>
          </View>
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
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>AVG HEART</Text>
              <Text style={styles.metricValue}>
                {health?.averageHeartRateBpm == null
                  ? '—'
                  : Math.round(health.averageHeartRateBpm)}
                <Text style={styles.metricUnit}> bpm</Text>
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>MAX HEART</Text>
              <Text style={styles.metricValue}>
                {health?.maximumHeartRateBpm == null
                  ? '—'
                  : Math.round(health.maximumHeartRateBpm)}
                <Text style={styles.metricUnit}> bpm</Text>
              </Text>
            </View>
          </View>

          <View style={styles.exerciseList}>
            {session.exercises.map((exercise, index) => {
              const completedSets = exercise.sets.filter(
                (setEntry) => setEntry.completed,
              );
              return (
                <View key={exercise.id} style={styles.exerciseRow}>
                  <Text style={styles.exerciseIndex}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <View style={styles.exerciseCopy}>
                    <View style={styles.exerciseHeading}>
                      <Text style={styles.exerciseName}>
                        {exercise.exerciseName}
                      </Text>
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
                                `${formatWeight(setEntry.weight)} × ${setEntry.reps}`,
                            )
                            .join('   ·   ')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  containerExpanded: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.bgCard,
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  header: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  pressed: { opacity: 0.72 },
  dateBlock: { width: 58 },
  date: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  time: {
    color: Colors.textMuted,
    fontFamily: FontFamily.data,
    fontSize: 10,
    marginTop: 4,
  },
  titleBlock: { flex: 1, paddingRight: Spacing.sm },
  name: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.lg,
  },
  summary: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 5,
  },
  statusBlock: { alignItems: 'flex-end', gap: 7 },
  healthStatus: { color: Colors.textMuted, fontSize: 9 },
  healthStatusSaved: { color: Colors.accent },
  disclosure: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.bgElevated,
  },
  disclosureText: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.md,
    lineHeight: 19,
  },
  details: { paddingBottom: Spacing.lg },
  metricStrip: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.65,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  metricValue: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  metricUnit: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.regular,
  },
  exerciseList: { paddingTop: Spacing.xs },
  exerciseRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseIndex: {
    width: 30,
    color: Colors.textMuted,
    fontFamily: FontFamily.data,
    fontSize: 9,
  },
  exerciseCopy: { flex: 1, paddingVertical: Spacing.sm },
  exerciseHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  exerciseName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  exerciseVolume: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
    fontVariant: ['tabular-nums'],
  },
  setDetails: {
    color: Colors.textMuted,
    fontFamily: FontFamily.data,
    fontSize: 10,
    lineHeight: 17,
    marginTop: Spacing.xs,
  },
});
