import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '../../constants/tokens';
import { MUSCLE_GROUP_LABELS } from '../../constants/exercises';
import { generateId, moveItem, parseNumericInput } from '../../utils';
import { AmbientBackdrop } from '../ui/AmbientBackdrop';
import type {
  Routine,
  RoutineExercise,
  Exercise,
} from '../../types';

interface Props {
  visible: boolean;
  initial?: Routine | null;
  allExercises: Exercise[]; // static + custom merged
  onSave: (routine: Routine) => void;
  onClose: () => void;
}

export function RoutineBuilder({
  visible,
  initial,
  allExercises,
  onSave,
  onClose,
}: Props) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerGroup, setPickerGroup] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      if (initial) {
        setName(initial.name);
        setExercises(initial.exercises);
      } else {
        setName('');
        setExercises([]);
      }
    }
  }, [visible, initial]);

  const muscleGroups = useMemo(
    () => Array.from(new Set(allExercises.map((e) => e.muscleGroup))),
    [allExercises],
  );

  const filteredExercises = useMemo(() => {
    return allExercises.filter((e) => {
      const matchQ = e.name.toLowerCase().includes(pickerQuery.toLowerCase());
      const matchG = !pickerGroup || e.muscleGroup === pickerGroup;
      return matchQ && matchG;
    });
  }, [allExercises, pickerQuery, pickerGroup]);

  const addExercise = (ex: Exercise) => {
    // Don't add duplicates
    if (exercises.find((e) => e.exerciseId === ex.id)) {
      Alert.alert('Already added', `${ex.name} is already in this routine.`);
      return;
    }
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        defaultSets: 3,
        defaultReps: 10,
        defaultWeight: 0,
      },
    ]);
    setShowPicker(false);
    setPickerQuery('');
    setPickerGroup(null);
  };

  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.exerciseId !== id));
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    setExercises((prev) => moveItem(prev, fromIndex, toIndex));
  };

  const updateExercise = (
    id: string,
    field: keyof RoutineExercise,
    value: number,
  ) => {
    setExercises((prev) =>
      prev.map((e) => (e.exerciseId === id ? { ...e, [field]: value } : e)),
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your routine a name.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise.');
      return;
    }
    const routine: Routine = {
      id: initial?.id ?? generateId(),
      name: name.trim(),
      emoji: initial?.emoji ?? 'routine',
      exercises,
      createdAt: initial?.createdAt ?? Date.now(),
      lastUsedAt: initial?.lastUsedAt,
    };
    onSave(routine);
  };

  // ── Exercise picker sub-modal ────────────────────────────────────────────
  if (showPicker) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.safe}>
          <AmbientBackdrop intensity="quiet" />
          <View style={styles.pickerHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowPicker(false);
                setPickerQuery('');
                setPickerGroup(null);
              }}
            >
              <Text style={styles.pickerBack}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Add Exercise</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              style={styles.search}
              value={pickerQuery}
              onChangeText={setPickerQuery}
              placeholder="Search..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
          </View>

          {/* Group chips */}
          <FlatList
            data={[null, ...muscleGroups]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item ?? 'all'}
            style={styles.chips}
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              gap: Spacing.sm,
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chip, pickerGroup === item && styles.chipActive]}
                onPress={() => setPickerGroup(item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    pickerGroup === item && styles.chipTextActive,
                  ]}
                >
                  {item ? MUSCLE_GROUP_LABELS[item] : 'All'}
                </Text>
              </TouchableOpacity>
            )}
          />

          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              paddingBottom: 40,
            }}
            renderItem={({ item }) => {
              const alreadyAdded = !!exercises.find(
                (e) => e.exerciseId === item.id,
              );
              return (
                <TouchableOpacity
                  style={[styles.pickRow, alreadyAdded && styles.pickRowAdded]}
                  onPress={() => !alreadyAdded && addExercise(item)}
                  disabled={alreadyAdded}
                >
                  <View>
                    <Text style={styles.pickName}>{item.name}</Text>
                    <Text style={styles.pickMeta}>
                      {MUSCLE_GROUP_LABELS[item.muscleGroup]} · {item.equipment}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.pickPlus,
                      alreadyAdded && { color: Colors.textMuted },
                    ]}
                  >
                    {alreadyAdded ? '✓' : '+'}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </SafeAreaView>
      </Modal>
    );
  }

  // ── Main builder ────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.safe}>
        <AmbientBackdrop intensity="quiet" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {initial ? 'Edit Routine' : 'New Routine'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveBtn}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Routine name (e.g. Push Day)"
              placeholderTextColor={Colors.textMuted}
              maxLength={40}
            />

            {/* Exercises */}
            <Text style={styles.sectionLabel}>EXERCISES</Text>

            {exercises.map((ex, idx) => (
              <View key={ex.exerciseId} style={styles.exRow}>
                <View style={styles.exTop}>
                  <View style={styles.exIdx}>
                    <Text style={styles.exIdxText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.exName}>{ex.exerciseName}</Text>
                  <View style={styles.exOrderControls}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Move ${ex.exerciseName} up`}
                      accessibilityState={{ disabled: idx === 0 }}
                      style={styles.exOrderBtn}
                      onPress={() => moveExercise(idx, idx - 1)}
                      disabled={idx === 0}
                    >
                      <Text
                        style={[
                          styles.exOrderText,
                          idx === 0 && styles.exOrderTextDisabled,
                        ]}
                      >
                        ↑
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Move ${ex.exerciseName} down`}
                      accessibilityState={{
                        disabled: idx === exercises.length - 1,
                      }}
                      style={styles.exOrderBtn}
                      onPress={() => moveExercise(idx, idx + 1)}
                      disabled={idx === exercises.length - 1}
                    >
                      <Text
                        style={[
                          styles.exOrderText,
                          idx === exercises.length - 1 &&
                            styles.exOrderTextDisabled,
                        ]}
                      >
                        ↓
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${ex.exerciseName}`}
                    onPress={() => removeExercise(ex.exerciseId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.exRemove}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Default sets / reps / weight */}
                <View style={styles.exDefaults}>
                  <View style={styles.exDefaultItem}>
                    <Text style={styles.exDefaultLabel}>SETS</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          updateExercise(
                            ex.exerciseId,
                            'defaultSets',
                            Math.max(1, ex.defaultSets - 1),
                          )
                        }
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{ex.defaultSets}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          updateExercise(
                            ex.exerciseId,
                            'defaultSets',
                            Math.min(10, ex.defaultSets + 1),
                          )
                        }
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.exDefaultItem}>
                    <Text style={styles.exDefaultLabel}>REPS</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          updateExercise(
                            ex.exerciseId,
                            'defaultReps',
                            Math.max(1, ex.defaultReps - 1),
                          )
                        }
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{ex.defaultReps}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          updateExercise(
                            ex.exerciseId,
                            'defaultReps',
                            Math.min(50, ex.defaultReps + 1),
                          )
                        }
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.exDefaultItem}>
                    <Text style={styles.exDefaultLabel}>KG</Text>
                    <TextInput
                      style={styles.weightInput}
                      value={
                        ex.defaultWeight === 0 ? '' : String(ex.defaultWeight)
                      }
                      onChangeText={(text) =>
                        updateExercise(
                          ex.exerciseId,
                          'defaultWeight',
                          parseNumericInput(text),
                        )
                      }
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      selectTextOnFocus
                    />
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addExBtn}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.addExBtnText}>+ Add Exercise</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
  },
  cancelBtn: { fontSize: FontSize.md, color: Colors.textMuted },
  saveBtn: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },

  body: { padding: Spacing.lg, paddingBottom: 60 },

  nameInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    marginBottom: Spacing.xl,
  },

  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },

  exRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  exTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  exIdx: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exIdxText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  exName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  exOrderControls: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  exOrderBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exOrderText: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  exOrderTextDisabled: { color: Colors.textMuted },
  exRemove: { fontSize: FontSize.md, color: Colors.danger },

  exDefaults: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  exDefaultItem: { flex: 1, alignItems: 'center' },
  exDefaultLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepBtnText: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  stepValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  weightInput: {
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    width: 64,
    fontVariant: ['tabular-nums'],
  },

  addExBtn: {
    marginTop: Spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  addExBtnText: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },

  // Picker styles
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerBack: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: FontWeight.medium,
  },
  pickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  searchWrap: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  search: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chips: { maxHeight: 44, marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: { color: '#000', fontWeight: FontWeight.bold },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  pickRowAdded: { opacity: 0.4 },
  pickName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  pickMeta: { fontSize: FontSize.sm, color: Colors.textMuted },
  pickPlus: {
    fontSize: FontSize.xl,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  sep: { height: 1, backgroundColor: Colors.border },
});
