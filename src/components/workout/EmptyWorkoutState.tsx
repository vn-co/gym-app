import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
  TabBarMetrics,
} from '../../constants/tokens';
import { AppIcon } from '../icons/AppIcon';

interface EmptyWorkoutStateProps {
  onStart: () => void;
}

export function EmptyWorkoutState({ onStart }: EmptyWorkoutStateProps) {
  const insets = useSafeAreaInsets();
  const bottomInset =
    Math.max(insets.bottom, TabBarMetrics.bottomGap) +
    TabBarMetrics.height +
    Spacing.xl;

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <Text style={styles.screenTitle}>Workout</Text>

      <View style={styles.content}>
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.illustration}
        >
          <View style={[styles.orbit, styles.orbitLarge]} />
          <View style={[styles.orbit, styles.orbitSmall]} />
          <View style={styles.iconShell}>
            <AppIcon
              name="dumbbell"
              size={58}
              color={Colors.accent}
              strokeWidth={1.5}
            />
          </View>
        </View>

        <Text style={styles.headline}>Ready when you are</Text>
        <Text style={styles.supportingCopy}>
          Start an empty workout here, or launch one of your saved routines from
          Routines.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start workout"
        onPress={onStart}
        style={({ pressed }) => [
          styles.startButton,
          pressed && styles.startButtonPressed,
        ]}
      >
        <Text style={styles.startButtonText}>Start workout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  illustration: {
    width: 164,
    height: 138,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  orbit: {
    position: 'absolute',
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orbitLarge: {
    width: 116,
    height: 116,
    left: 13,
    top: 8,
  },
  orbitSmall: {
    width: 90,
    height: 90,
    right: 5,
    bottom: 2,
    backgroundColor: Colors.bgCardAlt,
  },
  iconShell: {
    width: 82,
    height: 82,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headline: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  supportingCopy: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 330,
  },
  startButton: {
    width: '100%',
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
  },
  startButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  startButtonText: {
    color: Colors.bg,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
});
