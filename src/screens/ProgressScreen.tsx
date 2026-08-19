import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
} from '../constants/tokens';
import { getSessions, getPersonalRecords } from '../services/storage';
import { buildProgressData, formatWeight, formatShortDate } from '../utils';
import { LineChart } from '../components/ui/LineChart';
import type { WorkoutSession, PersonalRecord, ProgressRange } from '../types';
import { WorkoutHistoryItem } from '../components/progress/WorkoutHistoryItem';
import { buildPersonalRecordHistory } from '../utils/workoutHistory';

const RANGES: { label: string; value: ProgressRange }[] = [
  { label: '7 Days', value: '7d' },
  { label: '1 Month', value: '1m' },
  { label: '1 Year', value: '1y' },
];

export function ProgressScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = width - Spacing.lg * 2 - Spacing.lg * 2; // card padding

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [range, setRange] = useState<ProgressRange>('7d');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([getSessions(), getPersonalRecords()]);
      setSessions(s);
      setPrs(p);
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

  const { points, stats } = buildProgressData(sessions, range);
  const hasData = points.some((point) => point.volume > 0);

  const prHistory = buildPersonalRecordHistory(sessions);

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
        {/* Header */}
        <Text style={styles.eyebrow}>ANALYTICS</Text>
        <Text style={styles.title}>Your Progress</Text>

        {/* Range selector */}
        <View style={styles.rangePicker}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[
                styles.rangeBtn,
                range === r.value && styles.rangeBtnActive,
              ]}
              onPress={() => setRange(r.value)}
            >
              <Text
                style={[
                  styles.rangeBtnText,
                  range === r.value && styles.rangeBtnTextActive,
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Volume chart card */}
        <View style={styles.card}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartLabel}>TOTAL WEIGHT LIFTED</Text>
            {hasData && (
              <View
                style={[
                  styles.changeBadge,
                  {
                    backgroundColor:
                      stats.percentChange >= 0
                        ? Colors.accentBg
                        : Colors.dangerBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.changeBadgeText,
                    {
                      color:
                        stats.percentChange >= 0
                          ? Colors.accent
                          : Colors.danger,
                    },
                  ]}
                >
                  {stats.percentChange >= 0 ? '+' : ''}
                  {stats.percentChange}%
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.peakValue}>
            {formatWeight(stats.peak)}{' '}
            <Text style={styles.peakUnit}>kg peak</Text>
          </Text>

          <LineChart data={points} width={chartWidth} height={150} />

          {/* Low / Avg / Peak */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>LOW</Text>
              <Text style={styles.statValue}>{formatWeight(stats.low)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>AVG</Text>
              <Text style={styles.statValue}>{formatWeight(stats.avg)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>PEAK</Text>
              <Text style={[styles.statValue, { color: Colors.accent }]}>
                {formatWeight(stats.peak)}
              </Text>
            </View>
          </View>
        </View>

        {/* Workout History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>WORKOUT HISTORY</Text>
          <Text style={styles.sectionCount}>{sessions.length} sessions</Text>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyPrsText}>
              Completed workouts will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {sessions.map((session) => (
              <WorkoutHistoryItem key={session.id} session={session} />
            ))}
          </View>
        )}

        {/* PR History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>PR HISTORY</Text>
          <Text style={styles.sectionCount}>{prHistory.length} records</Text>
        </View>

        {prHistory.length === 0 ? (
          <View style={styles.emptyPrs}>
            <Text style={styles.emptyPrsEmoji}>🏆</Text>
            <Text style={styles.emptyPrsText}>
              Complete workouts to set personal records
            </Text>
          </View>
        ) : (
          prHistory.map((pr) => {
            const isAllTimeBest = prs.some(
              (savedRecord) =>
                savedRecord.exerciseId === pr.exerciseId &&
                savedRecord.weight === pr.weight,
            );
            return (
            <View key={`${pr.sessionId}_${pr.exerciseId}`} style={styles.prCard}>
              <View style={styles.prIcon}>
                <Text style={styles.prEmoji}>🏆</Text>
              </View>
              <View style={styles.prInfo}>
                <Text style={styles.prName}>{pr.exerciseName}</Text>
                <Text style={styles.prDate}>
                  Set {formatShortDate(pr.setAt)}
                </Text>
              </View>
              <View style={styles.prRight}>
                <Text style={styles.prWeight}>{pr.weight} kg</Text>
                <Text style={styles.prSubtitle}>
                  {isAllTimeBest ? 'All-time best' : 'Previous PR'}
                </Text>
              </View>
            </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },

  eyebrow: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  rangePicker: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  rangeBtnActive: {
    backgroundColor: Colors.accent,
  },
  rangeBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
  },
  rangeBtnTextActive: {
    color: '#000',
    fontWeight: FontWeight.bold,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  chartLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  changeBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  changeBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  peakValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  peakUnit: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
  },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },

  prCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  prIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prEmoji: { fontSize: FontSize.xl },
  prInfo: { flex: 1 },
  prName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  prDate: { fontSize: FontSize.sm, color: Colors.textMuted },
  prRight: { alignItems: 'flex-end' },
  prWeight: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  prSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  emptyPrs: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyHistory: {
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  historyList: { marginBottom: Spacing.xxl },
  emptyPrsEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyPrsText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
