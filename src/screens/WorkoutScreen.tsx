import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  LayoutAnimation,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  Colors,
  FontSize,
  FontWeight,
  MotionDuration,
  Radius,
  Spacing,
  TabBarMetrics,
} from '../constants/tokens';
import { useWorkoutStore } from '../store/workoutStore';
import { SessionHeader } from '../components/workout/SessionHeader';
import { ExerciseCard } from '../components/workout/ExerciseCard';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import { WorkoutActionBar } from '../components/workout/WorkoutActionBar';
import { EmptyWorkoutState } from '../components/workout/EmptyWorkoutState';
import {
  getCustomExercises,
  saveSession,
  updatePersonalRecords,
} from '../services/storage';
import { mergeExerciseLibrary } from '../constants/exercises';
import { finishActiveWorkout } from '../services/finishActiveWorkout';
import type { Exercise } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const session = useWorkoutStore((s) => s.session);
  const startSession = useWorkoutStore((s) => s.startSession);
  const cancelSession = useWorkoutStore((s) => s.cancelSession);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerExercises, setPickerExercises] = useState<Exercise[]>(() =>
    mergeExerciseLibrary([]),
  );
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const tabBottom = Math.max(insets.bottom, TabBarMetrics.bottomGap);
  const actionBottom = tabBottom + TabBarMetrics.height + Spacing.sm;
  const scrollBottomInset = actionBottom + 68;

  const animateWorkoutLayout = () => {
    if (reduceMotion) return;

    LayoutAnimation.configureNext({
      duration: MotionDuration.standard,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  };

  const handleStartWorkout = () => {
    setWorkoutName('My Workout');
    setNameModalVisible(true);
  };

  const confirmStart = () => {
    startSession(workoutName.trim() || 'My Workout');
    setNameModalVisible(false);
  };

  const handleAddExercise = (exercise: Exercise) => {
    animateWorkoutLayout();
    addExercise({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
    });
  };

  const handleOpenPicker = async () => {
    try {
      const custom = await getCustomExercises();
      setPickerExercises(mergeExerciseLibrary(custom));
      setPickerVisible(true);
    } catch {
      Alert.alert(
        'Couldn’t load exercises',
        'Your saved exercises could not be loaded. Try again.',
      );
    }
  };

  const handleFinishWorkout = () => {
    if (!session) return;
    const completedSets = session.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0,
    );
    if (completedSets === 0) {
      Alert.alert('No sets completed', 'Complete at least one set before finishing.', [
        { text: 'OK' },
      ]);
      return;
    }

    Alert.alert('Finish Workout?', 'This will save your session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          try {
            await finishActiveWorkout(session, Date.now(), {
              saveSession,
              updatePersonalRecords,
              clearActiveSession: cancelSession,
            });
          } catch {
            Alert.alert(
              'Couldn’t save workout',
              'Your workout is still open so you can try again.',
            );
          }
        },
      },
    ]);
  };

  const handleCancelWorkout = () => {
    Alert.alert('Cancel Workout?', 'Progress will be lost.', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Cancel Workout', style: 'destructive', onPress: cancelSession },
    ]);
  };

  // ── No active session ─────────────────────────────────────────────────────
  if (!session) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <EmptyWorkoutState onStart={handleStartWorkout} />

        <Modal
          visible={nameModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setNameModalVisible(false)}
        >
          <View
            style={[
              styles.modalOverlay,
              { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
            ]}
          >
            <View style={styles.modalCard}>
              <View style={styles.dragIndicator} />
              <Text style={styles.modalTitle}>Name your workout</Text>
              <TextInput
                style={styles.modalInput}
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholder="e.g. Push Day"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                onSubmitEditing={confirmStart}
                returnKeyType="done"
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setNameModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirm} onPress={confirmStart}>
                  <Text style={styles.modalConfirmText}>Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── Active session ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: scrollBottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SessionHeader />

        {session.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onRemove={() => {
              Alert.alert('Remove exercise?', ex.exerciseName, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => {
                    animateWorkoutLayout();
                    removeExercise(ex.id);
                  },
                },
              ]);
            }}
          />
        ))}

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelWorkout}>
          <Text style={styles.cancelBtnText}>Cancel Workout</Text>
        </TouchableOpacity>
      </ScrollView>

      <WorkoutActionBar
        bottom={actionBottom}
        onAddExercise={handleOpenPicker}
        onFinish={handleFinishWorkout}
      />

      <ExercisePicker
        visible={pickerVisible}
        exercises={pickerExercises}
        onSelect={handleAddExercise}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },

  cancelBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.bgCardAlt,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    padding: Spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dragIndicator: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 0,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    height: 48,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
  modalCancel: {
    flex: 1,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: { color: Colors.textSecondary, fontWeight: FontWeight.medium, fontSize: FontSize.md },
  modalConfirm: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { color: '#000', fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
