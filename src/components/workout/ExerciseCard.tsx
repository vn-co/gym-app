import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Colors,
  FontSize,
  FontWeight,
  MotionDuration,
  Spacing,
  Radius,
} from '../../constants/tokens';
import { SetRow } from './SetRow';
import { useWorkoutStore } from '../../store/workoutStore';
import type { WorkoutExercise } from '../../types';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { AppIcon } from '../icons/AppIcon';

interface Props {
  exercise: WorkoutExercise;
  onRemove: () => void;
}

export function ExerciseCard({ exercise, onRemove }: Props) {
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const toggleSetComplete = useWorkoutStore((s) => s.toggleSetComplete);
  const reduceMotion = useReducedMotion();

  const completedSets = exercise.sets.filter((set) => set.completed).length;

  const handleAddSet = () => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext({
        duration: MotionDuration.standard,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
    }
    addSet(exercise.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {exercise.exerciseName}
          </Text>
          <Text style={styles.exerciseMeta}>
            {completedSets} of {exercise.sets.length} sets complete
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${exercise.exerciseName}`}
          style={({ pressed }) => [
            styles.menuButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onRemove}
        >
          <AppIcon name="more" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

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

      {exercise.sets.map((set, idx) => (
        <SetRow
          key={set.id}
          set={set}
          index={idx}
          onUpdate={(updates) => updateSet(exercise.id, set.id, updates)}
          onToggleComplete={() => toggleSetComplete(exercise.id, set.id)}
        />
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add set to ${exercise.exerciseName}`}
        style={styles.addSet}
        onPress={handleAddSet}
      >
        <AppIcon name="add" size={18} color={Colors.accent} />
        <Text style={styles.addSetText}>Add set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  exerciseName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  exerciseMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: Colors.bgCardAlt,
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addSetText: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
});
