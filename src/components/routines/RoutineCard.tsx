import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '../../constants/tokens';
import type { Routine } from '../../types';

interface Props {
  routine: Routine;
  index?: number;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}

function routineNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export function RoutineCard({
  routine,
  index = 0,
  onStart,
  onEdit,
  onDelete,
  compact,
}: Props) {
  const totalSets = routine.exercises.reduce(
    (total, exercise) => total + exercise.defaultSets,
    0,
  );

  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Start ${routine.name}`}
        style={({ pressed }) => [
          styles.compactCard,
          pressed && styles.pressed,
        ]}
        onPress={onStart}
      >
        <View style={styles.compactIndex}>
          <Text style={styles.compactIndexText}>{routineNumber(index)}</Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName}>{routine.name}</Text>
          <Text style={styles.compactMeta}>
            {routine.exercises.length} exercises · {totalSets} sets
          </Text>
        </View>
        <View style={styles.compactArrow}>
          <Text style={styles.compactArrowText}>→</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>ROUTINE {routineNumber(index)}</Text>
          <Text style={styles.name}>{routine.name}</Text>
          <Text style={styles.meta}>
            {routine.exercises.length} exercises · {totalSets} working sets
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${routine.name}`}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
            onPress={onEdit}
          >
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${routine.name}`}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
            onPress={onDelete}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.exerciseList}>
        {routine.exercises.slice(0, 4).map((exercise, exerciseIndex) => (
          <View
            key={`${exercise.exerciseId}_${exerciseIndex}`}
            style={styles.exerciseRow}
          >
            <Text style={styles.exerciseIndex}>
              {String(exerciseIndex + 1).padStart(2, '0')}
            </Text>
            <Text style={styles.exerciseName} numberOfLines={1}>
              {exercise.exerciseName}
            </Text>
            <Text style={styles.exercisePrescription}>
              {exercise.defaultSets}×{exercise.defaultReps}
            </Text>
          </View>
        ))}
        {routine.exercises.length > 4 ? (
          <Text style={styles.moreText}>
            +{routine.exercises.length - 4} more exercises
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Start ${routine.name}`}
        style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
        onPress={onStart}
      >
        <Text style={styles.startButtonText}>Start workout</Text>
        <View style={styles.startArrow}>
          <Text style={styles.startArrowText}>→</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  titleBlock: { flex: 1 },
  kicker: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.9,
    marginBottom: Spacing.sm,
  },
  name: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xxl,
    letterSpacing: -0.6,
  },
  meta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 5,
  },
  actions: { alignItems: 'flex-end', gap: 4 },
  actionButton: {
    minWidth: 52,
    minHeight: 30,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  editText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  deleteText: {
    color: Colors.danger,
    fontSize: FontSize.xs,
  },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.lg,
  },
  exerciseRow: {
    minHeight: 44,
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
  exerciseName: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  exercisePrescription: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
    fontVariant: ['tabular-nums'],
  },
  moreText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    paddingTop: Spacing.sm,
  },
  startButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent,
    marginTop: Spacing.lg,
    paddingLeft: Spacing.lg,
    paddingRight: 5,
  },
  startButtonText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  startArrow: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000018',
  },
  startArrowText: {
    color: Colors.bg,
    fontFamily: FontFamily.data,
    fontSize: FontSize.lg,
  },
  compactCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  compactIndex: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    marginRight: Spacing.md,
  },
  compactIndexText: {
    color: Colors.accent,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  compactInfo: { flex: 1 },
  compactName: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.lg,
  },
  compactMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 3,
  },
  compactArrow: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  compactArrowText: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.md,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
