import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '../constants/tokens';
import {
  getSessions,
  getUserName,
  getRoutines,
  touchRoutineLastUsed,
} from '../services/storage';
import {
  getGreeting,
  getWeeklyConsistency,
  formatWeight,
  isToday,
  formatSessionTime,
} from '../utils';
import type { WorkoutSession, Routine } from '../types';
import { useWorkoutStore } from '../store/workoutStore';
import { RoutineCard } from '../components/routines/RoutineCard';
import { HealthKitProofPanel } from '../components/health/HealthKitProofPanel';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HomeScreen() {
  const [userName, setUserName] = useState('Vlad');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [consistency, setConsistency] = useState<boolean[]>(
    Array(7).fill(false),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [today] = useState(new Date());

  const activeSession = useWorkoutStore((s) => s.session);
  const startSessionFromRoutine = useWorkoutStore(
    (s) => s.startSessionFromRoutine,
  );

  const load = useCallback(async () => {
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

  const handleStartWorkout = () => {
    if (activeSession) {
      router.push('/(tabs)/workout');
      return;
    }
    router.push('/(tabs)/workout');
  };

  const recentSessions = sessions.slice(0, 5);
  const consistencyCount = consistency.filter(Boolean).length;
  const todayDayIdx = (today.getDay() + 6) % 7; // convert Sun=0 to Mon=0

  return (
    <SafeAreaView style={styles.safe}>
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
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.dateLabel}>
              {today
                .toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })
                .toUpperCase()}
            </Text>
            <Text style={styles.greeting}>
              {getGreeting()},{' '}
              <Text style={styles.greetingName}>{userName}.</Text>
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userName[0]?.toUpperCase() ?? 'A'}
            </Text>
          </View>
        </View>

        {/* Start Workout CTA */}
        <TouchableOpacity
          style={styles.startCta}
          onPress={handleStartWorkout}
          activeOpacity={0.85}
        >
          <View style={styles.startCtaLeft}>
            <View style={styles.plusCircle}>
              <Text style={styles.plusText}>+</Text>
            </View>
            <View>
              <Text style={styles.startCtaTitle}>
                {activeSession ? 'Continue Workout' : 'Start Empty Workout'}
              </Text>
              <Text style={styles.startCtaSub}>
                {activeSession
                  ? `${activeSession.workoutName} in progress`
                  : 'No template needed'}
              </Text>
            </View>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {__DEV__ ? <HealthKitProofPanel /> : null}

        {/* Routines quick-launch */}
        {routines.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>MY ROUTINES</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/routines')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {routines.slice(0, 3).map((routine) => (
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
        )}

        {/* Weekly Consistency */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardLabelEmoji}>↗</Text>
              <Text style={styles.cardLabel}>WEEKLY CONSISTENCY</Text>
            </View>
            <Text style={styles.consistencyCount}>{consistencyCount}/7</Text>
          </View>

          <View style={styles.dotsRow}>
            {WEEK_DAYS.map((day, i) => {
              const isCurrentDay = i === todayDayIdx;
              const done = consistency[i];
              return (
                <View key={i} style={styles.dayItem}>
                  <Text style={styles.dayLabel}>{day}</Text>
                  <View
                    style={[
                      styles.dot,
                      done
                        ? styles.dotDone
                        : isCurrentDay
                          ? styles.dotToday
                          : styles.dotEmpty,
                    ]}
                  >
                    {done && <Text style={styles.dotCheck}>✓</Text>}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(consistencyCount / 7) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Recent Workouts */}
        {recentSessions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>RECENT WORKOUTS</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/progress')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentSessions.map((session, idx) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionIcon}>
                  <Text style={styles.sessionEmoji}>💪</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionName}>{session.name}</Text>
                    {idx === 0 && (
                      <View style={styles.latestBadge}>
                        <Text style={styles.latestBadgeText}>LATEST</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sessionDate}>
                    {isToday(session.startTime)
                      ? 'Today'
                      : new Date(session.startTime).toLocaleDateString(
                          'en-US',
                          { month: 'short', day: 'numeric' },
                        )}
                    , {formatSessionTime(session.startTime)}
                  </Text>
                  <View style={styles.sessionStats}>
                    <Text style={styles.sessionStat}>
                      ⏱ {Math.round(session.durationSeconds / 60)} min
                    </Text>
                    <Text style={styles.sessionStat}>
                      ⚖️ {formatWeight(session.totalVolume)} kg
                    </Text>
                    <Text style={styles.sessionStat}>
                      ⚡ {session.totalSets} sets
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {recentSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your first session above
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },

  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  dateLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  greetingName: {
    color: Colors.accent,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },

  startCta: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  startCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  plusCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#000',
  },
  startCtaTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#000',
  },
  startCtaSub: {
    fontSize: FontSize.sm,
    color: 'rgba(0,0,0,0.6)',
    fontFamily: 'monospace',
  },
  arrow: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: 'rgba(0,0,0,0.5)',
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardLabelEmoji: {
    fontSize: FontSize.sm,
    color: Colors.accent,
  },
  cardLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  consistencyCount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dayItem: { alignItems: 'center', gap: Spacing.xs },
  dayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  dotDone: { backgroundColor: Colors.bgCardAlt, borderColor: Colors.accent },
  dotToday: { backgroundColor: 'transparent', borderColor: Colors.accent },
  dotEmpty: { backgroundColor: Colors.bgCardAlt, borderColor: 'transparent' },
  dotCheck: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },

  sessionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionEmoji: { fontSize: FontSize.xl },
  sessionInfo: { flex: 1 },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  sessionName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  latestBadge: {
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  latestBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  sessionDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  sessionStats: { flexDirection: 'row', gap: Spacing.md },
  sessionStat: { fontSize: FontSize.xs, color: Colors.textSecondary },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: { fontSize: FontSize.md, color: Colors.textMuted },
});
