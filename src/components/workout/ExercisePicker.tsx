import { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '../../constants/tokens';
import { MUSCLE_GROUP_LABELS } from '../../constants/exercises';
import type { Exercise } from '../../types';
import { AppIcon } from '../icons/AppIcon';

interface Props {
  visible: boolean;
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({
  visible,
  exercises,
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const groups = useMemo(() => {
    return Array.from(new Set(exercises.map((e) => e.muscleGroup)));
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchQuery = e.name.toLowerCase().includes(query.toLowerCase());
      const matchGroup = !selectedGroup || e.muscleGroup === selectedGroup;
      return matchQuery && matchGroup;
    });
  }, [exercises, query, selectedGroup]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add exercise</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close exercise picker"
            onPress={onClose}
            style={({ pressed }) => [
              styles.doneButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.search}
            accessibilityLabel="Search exercises"
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
            autoFocus
          />
        </View>

        <FlatList
          data={[null, ...groups]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item ?? 'all'}
          style={styles.chips}
          contentContainerStyle={styles.chipContent}
          renderItem={({ item }) => {
            const label = item ? MUSCLE_GROUP_LABELS[item] : 'All';
            const selected = selectedGroup === item;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${label}`}
                accessibilityState={{ selected }}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => setSelectedGroup(item)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          }}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.exerciseList}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name}`}
              style={({ pressed }) => [
                styles.exerciseRow,
                pressed && styles.exerciseRowPressed,
              ]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <View style={styles.exerciseCopy}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.exerciseMeta} numberOfLines={1}>
                  {MUSCLE_GROUP_LABELS[item.muscleGroup]} · {item.equipment}
                </Text>
              </View>
              <View style={styles.addIcon}>
                <AppIcon name="add" size={20} color={Colors.accent} />
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.emptyResults}>
              <Text style={styles.emptyResultsText}>
                No exercises match your search.
              </Text>
            </View>
          }
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
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  doneButton: {
    minWidth: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
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
    paddingVertical: 0,
    height: 48,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chips: {
    maxHeight: 48,
    marginBottom: Spacing.md,
  },
  chipContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.accentBg,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: {
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  exerciseList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
    flexGrow: 1,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 64,
    borderRadius: Radius.md,
  },
  exerciseRowPressed: {
    backgroundColor: Colors.bgCard,
  },
  exerciseCopy: {
    flex: 1,
    paddingRight: Spacing.md,
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
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentBg,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.border,
  },
  emptyResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyResultsText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
});
