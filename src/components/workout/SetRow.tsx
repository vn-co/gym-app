import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/tokens';
import type { SetEntry } from '../../types';
import { parseNumericInput } from '../../utils';

interface Props {
  set: SetEntry;
  index: number;
  onUpdate: (updates: Partial<SetEntry>) => void;
  onToggleComplete: () => void;
}

export function SetRow({ set, index, onUpdate, onToggleComplete }: Props) {
  return (
    <View style={[styles.row, set.completed && styles.rowCompleted]}>
      {/* Set number */}
      <Text style={[styles.setNum, set.completed && styles.setNumActive]}>
        {index + 1}
      </Text>

      {/* Weight input */}
      <TextInput
        style={styles.input}
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

      {/* Reps input */}
      <TextInput
        style={styles.input}
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

      {/* Completion checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, set.completed && styles.checkboxDone]}
        onPress={onToggleComplete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {set.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
  },
  rowCompleted: {
    backgroundColor: Colors.accentBg,
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
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.sm,
    marginHorizontal: Spacing.xs,
    height: 40,
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgInput,
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
  checkmark: {
    color: '#000',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
