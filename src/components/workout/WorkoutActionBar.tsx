import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '../../constants/tokens';
import { AppIcon } from '../icons/AppIcon';

interface WorkoutActionBarProps {
  bottom: number;
  onAddExercise: () => void;
  onFinish: () => void;
}

export function WorkoutActionBar({
  bottom,
  onAddExercise,
  onFinish,
}: WorkoutActionBarProps) {
  return (
    <View style={[styles.container, { bottom }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add exercise"
        onPress={onAddExercise}
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
      >
        <AppIcon name="add" size={22} color={Colors.accent} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Finish workout"
        onPress={onFinish}
        style={({ pressed }) => [styles.finishButton, pressed && styles.pressed]}
      >
        <AppIcon name="check" size={20} color={Colors.bg} strokeWidth={2.2} />
        <Text style={styles.finishText}>Finish workout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  finishButton: {
    flex: 1,
    height: 52,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
  },
  finishText: {
    color: Colors.bg,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
