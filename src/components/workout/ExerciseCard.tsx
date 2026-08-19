import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { useWorkoutStore } from '../../store/workoutStore';
import type { WorkoutExercise } from '../../types';
import { AppIcon } from '../icons/AppIcon';
import { SetRow } from './SetRow';

interface Props {
  exercise: WorkoutExercise;
  onOpenMenu: () => void;
}

export function ExerciseCard({ exercise, onOpenMenu }: Props) {
  const addSet = useWorkoutStore((state) => state.addSet);
  const updateSet = useWorkoutStore((state) => state.updateSet);
  const toggleSetComplete = useWorkoutStore(
    (state) => state.toggleSetComplete,
  );
  const removeSet = useWorkoutStore((state) => state.removeSet);
  const reduceMotion = useReducedMotion();

  const completedSets = exercise.sets.filter((set) => set.completed).length;
  const currentSetId = exercise.sets.find((set) => !set.completed)?.id;

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
          onPress={onOpenMenu}
        >
          <AppIcon name="more" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.colHeaders}>
        <Text style={[styles.colLabel, styles.setColumn]}>SET</Text>
        <Text style={[styles.colLabel, styles.valueColumn]}>KG</Text>
        <Text style={[styles.colLabel, styles.valueColumn]}>REPS</Text>
        <View style={styles.actionColumns} />
      </View>

      <View style={styles.ledger}>
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            set={set}
            index={index}
            isCurrent={set.id === currentSetId}
            onUpdate={(updates) => updateSet(exercise.id, set.id, updates)}
            onToggleComplete={() => toggleSetComplete(exercise.id, set.id)}
            onRemove={() => removeSet(exercise.id, set.id)}
            canRemove={exercise.sets.length > 1}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add set to ${exercise.exerciseName}`}
        style={({ pressed }) => [
          styles.addSet,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleAddSet}
      >
        <AppIcon name="add" size={17} color={Colors.accent} />
        <Text style={styles.addSetText}>Add set</Text>
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
    marginBottom: Spacing.xl,
  },
  header: {
    minHeight: 58,
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
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xxl,
    letterSpacing: -0.6,
  },
  exerciseMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  colLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.9,
    textAlign: 'center',
  },
  setColumn: {
    width: 32,
  },
  valueColumn: {
    flex: 1,
  },
  actionColumns: {
    width: 76,
  },
  ledger: {
    paddingTop: Spacing.xs,
  },
  addSet: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  addSetText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
