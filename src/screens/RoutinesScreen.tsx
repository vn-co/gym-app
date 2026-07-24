import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/tokens';
import { getRoutines, saveRoutine, deleteRoutine, touchRoutineLastUsed, getCustomExercises } from '../services/storage';
import { EXERCISE_LIBRARY } from '../constants/exercises';
import { useWorkoutStore } from '../store/workoutStore';
import { RoutineCard } from '../components/routines/RoutineCard';
import { RoutineBuilder } from '../components/routines/RoutineBuilder';
import type { Routine, Exercise } from '../types';

export function RoutinesScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>(EXERCISE_LIBRARY);
  const [builderVisible, setBuilderVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const startSessionFromRoutine = useWorkoutStore((s) => s.startSessionFromRoutine);
  const activeSession = useWorkoutStore((s) => s.session);

  const load = useCallback(async () => {
    const [r, custom] = await Promise.all([getRoutines(), getCustomExercises()]);
    setRoutines(r);
    // Merge static + custom, custom first so they show up at top of picker
    setAllExercises([...custom, ...EXERCISE_LIBRARY]);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleStartRoutine = async (routine: Routine) => {
    if (activeSession) {
      Alert.alert(
        'Workout in progress',
        'Finish or cancel your current workout before starting a new one.',
        [{ text: 'OK' }],
      );
      return;
    }

    await touchRoutineLastUsed(routine.id);

    startSessionFromRoutine(
      routine.name,
      routine.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
      })),
      routine.exercises.map((e) => e.defaultSets),
      routine.exercises.map((e) => e.defaultReps),
      routine.exercises.map((e) => e.defaultWeight),
    );

    router.push('/(tabs)/workout');
  };

  const handleSaveRoutine = async (routine: Routine) => {
    await saveRoutine(routine);
    setBuilderVisible(false);
    setEditingRoutine(null);
    await load();
  };

  const handleDeleteRoutine = (routine: Routine) => {
    Alert.alert(
      `Delete "${routine.name}"?`,
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRoutine(routine.id);
            await load();
          },
        },
      ],
    );
  };

  const openBuilder = (routine?: Routine) => {
    setEditingRoutine(routine ?? null);
    setBuilderVisible(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Routines</Text>
          <Text style={styles.subtitle}>{routines.length} saved</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => openBuilder()}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {routines.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No routines yet</Text>
            <Text style={styles.emptySub}>
              Create your first routine — Push Day, Pull Day, Legs, whatever works for you.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => openBuilder()}>
              <Text style={styles.emptyBtnText}>Create Routine</Text>
            </TouchableOpacity>
          </View>
        ) : (
          routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onStart={() => handleStartRoutine(routine)}
              onEdit={() => openBuilder(routine)}
              onDelete={() => handleDeleteRoutine(routine)}
            />
          ))
        )}
      </ScrollView>

      <RoutineBuilder
        visible={builderVisible}
        initial={editingRoutine}
        allExercises={allExercises}
        onSave={handleSaveRoutine}
        onClose={() => {
          setBuilderVisible(false);
          setEditingRoutine(null);
        }}
      />
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
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  newBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  newBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#000',
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySub: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  emptyBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
  },
  emptyBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#000',
  },
});
