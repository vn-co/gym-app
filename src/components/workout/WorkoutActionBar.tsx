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
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.pressed,
        ]}
      >
        <AppIcon name="add" size={21} color={Colors.accent} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Finish workout"
        onPress={onFinish}
        style={({ pressed }) => [
          styles.finishButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.finishText}>Finish workout</Text>
        <View style={styles.finishIcon}>
          <AppIcon name="check" size={18} color={Colors.bg} strokeWidth={2.3} />
        </View>
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
    gap: 6,
    padding: 6,
    borderRadius: Radius.xl,
    backgroundColor: '#0E110FF2',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  finishButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.lg,
    paddingRight: 5,
    backgroundColor: Colors.accent,
  },
  finishIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000018',
  },
  finishText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
