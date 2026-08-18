import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/tokens';
import { useWorkoutStore } from '../../store/workoutStore';
import { formatTimerDisplay } from '../../utils';
import { useWorkoutTimer } from '../../hooks/useWorkoutTimer';

export function SessionHeader() {
  const session = useWorkoutStore((s) => s.session);
  const pauseSession = useWorkoutStore((s) => s.pauseSession);
  const resumeSession = useWorkoutStore((s) => s.resumeSession);
  const completedSets = useWorkoutStore((s) => s.completedSetsCount());
  const totalSets = useWorkoutStore((s) => s.totalSetsCount());
  const elapsedSeconds = useWorkoutTimer(session);

  if (!session) return null;

  const progress = totalSets > 0 ? completedSets / totalSets : 0;
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>ACTIVE SESSION</Text>

      <View style={styles.timerRow}>
        <Text style={styles.timer}>{formatTimerDisplay(elapsedSeconds)}</Text>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={session.runningSince === null ? resumeSession : pauseSession}
          >
            <Text style={styles.controlIcon}>
              {session.runningSince === null ? '▶' : '⏸'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {completedSets} / {totalSets} sets done
        </Text>
        <Text style={styles.progressPct}>{pct}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  timer: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.heavy,
    color: Colors.accent,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    color: Colors.accent,
    fontSize: FontSize.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  progressPct: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  progressBar: {
    height: 5,
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
