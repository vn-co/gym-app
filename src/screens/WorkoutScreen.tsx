import { useEffect, useRef, useState } from 'react';
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
  FontFamily,
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
  getPersonalRecords,
  getSessions,
  saveSession,
  updatePersonalRecords,
} from '../services/storage';
import { mergeExerciseLibrary } from '../constants/exercises';
import { finishActiveWorkout } from '../services/finishActiveWorkout';
import type {
  Exercise,
  HeartRateSample,
  PersonalRecord,
  WorkoutSession,
} from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { healthService } from '../health/healthService';
import type {
  HealthWorkoutState,
  LiveHealthMetrics,
} from '../health/types';
import type { WorkoutHealthSummary } from '../types';
import { WorkoutCompleteView } from '../components/workout/WorkoutCompleteView';
import { AmbientBackdrop } from '../components/ui/AmbientBackdrop';
import {
  findNewPersonalRecords,
  findPreviousComparableWorkout,
} from '../utils/workoutCompletion';

type PickerMode =
  | { type: 'add' }
  | { type: 'replace'; workoutExerciseId: string };

interface CompletedWorkoutState {
  workout: WorkoutSession;
  previousComparable?: WorkoutSession;
  newRecords: PersonalRecord[];
}

export function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const session = useWorkoutStore((s) => s.session);
  const startSession = useWorkoutStore((s) => s.startSession);
  const cancelSession = useWorkoutStore((s) => s.cancelSession);
  const renameSession = useWorkoutStore((s) => s.renameSession);
  const pauseSession = useWorkoutStore((s) => s.pauseSession);
  const resumeSession = useWorkoutStore((s) => s.resumeSession);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const replaceExercise = useWorkoutStore((s) => s.replaceExercise);
  const moveExercise = useWorkoutStore((s) => s.moveExercise);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerExercises, setPickerExercises] = useState<Exercise[]>(() =>
    mergeExerciseLibrary([]),
  );
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [editingWorkoutName, setEditingWorkoutName] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [pickerMode, setPickerMode] = useState<PickerMode>({ type: 'add' });
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null,
  );
  const [healthState, setHealthState] =
    useState<HealthWorkoutState>('idle');
  const [healthAvailable, setHealthAvailable] = useState<boolean | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveHealthMetrics | null>(null);
  const [heartRateSamples, setHeartRateSamples] = useState<HeartRateSample[]>([]);
  const [completedWorkout, setCompletedWorkout] =
    useState<CompletedWorkoutState | null>(null);
  const attemptedHealthSessionRef = useRef<string | null>(null);
  const finishedHealthSummaryRef = useRef<WorkoutHealthSummary | null>(null);
  const tabBottom = Math.max(insets.bottom, TabBarMetrics.bottomGap);
  const actionBottom = tabBottom + TabBarMetrics.height + Spacing.sm;
  const scrollBottomInset = actionBottom + 68;

  useEffect(() => {
    if (!session) {
      setHealthState('idle');
      setLiveMetrics(null);
      setHealthAvailable(null);
      attemptedHealthSessionRef.current = null;
      finishedHealthSummaryRef.current = null;
      return;
    }

    setHeartRateSamples([]);

    let cancelled = false;
    const unsubscribeState = healthService.subscribeToWorkoutState((snapshot) => {
      if (!cancelled) setHealthState(snapshot.state);
    });
    const unsubscribeMetrics = healthService.subscribeToLiveMetrics((metrics) => {
      if (cancelled) return;
      setLiveMetrics(metrics);
      if (metrics.heartRateBpm != null) {
        setHeartRateSamples((current) => {
          if (current.at(-1)?.capturedAt === metrics.capturedAt) return current;
          return [
            ...current.slice(-179),
            { capturedAt: metrics.capturedAt, bpm: metrics.heartRateBpm! },
          ];
        });
      }
    });

    const connectHealthWorkout = async () => {
      try {
        const available = await healthService.isHealthDataAvailable();
        if (cancelled) return;
        setHealthAvailable(available);
        if (!available) return;

        await healthService.requestAuthorization();
        const snapshot = await healthService.getWorkoutState();
        if (cancelled) return;
        setHealthState(snapshot.state);

        if (attemptedHealthSessionRef.current === session.sessionId) return;
        attemptedHealthSessionRef.current = session.sessionId;
        if (
          snapshot.state === 'idle' ||
          snapshot.state === 'ended' ||
          snapshot.state === 'failed'
        ) {
          setHealthState('starting');
          await healthService.startWorkout(session.sessionId, session.startTime);
          if (!cancelled) setHealthState('running');
        }
      } catch {
        if (!cancelled) setHealthState('failed');
      }
    };

    void connectHealthWorkout();
    return () => {
      cancelled = true;
      unsubscribeState();
      unsubscribeMetrics();
    };
  }, [session?.sessionId]);

  useEffect(() => {
    if (!session?.exercises.length) {
      setSelectedExerciseId(null);
      return;
    }
    const selectedStillExists = session.exercises.some(
      (exercise) => exercise.id === selectedExerciseId,
    );
    if (!selectedStillExists) {
      const firstIncomplete = session.exercises.find((exercise) =>
        exercise.sets.some((setEntry) => !setEntry.completed),
      );
      setSelectedExerciseId(firstIncomplete?.id ?? session.exercises[0].id);
    }
  }, [selectedExerciseId, session?.exercises]);

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
    setCompletedWorkout(null);
    setWorkoutName('My Workout');
    setEditingWorkoutName(false);
    setNameModalVisible(true);
  };

  const confirmWorkoutName = () => {
    const nextName = workoutName.trim() || 'My Workout';
    if (editingWorkoutName) {
      renameSession(nextName);
    } else {
      startSession(nextName);
    }
    setNameModalVisible(false);
  };

  const handleAddExercise = (exercise: Exercise) => {
    animateWorkoutLayout();
    if (pickerMode.type === 'replace') {
      replaceExercise(pickerMode.workoutExerciseId, {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
      });
    } else {
      addExercise({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
      });
    }
  };

  const handleOpenPicker = async (mode: PickerMode = { type: 'add' }) => {
    try {
      const custom = await getCustomExercises();
      setPickerExercises(mergeExerciseLibrary(custom));
      setPickerMode(mode);
      setPickerVisible(true);
    } catch {
      Alert.alert(
        'Couldn’t load exercises',
        'Your saved exercises could not be loaded. Try again.',
      );
    }
  };

  const handleTogglePause = () => {
    if (!session) return;
    const isPaused = session.runningSince === null;
    if (isPaused) {
      resumeSession();
      if (healthState === 'paused') {
        void healthService.resumeWorkout().catch(() => setHealthState('failed'));
      }
    } else {
      pauseSession();
      if (healthState === 'running') {
        void healthService.pauseWorkout().catch(() => setHealthState('failed'));
      }
    }
  };

  const finishHealthWorkout = async (): Promise<WorkoutHealthSummary> => {
    if (finishedHealthSummaryRef.current) {
      return finishedHealthSummaryRef.current;
    }
    if (healthAvailable === false || healthAvailable === null) {
      return { status: 'unavailable', heartRateSamples };
    }
    try {
      const workout = await healthService.finishWorkout();
      const summary: WorkoutHealthSummary = {
        status: 'saved',
        workoutUuid: workout.workoutUuid,
        activeEnergyKilocalories:
          workout.activeEnergyKilocalories ?? undefined,
        averageHeartRateBpm: workout.averageHeartRateBpm ?? undefined,
        maximumHeartRateBpm: workout.maximumHeartRateBpm ?? undefined,
        heartRateSamples,
      };
      finishedHealthSummaryRef.current = summary;
      return summary;
    } catch {
      const summary: WorkoutHealthSummary = {
        status: 'failed',
        heartRateSamples,
      };
      finishedHealthSummaryRef.current = summary;
      return summary;
    }
  };

  const openWorkoutEditor = () => {
    if (!session) return;
    setWorkoutName(session.workoutName);
    setEditingWorkoutName(true);
    setNameModalVisible(true);
  };

  const openExerciseMenu = (workoutExerciseId: string) => {
    if (!session) return;
    const index = session.exercises.findIndex(
      (exercise) => exercise.id === workoutExerciseId,
    );
    const exercise = session.exercises[index];
    if (!exercise) return;

    Alert.alert(exercise.exerciseName, 'Manage this exercise', [
      {
        text: 'Replace exercise',
        onPress: () =>
          void handleOpenPicker({ type: 'replace', workoutExerciseId }),
      },
      ...(index > 0
        ? [{ text: 'Move up', onPress: () => moveExercise(workoutExerciseId, index - 1) }]
        : []),
      ...(index < session.exercises.length - 1
        ? [{ text: 'Move down', onPress: () => moveExercise(workoutExerciseId, index + 1) }]
        : []),
      {
        text: 'Delete exercise',
        style: 'destructive',
        onPress: () => {
          animateWorkoutLayout();
          removeExercise(workoutExerciseId);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
            const [sessionsBeforeWorkout, recordsBeforeWorkout] =
              await Promise.all([getSessions(), getPersonalRecords()]);
            const healthSummary = await finishHealthWorkout();
            const completed = await finishActiveWorkout(session, Date.now(), {
              saveSession,
              updatePersonalRecords,
              clearActiveSession: cancelSession,
              healthSummary,
            });
            setCompletedWorkout({
              workout: completed,
              previousComparable: findPreviousComparableWorkout(
                completed.name,
                sessionsBeforeWorkout.filter(
                  (savedWorkout) => savedWorkout.id !== completed.id,
                ),
              ),
              newRecords: findNewPersonalRecords(
                completed,
                recordsBeforeWorkout,
              ),
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
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: async () => {
          try {
            if (healthAvailable) await healthService.discardWorkout();
          } catch {
            // Local cancellation must remain available if HealthKit fails.
          } finally {
            cancelSession();
          }
        },
      },
    ]);
  };

  const renderWorkoutNameModal = () => (
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
          <Text style={styles.modalTitle}>
            {editingWorkoutName ? 'Edit workout' : 'Name your workout'}
          </Text>
          <TextInput
            style={styles.modalInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="e.g. Push Day"
            placeholderTextColor={Colors.textMuted}
            autoFocus
            onSubmitEditing={confirmWorkoutName}
            returnKeyType="done"
          />
          <View style={styles.modalBtns}>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setNameModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirm}
              onPress={confirmWorkoutName}
            >
              <Text style={styles.modalConfirmText}>
                {editingWorkoutName ? 'Save' : 'Start'}
              </Text>
            </TouchableOpacity>
          </View>
          {editingWorkoutName ? (
            <TouchableOpacity
              style={styles.modalDestructive}
              onPress={() => {
                setNameModalVisible(false);
                handleCancelWorkout();
              }}
            >
              <Text style={styles.modalDestructiveText}>Cancel workout</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  // ── No active session ─────────────────────────────────────────────────────
  if (!session) {
    if (completedWorkout) {
      return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <WorkoutCompleteView
            workout={completedWorkout.workout}
            previousComparable={completedWorkout.previousComparable}
            newRecords={completedWorkout.newRecords}
            bottomInset={tabBottom + TabBarMetrics.height}
            onDone={() => setCompletedWorkout(null)}
          />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <EmptyWorkoutState onStart={handleStartWorkout} />

        {renderWorkoutNameModal()}
      </SafeAreaView>
    );
  }

  // ── Active session ────────────────────────────────────────────────────────
  const activeExercise =
    session.exercises.find((exercise) => exercise.id === selectedExerciseId) ??
    session.exercises[0] ??
    null;
  const otherExercises = session.exercises.filter(
    (exercise) => exercise.id !== activeExercise?.id,
  );
  const replacingWorkoutExerciseId =
    pickerMode.type === 'replace' ? pickerMode.workoutExerciseId : null;
  const visiblePickerExercises = pickerExercises.filter(
    (exercise) =>
      !session.exercises.some(
        (workoutExercise) =>
          workoutExercise.id !== replacingWorkoutExerciseId &&
          workoutExercise.exerciseId === exercise.id,
      ),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AmbientBackdrop intensity="hero" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: scrollBottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SessionHeader
          metrics={liveMetrics}
          healthState={healthState}
          onEdit={openWorkoutEditor}
          onTogglePause={handleTogglePause}
        />

        {session.exercises.length === 0 ? (
          <View style={styles.firstExercisePrompt}>
            <Text style={styles.firstExerciseTitle}>Add your first exercise</Text>
            <Text style={styles.firstExerciseCopy}>
              Choose an exercise to begin logging sets.
            </Text>
          </View>
        ) : null}

        {activeExercise ? (
          <>
            <Text style={styles.sectionLabel}>CURRENT EXERCISE</Text>
            <ExerciseCard
              exercise={activeExercise}
              onOpenMenu={() => openExerciseMenu(activeExercise.id)}
            />
          </>
        ) : null}

        {otherExercises.length > 0 ? (
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionLabel}>UPCOMING</Text>
            {otherExercises.map((exercise) => {
              const completedSets = exercise.sets.filter(
                (setEntry) => setEntry.completed,
              ).length;
              return (
                <TouchableOpacity
                  key={exercise.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${exercise.exerciseName}`}
                  style={styles.upcomingRow}
                  onPress={() => {
                    animateWorkoutLayout();
                    setSelectedExerciseId(exercise.id);
                  }}
                  onLongPress={() => openExerciseMenu(exercise.id)}
                >
                  <View style={styles.upcomingIndex}>
                    <Text style={styles.upcomingIndexText}>
                      {session.exercises.indexOf(exercise) + 1}
                    </Text>
                  </View>
                  <View style={styles.upcomingCopy}>
                    <Text style={styles.upcomingName} numberOfLines={1}>
                      {exercise.exerciseName}
                    </Text>
                    <Text style={styles.upcomingMeta}>
                      {completedSets}/{exercise.sets.length} sets complete
                    </Text>
                  </View>
                  <Text style={styles.upcomingAction}>Open</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancelWorkout}
        >
          <Text style={styles.cancelBtnText}>Cancel workout</Text>
        </TouchableOpacity>
      </ScrollView>

      <WorkoutActionBar
        bottom={actionBottom}
        onAddExercise={() => void handleOpenPicker()}
        onFinish={handleFinishWorkout}
      />

      <ExercisePicker
        visible={pickerVisible}
        exercises={visiblePickerExercises}
        onSelect={handleAddExercise}
        onClose={() => setPickerVisible(false)}
        title={pickerMode.type === 'replace' ? 'Replace exercise' : 'Add exercise'}
      />
      {renderWorkoutNameModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  firstExercisePrompt: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  firstExerciseTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    marginBottom: Spacing.xs,
  },
  firstExerciseCopy: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 21,
  },

  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.1,
    marginBottom: Spacing.sm,
  },
  upcomingSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  upcomingRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  upcomingIndex: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upcomingIndexText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  upcomingCopy: { flex: 1 },
  upcomingName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 3,
  },
  upcomingMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  upcomingAction: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  cancelBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xxl,
    letterSpacing: -0.5,
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
  modalDestructive: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  modalDestructiveText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
