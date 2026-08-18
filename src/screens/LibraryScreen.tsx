import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/tokens';
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '../constants/exercises';
import { getCustomExercises, saveCustomExercise, deleteCustomExercise } from '../services/storage';
import { generateId } from '../utils';
import type { Exercise, MuscleGroup } from '../types';

interface SectionData {
  title: string;
  isCustomSection?: boolean;
  data: Exercise[];
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'glutes', 'core', 'calves', 'forearms', 'full_body',
];

const MUSCLE_EMOJIS: Record<string, string> = {
  chest: '💪', back: '🏋️', shoulders: '🦺', biceps: '💪',
  triceps: '💪', legs: '🦵', glutes: '🍑', core: '🎯',
  calves: '🦵', forearms: '💪', full_body: '⚡',
};

const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Bands', 'Other',
];

export function LibraryScreen() {
  const [query, setQuery] = useState('');
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);

  // Create exercise modal state
  const [createVisible, setCreateVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup>('chest');
  const [newEquipment, setNewEquipment] = useState('Barbell');

  const loadCustom = useCallback(async () => {
    try {
      const custom = await getCustomExercises();
      setCustomExercises(custom);
    } catch {
      Alert.alert(
        'Couldn’t load saved data',
        'Your existing data was not changed. Try again.',
      );
    }
  }, []);

  useFocusEffect(useCallback(() => { loadCustom(); }, [loadCustom]));

  const allExercises = useMemo(
    () => [...customExercises, ...EXERCISE_LIBRARY],
    [customExercises],
  );

  const sections = useMemo<SectionData[]>(() => {
    const filtered = allExercises.filter((e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(query.toLowerCase()),
    );

    const grouped: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      if (!grouped[ex.muscleGroup]) grouped[ex.muscleGroup] = [];
      grouped[ex.muscleGroup].push(ex);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, exercises]) => ({
        title: MUSCLE_GROUP_LABELS[group] ?? group,
        data: exercises,
      }));
  }, [allExercises, query]);

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
      setCreateVisible(false);
      setNewName('');
      setNewGroup('chest');
      setNewEquipment('Barbell');
      await loadCustom();
    } catch {
      Alert.alert(
        'Couldn’t save exercise',
        'The exercise is still open so you can try again.',
      );
    }
  };

  const handleDeleteCustom = (ex: Exercise) => {
    Alert.alert(
      `Delete "${ex.name}"?`,
      'This removes it from your custom exercises.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomExercise(ex.id);
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

  const isCustom = (ex: Exercise) => ex.id.startsWith('custom_');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.subtitle}>{allExercises.length} exercises</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateVisible(true)}>
          <Text style={styles.addBtnText}>+ Custom</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises..."
          placeholderTextColor={Colors.textMuted}
          clearButtonMode="while-editing"
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const custom = isCustom(item);
          return (
            <View style={[styles.exerciseRow, custom && styles.exerciseRowCustom]}>
              <View style={styles.exerciseLeft}>
                <Text style={styles.exerciseEmoji}>
                  {MUSCLE_EMOJIS[item.muscleGroup] ?? '💪'}
                </Text>
                <View style={styles.exerciseInfo}>
                  <View style={styles.exerciseNameRow}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    {custom && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>CUSTOM</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.exerciseMeta}>{item.equipment}</Text>
                </View>
              </View>
              <View style={styles.exerciseRight}>
                <View style={styles.muscleTag}>
                  <Text style={styles.muscleTagText}>
                    {MUSCLE_GROUP_LABELS[item.muscleGroup]}
                  </Text>
                </View>
                {custom && (
                  <TouchableOpacity
                    onPress={() => handleDeleteCustom(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderSectionFooter={() => <View style={{ height: Spacing.md }} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Custom Exercise Modal */}
      <Modal visible={createVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setCreateVisible(false); setNewName(''); }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Exercise</Text>
              <TouchableOpacity onPress={handleCreateExercise}>
                <Text style={styles.modalSave}>Add</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Name */}
              <Text style={styles.fieldLabel}>EXERCISE NAME</Text>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Bulgarian Split Squat"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                maxLength={60}
              />

              {/* Muscle Group */}
              <Text style={styles.fieldLabel}>MUSCLE GROUP</Text>
              <View style={styles.optionGrid}>
                {MUSCLE_GROUPS.map((group) => (
                  <TouchableOpacity
                    key={group}
                    style={[styles.optionChip, newGroup === group && styles.optionChipActive]}
                    onPress={() => setNewGroup(group)}
                  >
                    <Text style={styles.optionChipEmoji}>{MUSCLE_EMOJIS[group]}</Text>
                    <Text style={[styles.optionChipText, newGroup === group && styles.optionChipTextActive]}>
                      {MUSCLE_GROUP_LABELS[group]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Equipment */}
              <Text style={styles.fieldLabel}>EQUIPMENT</Text>
              <View style={styles.optionRow}>
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <TouchableOpacity
                    key={eq}
                    style={[styles.eqChip, newEquipment === eq && styles.eqChipActive]}
                    onPress={() => setNewEquipment(eq)}
                  >
                    <Text style={[styles.eqChipText, newEquipment === eq && styles.eqChipTextActive]}>
                      {eq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview */}
              {newName.trim().length > 0 && (
                <View style={styles.preview}>
                  <Text style={styles.previewLabel}>PREVIEW</Text>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewEmoji}>{MUSCLE_EMOJIS[newGroup]}</Text>
                    <View>
                      <Text style={styles.previewName}>{newName.trim()}</Text>
                      <Text style={styles.previewMeta}>
                        {MUSCLE_GROUP_LABELS[newGroup]} · {newEquipment}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    backgroundColor: Colors.accentBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  addBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.accent },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: FontSize.md, marginRight: Spacing.sm },
  search: { flex: 1, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  exerciseRowCustom: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent,
  },
  exerciseLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  exerciseEmoji: { fontSize: FontSize.xl, width: 32, textAlign: 'center' },
  exerciseInfo: { flex: 1 },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  exerciseName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  customBadge: {
    backgroundColor: Colors.accentBg,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  customBadgeText: { fontSize: 9, color: Colors.accent, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  exerciseMeta: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  exerciseRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  muscleTag: {
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  muscleTagText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: FontSize.sm, color: Colors.danger },
  sep: { height: 1, backgroundColor: Colors.border },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalCancel: { fontSize: FontSize.md, color: Colors.textMuted },
  modalSave: { fontSize: FontSize.md, color: Colors.accent, fontWeight: FontWeight.bold },
  modalBody: { padding: Spacing.lg, paddingBottom: 60 },

  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  nameInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    fontWeight: FontWeight.semibold,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionChipActive: { backgroundColor: Colors.accentBg, borderColor: Colors.accent },
  optionChipEmoji: { fontSize: 14 },
  optionChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  optionChipTextActive: { color: Colors.accent, fontWeight: FontWeight.bold },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  eqChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eqChipActive: { backgroundColor: Colors.accentBg, borderColor: Colors.accent },
  eqChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  eqChipTextActive: { color: Colors.accent, fontWeight: FontWeight.bold },

  preview: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  previewEmoji: { fontSize: 28 },
  previewName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  previewMeta: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
});
