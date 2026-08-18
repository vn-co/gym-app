import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '../../constants/tokens';
import { SetRow } from './SetRow';
import { useWorkoutStore } from '../../store/workoutStore';
import type { WorkoutExercise } from '../../types';

interface Props {
  exercise: WorkoutExercise;
  onRemove: () => void;
}

export function ExerciseCard({ exercise, onRemove }: Props) {
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const toggleSetComplete = useWorkoutStore((s) => s.toggleSetComplete);

  const allDone =
    exercise.sets.length > 0 && exercise.sets.every((s) => s.completed);
  const anyDone = exercise.sets.some((s) => s.completed);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.dot,
              allDone
                ? styles.dotDone
                : anyDone
                  ? styles.dotPartial
                  : styles.dotDefault,
            ]}
          />
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
        </View>
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.menuDots}>···</Text>
        </TouchableOpacity>
      </View>

      {/* Column headers */}
      <View style={styles.colHeaders}>
        <Text style={[styles.colLabel, { width: 32, textAlign: 'center' }]}>
          SET
        </Text>
        <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>
          KG
        </Text>
        <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>
          REPS
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Sets */}
      {exercise.sets.map((set, idx) => (
        <SetRow
          key={set.id}
          set={set}
          index={idx}
          onUpdate={(updates) => updateSet(exercise.id, set.id, updates)}
          onToggleComplete={() => toggleSetComplete(exercise.id, set.id)}
        />
      ))}

      {/* Add set */}
      <TouchableOpacity
        style={styles.addSet}
        onPress={() => addSet(exercise.id)}
      >
        <Text style={styles.addSetText}>+ Add Set</Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  dotDefault: {
    backgroundColor: Colors.dot,
  },
  dotPartial: {
    backgroundColor: Colors.accentDim,
  },
  dotDone: {
    backgroundColor: Colors.accent,
  },
  exerciseName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  menuDots: {
    color: Colors.textMuted,
    fontSize: FontSize.xl,
    letterSpacing: 2,
    fontWeight: FontWeight.bold,
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  colLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  addSet: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  addSetText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
