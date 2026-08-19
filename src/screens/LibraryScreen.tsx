import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '../constants/tokens';
import {
  mergeExerciseLibrary,
  MUSCLE_GROUP_LABELS,
} from '../constants/exercises';
import {
  deleteCustomExercise,
  getCustomExercises,
  saveCustomExercise,
} from '../services/storage';
import { generateId } from '../utils';
import { AmbientBackdrop } from '../components/ui/AmbientBackdrop';
import type { Exercise, MuscleGroup } from '../types';

interface SectionData {
  title: string;
  data: Exercise[];
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'core',
  'calves',
  'forearms',
  'full_body',
];

const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Bodyweight',
  'Kettlebell',
  'Bands',
  'Other',
];

function groupCode(group: MuscleGroup): string {
  return MUSCLE_GROUP_LABELS[group].replace(/\s/g, '').slice(0, 3).toUpperCase();
}

export function LibraryScreen() {
  const [query, setQuery] = useState('');
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [createVisible, setCreateVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup>('chest');
  const [newEquipment, setNewEquipment] = useState('Barbell');

  const loadCustom = useCallback(async () => {
    try {
      setCustomExercises(await getCustomExercises());
    } catch {
      Alert.alert(
        'Couldn’t load saved data',
        'Your existing data was not changed. Try again.',
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCustom();
    }, [loadCustom]),
  );

  const allExercises = useMemo(
    () => mergeExerciseLibrary(customExercises),
    [customExercises],
  );

  const sections = useMemo<SectionData[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = allExercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(normalizedQuery) ||
        exercise.muscleGroup.toLowerCase().includes(normalizedQuery) ||
        exercise.equipment.toLowerCase().includes(normalizedQuery),
    );

    const grouped: Record<string, Exercise[]> = {};
    for (const exercise of filtered) {
      if (!grouped[exercise.muscleGroup]) grouped[exercise.muscleGroup] = [];
      grouped[exercise.muscleGroup].push(exercise);
    }

    return Object.entries(grouped)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([group, exercises]) => ({
        title: MUSCLE_GROUP_LABELS[group] ?? group,
        data: exercises,
      }));
  }, [allExercises, query]);

  const closeCreate = () => {
    setCreateVisible(false);
    setNewName('');
    setNewGroup('chest');
    setNewEquipment('Barbell');
  };

  const handleCreateExercise = async () => {
    if (!newName.trim()) {
      Alert.alert('Name required', 'Enter a name for the exercise.');
      return;
    }

    const exercise: Exercise = {
      id: `custom_${generateId()}`,
      name: newName.trim(),
      muscleGroup: newGroup,
      equipment: newEquipment,
    };

    try {
      await saveCustomExercise(exercise);
      closeCreate();
      await loadCustom();
    } catch {
      Alert.alert(
        'Couldn’t save exercise',
        'The exercise is still open so you can try again.',
      );
    }
  };

  const handleDeleteCustom = (exercise: Exercise) => {
    Alert.alert(
      `Delete "${exercise.name}"?`,
      'This removes it from your custom exercises.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomExercise(exercise.id);
              await loadCustom();
            } catch {
              Alert.alert(
                'Couldn’t delete exercise',
                'Your saved exercise was not changed. Try again.',
              );
            }
          },
        },
      ],
    );
  };

  const isCustom = (exercise: Exercise) =>
    exercise.id.startsWith('custom_');

  return (
    <SafeAreaView style={styles.safe}>
      <AmbientBackdrop intensity="quiet" />
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>EXERCISE LIBRARY</Text>
          <Text style={styles.title}>Movement index</Text>
          <Text style={styles.subtitle}>{allExercises.length} movements</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create custom exercise"
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          onPress={() => setCreateVisible(true)}
        >
          <Text style={styles.addButtonMark}>+</Text>
          <Text style={styles.addButtonText}>Custom</Text>
        </Pressable>
      </View>

      <View style={styles.searchBlock}>
        <Text style={styles.searchLabel}>SEARCH</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Exercise, muscle, or equipment"
          placeholderTextColor={Colors.textMuted}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item, index }) => {
          const custom = isCustom(item);
          return (
            <View style={styles.exerciseRow}>
              <View
                style={[
                  styles.exerciseCode,
                  custom && styles.exerciseCodeCustom,
                ]}
              >
                <Text
                  style={[
                    styles.exerciseCodeText,
                    custom && styles.exerciseCodeTextCustom,
                  ]}
                >
                  {custom ? 'CST' : groupCode(item.muscleGroup)}
                </Text>
              </View>
              <View style={styles.exerciseInfo}>
                <View style={styles.exerciseNameRow}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  {custom ? <Text style={styles.customLabel}>CUSTOM</Text> : null}
                </View>
                <Text style={styles.exerciseMeta}>
                  {item.equipment} · {MUSCLE_GROUP_LABELS[item.muscleGroup]}
                </Text>
              </View>
              {custom ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.name}`}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleDeleteCustom(item)}
                >
                  <Text style={styles.deleteText}>Remove</Text>
                </Pressable>
              ) : (
                <Text style={styles.exerciseNumber}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              )}
            </View>
          );
        }}
        renderSectionFooter={() => <View style={styles.sectionGap} />}
        ListEmptyComponent={
          <View style={styles.emptySearch}>
            <Text style={styles.emptySearchCode}>—</Text>
            <Text style={styles.emptySearchTitle}>No matching movement</Text>
            <Text style={styles.emptySearchText}>
              Try a different exercise, muscle group, or equipment name.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={createVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalSafe}>
          <AmbientBackdrop intensity="quiet" />
          <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={closeCreate}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>New exercise</Text>
              <Pressable onPress={handleCreateExercise}>
                <Text style={styles.modalSave}>Add</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.fieldLabel}>EXERCISE NAME</Text>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Bulgarian split squat"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                maxLength={60}
              />

              <Text style={styles.fieldLabel}>MUSCLE GROUP</Text>
              <View style={styles.optionGrid}>
                {MUSCLE_GROUPS.map((group) => {
                  const selected = newGroup === group;
                  return (
                    <Pressable
                      key={group}
                      style={[
                        styles.optionChip,
                        selected && styles.optionChipActive,
                      ]}
                      onPress={() => setNewGroup(group)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selected && styles.optionChipTextActive,
                        ]}
                      >
                        {MUSCLE_GROUP_LABELS[group]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>EQUIPMENT</Text>
              <View style={styles.optionGrid}>
                {EQUIPMENT_OPTIONS.map((equipment) => {
                  const selected = newEquipment === equipment;
                  return (
                    <Pressable
                      key={equipment}
                      style={[
                        styles.optionChip,
                        selected && styles.optionChipActive,
                      ]}
                      onPress={() => setNewEquipment(equipment)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selected && styles.optionChipTextActive,
                        ]}
                      >
                        {equipment}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {newName.trim() ? (
                <View style={styles.preview}>
                  <View style={styles.previewCode}>
                    <Text style={styles.previewCodeText}>CST</Text>
                  </View>
                  <View style={styles.previewCopy}>
                    <Text style={styles.previewLabel}>PREVIEW</Text>
                    <Text style={styles.previewName}>{newName.trim()}</Text>
                    <Text style={styles.previewMeta}>
                      {MUSCLE_GROUP_LABELS[newGroup]} · {newEquipment}
                    </Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  heading: { flex: 1, paddingRight: Spacing.lg },
  eyebrow: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.1,
    marginBottom: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: 36,
    letterSpacing: -1,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  addButton: {
    minWidth: 98,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
  },
  addButtonMark: {
    color: Colors.bg,
    fontFamily: FontFamily.data,
    fontSize: FontSize.lg,
  },
  addButtonText: {
    color: Colors.bg,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  searchBlock: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  searchLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  searchInput: {
    minHeight: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 112,
  },
  sectionHeader: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderStrong,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.lg,
  },
  sectionCount: {
    color: Colors.textMuted,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
  },
  exerciseRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseCode: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.md,
  },
  exerciseCodeCustom: {
    backgroundColor: Colors.accentBg,
    borderColor: Colors.accentBorder,
  },
  exerciseCodeText: {
    color: Colors.textMuted,
    fontFamily: FontFamily.data,
    fontSize: 8,
    fontWeight: FontWeight.semibold,
  },
  exerciseCodeTextCustom: { color: Colors.accent },
  exerciseInfo: { flex: 1, paddingRight: Spacing.sm },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  exerciseName: {
    flexShrink: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  customLabel: {
    color: Colors.accent,
    fontSize: 8,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  exerciseMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  exerciseNumber: {
    color: Colors.textMuted,
    fontFamily: FontFamily.data,
    fontSize: 9,
  },
  deleteButton: { minHeight: 44, justifyContent: 'center' },
  deleteText: { color: Colors.danger, fontSize: FontSize.xs },
  sectionGap: { height: Spacing.md },
  emptySearch: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.xl,
  },
  emptySearchCode: {
    color: Colors.accent,
    fontFamily: FontFamily.data,
    fontSize: FontSize.lg,
  },
  emptySearchTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    marginTop: Spacing.md,
  },
  emptySearchText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  modalSafe: { flex: 1, backgroundColor: Colors.bg },
  keyboard: { flex: 1 },
  modalHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  modalCancel: { color: Colors.textMuted, fontSize: FontSize.md },
  modalTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
  },
  modalSave: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  modalBody: { padding: Spacing.lg, paddingBottom: 60 },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  nameInput: {
    minHeight: 58,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    paddingHorizontal: Spacing.md,
  },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionChip: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  optionChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  optionChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  optionChipTextActive: { color: Colors.bg, fontWeight: FontWeight.bold },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    padding: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  previewCode: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    marginRight: Spacing.md,
  },
  previewCodeText: {
    color: Colors.accent,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  previewCopy: { flex: 1 },
  previewLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.7,
  },
  previewName: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.lg,
    marginTop: 3,
  },
  previewMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 3,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
