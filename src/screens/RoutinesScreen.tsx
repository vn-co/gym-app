import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
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
  deleteRoutine,
  getCustomExercises,
  getRoutines,
  saveRoutine,
  touchRoutineLastUsed,
} from '../services/storage';
import { mergeExerciseLibrary } from '../constants/exercises';
import { useWorkoutStore } from '../store/workoutStore';
import { RoutineCard } from '../components/routines/RoutineCard';
import { RoutineBuilder } from '../components/routines/RoutineBuilder';
import { AmbientBackdrop } from '../components/ui/AmbientBackdrop';
import type { Exercise, Routine } from '../types';

export function RoutinesScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>(() =>
    mergeExerciseLibrary([]),
  );
  const [builderVisible, setBuilderVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const startSessionFromRoutine = useWorkoutStore(
    (state) => state.startSessionFromRoutine,
  );
  const activeSession = useWorkoutStore((state) => state.session);

  const load = useCallback(async () => {
    try {
      const [savedRoutines, customExercises] = await Promise.all([
        getRoutines(),
        getCustomExercises(),
      ]);
      setRoutines(savedRoutines);
      setAllExercises(mergeExerciseLibrary(customExercises));
    } catch {
      Alert.alert(
        'Couldn’t load saved data',
        'Your existing data was not changed. Try again.',
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
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

    try {
      await touchRoutineLastUsed(routine.id);
      startSessionFromRoutine(routine.name, routine.exercises);
      router.push('/(tabs)/workout');
    } catch {
      Alert.alert(
        'Couldn’t start routine',
        'Your saved routines could not be updated. Try again.',
      );
    }
  };

  const handleSaveRoutine = async (routine: Routine) => {
    try {
      await saveRoutine(routine);
      setBuilderVisible(false);
      setEditingRoutine(null);
      await load();
    } catch {
      Alert.alert(
        'Couldn’t save routine',
        'The routine is still open so you can try again.',
      );
    }
  };

  const handleDeleteRoutine = (routine: Routine) => {
    Alert.alert(`Delete "${routine.name}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRoutine(routine.id);
            await load();
          } catch {
            Alert.alert(
              'Couldn’t delete routine',
              'Your saved routine was not changed. Try again.',
            );
          }
        },
      },
    ]);
  };

  const openBuilder = (routine?: Routine) => {
    setEditingRoutine(routine ?? null);
    setBuilderVisible(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AmbientBackdrop intensity="quiet" />
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>ROUTINES</Text>
          <Text style={styles.title}>Training plans</Text>
          <Text style={styles.subtitle}>
            {routines.length === 1
              ? '1 saved routine'
              : `${routines.length} saved routines`}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create a new routine"
          style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
          onPress={() => openBuilder()}
        >
          <Text style={styles.newButtonMark}>+</Text>
          <Text style={styles.newButtonText}>New</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeSession ? (
          <View style={styles.activeNotice}>
            <View style={styles.activeDot} />
            <View style={styles.activeCopy}>
              <Text style={styles.activeLabel}>WORKOUT IN PROGRESS</Text>
              <Text style={styles.activeName} numberOfLines={1}>
                {activeSession.workoutName}
              </Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/workout')}>
              <Text style={styles.resumeText}>Resume</Text>
            </Pressable>
          </View>
        ) : null}

        {routines.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyMark}>
              <Text style={styles.emptyMarkText}>R/01</Text>
            </View>
            <Text style={styles.emptyTitle}>Build your first plan</Text>
            <Text style={styles.emptySubtitle}>
              Save the exercises, order, sets, reps, and starting weights you
              want ready for your next session.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.pressed,
              ]}
              onPress={() => openBuilder()}
            >
              <Text style={styles.emptyButtonText}>Create routine</Text>
              <Text style={styles.emptyButtonArrow}>→</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.routineList}>
            {routines.map((routine, index) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                index={index}
                onStart={() => handleStartRoutine(routine)}
                onEdit={() => openBuilder(routine)}
                onDelete={() => handleDeleteRoutine(routine)}
              />
            ))}
          </View>
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
  newButton: {
    minWidth: 84,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
  },
  newButtonMark: {
    color: Colors.bg,
    fontFamily: FontFamily.data,
    fontSize: FontSize.lg,
  },
  newButtonText: {
    color: Colors.bg,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 112,
  },
  activeNotice: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.accentBorder,
    marginBottom: Spacing.xl,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    marginRight: Spacing.md,
  },
  activeCopy: { flex: 1 },
  activeLabel: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.8,
  },
  activeName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  resumeText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  routineList: { gap: Spacing.md },
  empty: {
    overflow: 'hidden',
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    padding: Spacing.xxl,
    marginTop: Spacing.xl,
  },
  emptyMark: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    marginBottom: Spacing.xxl,
  },
  emptyMarkText: {
    color: Colors.accent,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xxl,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  emptyButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
  },
  emptyButtonText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  emptyButtonArrow: {
    color: Colors.bg,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xl,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
