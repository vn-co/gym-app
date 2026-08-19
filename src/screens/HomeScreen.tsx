import { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityOverview } from '../components/home/ActivityOverview';
import { AppIcon } from '../components/icons/AppIcon';
import { RoutineCard } from '../components/routines/RoutineCard';
import { AmbientBackdrop } from '../components/ui/AmbientBackdrop';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '../constants/tokens';
import { healthService } from '../health/healthService';
import type { TodayActivity } from '../health/types';
import {
  getRoutines,
  getSessions,
  getUserName,
  touchRoutineLastUsed,
} from '../services/storage';
import { useWorkoutStore } from '../store/workoutStore';
import type { Routine, WorkoutSession } from '../types';
import {
  formatSessionTime,
  formatWeight,
  getGreeting,
  getWeeklyConsistency,
  isToday,
} from '../utils';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type HealthViewState = 'loading' | 'available' | 'unavailable' | 'error';

function SessionMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.sessionMetric}>
      <Text style={styles.sessionMetricLabel}>{label}</Text>
      <Text style={styles.sessionMetricValue}>{value}</Text>
    </View>
  );
}

function LastWorkout({ session }: { session: WorkoutSession | null }) {
  if (!session) {
    return (
      <View style={styles.emptyWorkout}>
        <Text style={styles.emptyWorkoutTitle}>Your first session starts here.</Text>
        <Text style={styles.emptyWorkoutCopy}>
          Complete a workout and its training summary will live here.
        </Text>
      </View>
    );
  }

  const calories = session.health?.activeEnergyKilocalories;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Open workout progress"
      activeOpacity={0.76}
      style={styles.lastWorkout}
      onPress={() => router.push('/(tabs)/progress')}
    >
      <View style={styles.lastWorkoutTop}>
        <View style={styles.lastWorkoutTitleBlock}>
          <Text style={styles.lastWorkoutName} numberOfLines={1}>
            {session.name}
          </Text>
          <Text style={styles.lastWorkoutDate}>
            {isToday(session.startTime)
              ? 'Today'
              : new Date(session.startTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
            {' · '}
            {formatSessionTime(session.startTime)}
          </Text>
        </View>
        <View style={styles.openMark}>
          <Text style={styles.openMarkText}>↗</Text>
        </View>
      </View>

      <View style={styles.sessionMetrics}>
        <SessionMetric
          label="TIME"
          value={`${Math.max(1, Math.round(session.durationSeconds / 60))} min`}
        />
        <View style={styles.sessionMetricDivider} />
        <SessionMetric
          label="VOLUME"
          value={`${formatWeight(session.totalVolume)} kg`}
        />
        <View style={styles.sessionMetricDivider} />
        <SessionMetric
          label="ACTIVE"
          value={calories == null ? '—' : `${Math.round(calories)} kcal`}
        />
      </View>
    </TouchableOpacity>
  );
}

export function HomeScreen() {
  const [userName, setUserName] = useState('Vlad');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [consistency, setConsistency] = useState<boolean[]>(
    Array(7).fill(false),
  );
  const [activity, setActivity] = useState<TodayActivity | null>(null);
  const [healthState, setHealthState] =
    useState<HealthViewState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [today] = useState(new Date());

  const activeSession = useWorkoutStore((state) => state.session);
  const startSessionFromRoutine = useWorkoutStore(
    (state) => state.startSessionFromRoutine,
  );

  const loadLocalData = useCallback(async () => {
    try {
      const [name, allSessions, allRoutines] = await Promise.all([
        getUserName(),
        getSessions(),
        getRoutines(),
      ]);
      setUserName(name);
      setSessions(allSessions);
      setRoutines(allRoutines);
      setConsistency(getWeeklyConsistency(allSessions));
    } catch {
      Alert.alert(
        'Couldn’t load saved data',
        'Your existing data was not changed. Try again.',
      );
    }
  }, []);

  const loadHealthData = useCallback(async () => {
    setHealthState('loading');
    try {
      const available = await healthService.isHealthDataAvailable();
      if (!available) {
        setActivity(null);
        setHealthState('unavailable');
        return;
      }
      setActivity(await healthService.readTodayActivity());
      setHealthState('available');
    } catch {
      setActivity(null);
      setHealthState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadLocalData();
      void loadHealthData();
    }, [loadHealthData, loadLocalData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadLocalData(), loadHealthData()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadHealthData, loadLocalData]);

  const handleConnectHealth = async () => {
    setHealthState('loading');
    try {
      const available = await healthService.isHealthDataAvailable();
      if (!available) {
        setHealthState('unavailable');
        return;
      }
      await healthService.requestAuthorization();
      setActivity(await healthService.readTodayActivity());
      setHealthState('available');
    } catch {
      setHealthState('error');
    }
  };

  const handleStartWorkout = () => {
    router.push('/(tabs)/workout');
  };

  const handleStartRoutine = async (routine: Routine) => {
    if (activeSession) {
      router.push('/(tabs)/workout');
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

  const consistencyCount = consistency.filter(Boolean).length;
  const todayDayIndex = (today.getDay() + 6) % 7;
  const latestWorkout = sessions[0] ?? null;
  const healthMessage =
    healthState === 'loading'
      ? 'Reading Apple Health'
      : healthState === 'available'
        ? 'Apple Health connected'
        : healthState === 'unavailable'
          ? 'Apple Health requires the installed iPhone build'
          : 'Apple Health needs attention';

  return (
    <SafeAreaView style={styles.safe}>
      <AmbientBackdrop intensity="hero" />
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
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.dateLabel}>
              {today
                .toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })
                .toUpperCase()}
            </Text>
            <Text style={styles.title}>Today</Text>
            <Text style={styles.greeting}>
              {getGreeting()}, {userName}.
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userName[0]?.toUpperCase() ?? 'V'}
            </Text>
          </View>
        </View>

        <ActivityOverview activity={activity} />

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            activeSession ? 'Continue active workout' : 'Start workout'
          }
          activeOpacity={0.84}
          style={[
            styles.primaryAction,
            activeSession && styles.primaryActionActive,
          ]}
          onPress={handleStartWorkout}
        >
          <View style={styles.primaryIcon}>
            <AppIcon
              name={activeSession ? 'play' : 'dumbbell'}
              size={21}
              color={Colors.bg}
              strokeWidth={2}
            />
          </View>
          <View style={styles.primaryCopy}>
            <Text style={styles.primaryTitle}>
              {activeSession ? 'Continue workout' : 'Start workout'}
            </Text>
            <Text style={styles.primaryDetail}>
              {activeSession
                ? `${activeSession.workoutName} is in progress`
                : 'Empty session or choose a routine below'}
            </Text>
          </View>
          <Text style={styles.primaryArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionLabel}>LAST WORKOUT</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/progress')}
          >
            <Text style={styles.sectionAction}>History</Text>
          </TouchableOpacity>
        </View>
        <LastWorkout session={latestWorkout} />

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
          <Text style={styles.sectionMeta}>{consistencyCount} sessions</Text>
        </View>
        <View style={styles.weekCard}>
          <View style={styles.weekTop}>
            <Text style={styles.weekValue}>{consistencyCount}</Text>
            <Text style={styles.weekCopy}>
              {consistencyCount === 1 ? 'workout' : 'workouts'} completed
            </Text>
          </View>
          <View style={styles.weekRail}>
            {WEEK_DAYS.map((day, index) => {
              const completed = consistency[index];
              const current = index === todayDayIndex;
              return (
                <View key={`${day}-${index}`} style={styles.day}>
                  <View
                    style={[
                      styles.dayMark,
                      completed && styles.dayMarkComplete,
                      current && !completed && styles.dayMarkCurrent,
                    ]}
                  >
                    {completed ? (
                      <AppIcon name="check" size={15} color={Colors.bg} />
                    ) : (
                      <Text
                        style={[
                          styles.dayNumber,
                          current && styles.dayNumberCurrent,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.dayLabel, current && styles.dayLabelCurrent]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {routines.length > 0 ? (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionLabel}>QUICK START</Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/routines')}
              >
                <Text style={styles.sectionAction}>All routines</Text>
              </TouchableOpacity>
            </View>
            {routines.slice(0, 2).map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                compact
                onStart={() => handleStartRoutine(routine)}
                onEdit={() => router.push('/(tabs)/routines')}
                onDelete={() => router.push('/(tabs)/routines')}
              />
            ))}
          </>
        ) : null}

        <View style={styles.healthRow}>
          <View style={styles.healthCopy}>
            <View
              style={[
                styles.healthDot,
                healthState !== 'available' && styles.healthDotMuted,
              ]}
            />
            <View style={styles.healthTextBlock}>
              <Text style={styles.healthTitle}>{healthMessage}</Text>
              <Text style={styles.healthDetail}>
                Activity can be unavailable without affecting your workouts.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={healthState === 'loading'}
            onPress={() => void handleConnectHealth()}
          >
            <Text style={styles.healthAction}>
              {healthState === 'available' ? 'Refresh' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 116,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  headerCopy: {
    flex: 1,
  },
  dateLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.display,
    lineHeight: 53,
    letterSpacing: -1.5,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    marginTop: Spacing.xs,
  },
  avatarText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  primaryAction: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  primaryActionActive: {
    borderWidth: 1,
    borderColor: '#C9FF67',
  },
  primaryIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000020',
  },
  primaryCopy: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  primaryTitle: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  primaryDetail: {
    color: '#152000B8',
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  primaryArrow: {
    color: Colors.bg,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xxl,
  },
  sectionHeading: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.1,
  },
  sectionAction: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  sectionMeta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  lastWorkout: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
  },
  lastWorkoutTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  lastWorkoutTitleBlock: {
    flex: 1,
  },
  lastWorkoutName: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xxl,
    letterSpacing: -0.5,
  },
  lastWorkoutDate: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 3,
  },
  openMark: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  openMarkText: {
    color: Colors.accent,
    fontSize: FontSize.lg,
  },
  sessionMetrics: {
    flexDirection: 'row',
  },
  sessionMetric: {
    flex: 1,
  },
  sessionMetricDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  sessionMetricLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.9,
  },
  sessionMetricValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  emptyWorkout: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xl,
  },
  emptyWorkoutTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
  },
  emptyWorkoutCopy: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
    maxWidth: 300,
  },
  weekCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  weekTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  weekValue: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xxxl,
  },
  weekCopy: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  weekRail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
  },
  day: {
    alignItems: 'center',
    gap: 7,
  },
  dayMark: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayMarkComplete: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  dayMarkCurrent: {
    borderColor: Colors.accent,
  },
  dayNumber: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  dayNumberCurrent: {
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  dayLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
  },
  dayLabelCurrent: {
    color: Colors.textPrimary,
  },
  healthRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xl,
  },
  healthCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: Spacing.md,
  },
  healthDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  healthDotMuted: {
    backgroundColor: Colors.textMuted,
  },
  healthTextBlock: {
    flex: 1,
  },
  healthTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  healthDetail: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 17,
    marginTop: 2,
  },
  healthAction: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
