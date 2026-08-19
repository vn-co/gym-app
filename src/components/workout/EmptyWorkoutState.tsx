import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
  TabBarMetrics,
} from '../../constants/tokens';
import { AppIcon } from '../icons/AppIcon';
import { AmbientBackdrop } from '../ui/AmbientBackdrop';

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
      <AmbientBackdrop intensity="hero" />

      <View style={styles.header}>
        <Text style={styles.headerLabel}>TRAINING</Text>
        <Text style={styles.screenTitle}>Workout</Text>
      </View>

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
              size={54}
              color={Colors.accent}
              strokeWidth={1.45}
            />
          </View>
          <View style={styles.signalDot} />
        </View>

        <Text style={styles.eyebrow}>READY FOR THE NEXT SET</Text>
        <Text style={styles.headline}>Ready when you are.</Text>
        <Text style={styles.supportingCopy}>
          Start an empty session, or open a saved routine and keep every set,
          weight, and record in one place.
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
        <View style={styles.startCopy}>
          <Text style={styles.startButtonText}>Start workout</Text>
          <Text style={styles.startButtonDetail}>Name it, then add exercises</Text>
        </View>
        <View style={styles.startIcon}>
          <AppIcon name="play" size={18} color={Colors.bg} strokeWidth={2.2} />
        </View>
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
  header: {
    position: 'relative',
    zIndex: 1,
  },
  headerLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.display,
    lineHeight: 54,
    letterSpacing: -1.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  illustration: {
    width: 184,
    height: 166,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  orbit: {
    position: 'absolute',
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  orbitLarge: {
    width: 142,
    height: 142,
    left: 4,
    top: 2,
    borderColor: Colors.accentBorder,
    backgroundColor: '#A5FF0108',
  },
  orbitSmall: {
    width: 104,
    height: 104,
    right: 1,
    bottom: 0,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.bgCard,
  },
  iconShell: {
    width: 94,
    height: 94,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  signalDot: {
    position: 'absolute',
    right: 25,
    top: 29,
    width: 11,
    height: 11,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    borderWidth: 3,
    borderColor: Colors.bg,
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.15,
    marginBottom: Spacing.sm,
  },
  headline: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xxxl,
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  supportingCopy: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 330,
  },
  startButton: {
    width: '100%',
    minHeight: 64,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.lg,
    paddingRight: 6,
    backgroundColor: Colors.accent,
  },
  startButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  startCopy: {
    flex: 1,
  },
  startButtonText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  startButtonDetail: {
    color: '#152000B8',
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  startIcon: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000018',
  },
});
