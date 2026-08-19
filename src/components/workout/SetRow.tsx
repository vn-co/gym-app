import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Colors,
  FontSize,
  FontWeight,
  MotionDuration,
  Radius,
  Spacing,
} from '../../constants/tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { SetEntry } from '../../types';
import { parseNumericInput } from '../../utils';
import { getMotionDuration } from '../../utils/uiPresentation';
import { AppIcon } from '../icons/AppIcon';

interface Props {
  set: SetEntry;
  index: number;
  onUpdate: (updates: Partial<SetEntry>) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetRow({
  set,
  index,
  onUpdate,
  onToggleComplete,
  onRemove,
  canRemove,
}: Props) {
  const reduceMotion = useReducedMotion();
  const rowTint = useRef(new Animated.Value(set.completed ? 1 : 0)).current;
  const checkScale = useRef(new Animated.Value(set.completed ? 1 : 0)).current;

  useEffect(() => {
    const duration = getMotionDuration(reduceMotion, MotionDuration.fast);

    Animated.timing(rowTint, {
      toValue: set.completed ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();

    if (reduceMotion) {
      checkScale.setValue(set.completed ? 1 : 0);
    } else if (set.completed) {
      Animated.spring(checkScale, {
        toValue: 1,
        speed: 28,
        bounciness: 5,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(checkScale, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start();
    }
  }, [checkScale, reduceMotion, rowTint, set.completed]);

  return (
    <View style={styles.row}>
      <Animated.View
        pointerEvents="none"
        style={[styles.rowTint, { opacity: rowTint }]}
      />

      <Text style={[styles.setNum, set.completed && styles.setNumActive]}>
        {index + 1}
      </Text>

      <TextInput
        style={styles.input}
        accessibilityLabel={`Weight for set ${index + 1} in kilograms`}
        value={set.weight === 0 ? '' : String(set.weight)}
        onChangeText={(text) =>
          onUpdate({ weight: parseNumericInput(text) })
        }
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={Colors.textMuted}
        selectTextOnFocus
        returnKeyType="next"
      />

      <TextInput
        style={styles.input}
        accessibilityLabel={`Repetitions for set ${index + 1}`}
        value={set.reps === 0 ? '' : String(set.reps)}
        onChangeText={(text) =>
          onUpdate({ reps: parseNumericInput(text, true) })
        }
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={Colors.textMuted}
        selectTextOnFocus
        returnKeyType="done"
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: set.completed }}
        accessibilityLabel={`Complete set ${index + 1}`}
        style={[styles.checkbox, set.completed && styles.checkboxDone]}
        onPress={onToggleComplete}
      >
        <Animated.View
          style={{
            opacity: checkScale,
            transform: [{ scale: checkScale }],
          }}
        >
          <AppIcon name="check" size={19} color={Colors.bg} strokeWidth={2.4} />
        </Animated.View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete set ${index + 1}`}
        accessibilityState={{ disabled: !canRemove }}
        disabled={!canRemove}
        hitSlop={4}
        style={styles.removeButton}
        onPress={onRemove}
      >
        <Text
          style={[
            styles.removeButtonText,
            !canRemove && styles.removeButtonTextDisabled,
          ]}
        >
          −
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
    overflow: 'hidden',
  },
  rowTint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.accentBg,
    borderRadius: Radius.md,
  },
  setNum: {
    width: 32,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  setNumActive: {
    color: Colors.accent,
  },
  input: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    paddingVertical: 0,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.xs,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkbox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxDone: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  removeButton: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: Colors.danger,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.medium,
  },
  removeButtonTextDisabled: { color: Colors.textMuted },
});
