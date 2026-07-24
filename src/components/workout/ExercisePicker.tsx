import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/tokens';
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '../../constants/exercises';
import type { Exercise } from '../../types';

interface Props {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ visible, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const groups = useMemo(() => {
    return Array.from(new Set(EXERCISE_LIBRARY.map((e) => e.muscleGroup)));
  }, []);

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((e) => {
      const matchQuery = e.name.toLowerCase().includes(query.toLowerCase());
      const matchGroup = !selectedGroup || e.muscleGroup === selectedGroup;
      return matchQuery && matchGroup;
    });
  }, [query, selectedGroup]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Exercise</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
            autoFocus
          />
        </View>

        {/* Muscle group filter chips */}
        <FlatList
          data={[null, ...groups]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item ?? 'all'}
          style={styles.chips}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedGroup === item && styles.chipActive]}
              onPress={() => setSelectedGroup(item)}
            >
              <Text style={[styles.chipText, selectedGroup === item && styles.chipTextActive]}>
                {item ? MUSCLE_GROUP_LABELS[item] : 'All'}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Exercise list */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.exerciseRow}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <View>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {MUSCLE_GROUP_LABELS[item.muscleGroup]} · {item.equipment}
                </Text>
              </View>
              <Text style={styles.plus}>+</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  close: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
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
  chips: {
    maxHeight: 44,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: {
    color: '#000',
    fontWeight: FontWeight.bold,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  exerciseName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  plus: {
    fontSize: FontSize.xl,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
