import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { NavigationIconName } from '../../constants/navigation';
import { Colors, MotionDuration, Radius } from '../../constants/tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionDuration } from '../../utils/uiPresentation';
import { AppIcon } from '../icons/AppIcon';

interface AnimatedTabIconProps {
  icon: NavigationIconName;
  focused: boolean;
  showBadge?: boolean;
}

export function AnimatedTabIcon({
  icon,
  focused,
  showBadge = false,
}: AnimatedTabIconProps) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: getMotionDuration(reduceMotion, MotionDuration.fast),
      useNativeDriver: true,
    }).start();
  }, [focused, progress, reduceMotion]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  return (
    <Animated.View
      style={[
        styles.iconShell,
        focused && styles.iconShellFocused,
        { transform: [{ scale }] },
      ]}
    >
      <AppIcon
        name={icon}
        size={21}
        color={focused ? Colors.accent : Colors.textMuted}
        strokeWidth={focused ? 2 : 1.7}
      />
      {showBadge ? <View style={styles.badge} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconShell: {
    width: 36,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShellFocused: {
    backgroundColor: Colors.accentBg,
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.bgCard,
  },
});
