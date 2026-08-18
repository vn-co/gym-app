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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/tokens';
import { useWorkoutStore } from '../store/workoutStore';
import { SessionHeader } from '../components/workout/SessionHeader';
import { ExerciseCard } from '../components/workout/ExerciseCard';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import {
  getCustomExercises,
  saveSession,
  updatePersonalRecords,
} from '../services/storage';
import { mergeExerciseLibrary } from '../constants/exercises';
import { finishActiveWorkout } from '../services/finishActiveWorkout';
import type { Exercise } from '../types';

export function WorkoutScreen() {
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

  const handleStartWorkout = () => {
    setWorkoutName('My Workout');
    setNameModalVisible(true);
  };

  const confirmStart = () => {
    startSession(workoutName.trim() || 'My Workout');
    setNameModalVisible(false);
  };

  const handleAddExercise = (exercise: Exercise) => {
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
        style: 'destructive',
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.noSession}>
          <Text style={styles.noSessionEmoji}>🏋️</Text>
          <Text style={styles.noSessionTitle}>Ready to train?</Text>
          <Text style={styles.noSessionSub}>Start a workout to begin logging sets</Text>

          <TouchableOpacity style={styles.startBtn} onPress={handleStartWorkout}>
            <Text style={styles.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Workout name modal */}
        <Modal visible={nameModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Workout Name</Text>
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
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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
                { text: 'Remove', style: 'destructive', onPress: () => removeExercise(ex.id) },
              ]);
            }}
          />
        ))}

        {/* Add Exercise */}
        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={handleOpenPicker}
        >
          <Text style={styles.addExerciseBtnText}>+ Add Exercise</Text>
        </TouchableOpacity>

        {/* Finish Workout */}
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinishWorkout}>
          <Text style={styles.finishIcon}>⊗</Text>
          <Text style={styles.finishBtnText}>Finish Workout</Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelWorkout}>
          <Text style={styles.cancelBtnText}>Cancel Workout</Text>
        </TouchableOpacity>
      </ScrollView>

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
  content: { padding: Spacing.lg, paddingBottom: 100 },

  noSession: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  noSessionEmoji: { fontSize: 64, marginBottom: Spacing.xl },
  noSessionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  noSessionSub: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },
  startBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
  },
  startBtnText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#000',
  },

  addExerciseBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addExerciseBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },

  finishBtn: {
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  finishIcon: { fontSize: FontSize.lg, color: Colors.danger },
  finishBtnText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
  },

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
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
  modalCancel: {
    flex: 1,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: { color: Colors.textSecondary, fontWeight: FontWeight.medium, fontSize: FontSize.md },
  modalConfirm: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: { color: '#000', fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
