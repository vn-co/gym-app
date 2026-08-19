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
  FontFamily,
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
  isCurrent: boolean;
  onUpdate: (updates: Partial<SetEntry>) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetRow({
  set,
  index,
  isCurrent,
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

  const inputStyle = [
    styles.input,
    isCurrent && styles.inputCurrent,
    set.completed && styles.inputComplete,
  ];

  return (
    <View
      style={[
        styles.row,
        isCurrent && styles.rowCurrent,
        set.completed && styles.rowComplete,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.rowTint, { opacity: rowTint }]}
      />

      <Text style={[styles.setNum, isCurrent && styles.setNumCurrent]}>
        {index + 1}
      </Text>

      <TextInput
        style={inputStyle}
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
        style={inputStyle}
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
          <AppIcon name="check" size={18} color={Colors.bg} strokeWidth={2.4} />
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
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    overflow: 'hidden',
  },
  rowCurrent: {
    borderBottomColor: Colors.accentBorder,
  },
  rowComplete: {
    opacity: 0.78,
  },
  rowTint: {
    position: 'absolute',
    top: 4,
    right: 0,
    bottom: 4,
    left: 0,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentBg,
  },
  setNum: {
    width: 32,
    color: Colors.textMuted,
    fontFamily: FontFamily.data,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  setNumCurrent: {
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  input: {
    flex: 1,
    height: 44,
    color: Colors.textPrimary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    paddingVertical: 0,
    marginHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputCurrent: {
    backgroundColor: Colors.bgInput,
    borderColor: Colors.accentBorder,
  },
  inputComplete: {
    color: Colors.textSecondary,
    backgroundColor: Colors.bgElevated,
    borderColor: 'transparent',
  },
  checkbox: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  checkboxDone: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  removeButton: {
    width: 34,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: Colors.textMuted,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.regular,
  },
  removeButtonTextDisabled: {
    opacity: 0.25,
  },
});
