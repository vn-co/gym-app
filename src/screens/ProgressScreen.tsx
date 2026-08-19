import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '../constants/tokens';
import { getPersonalRecords, getSessions } from '../services/storage';
import { buildProgressData, formatShortDate, formatWeight } from '../utils';
import { LineChart } from '../components/ui/LineChart';
import { AmbientBackdrop } from '../components/ui/AmbientBackdrop';
import type { PersonalRecord, ProgressRange, WorkoutSession } from '../types';
import { WorkoutHistoryItem } from '../components/progress/WorkoutHistoryItem';
import { buildPersonalRecordHistory } from '../utils/workoutHistory';

const RANGES: { label: string; value: ProgressRange }[] = [
  { label: '7 days', value: '7d' },
  { label: '1 month', value: '1m' },
  { label: '1 year', value: '1y' },
];

export function ProgressScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = width - Spacing.lg * 4;

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [range, setRange] = useState<ProgressRange>('7d');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [savedSessions, savedRecords] = await Promise.all([
        getSessions(),
        getPersonalRecords(),
      ]);
      setSessions(savedSessions);
      setRecords(savedRecords);
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
  const recordHistory = buildPersonalRecordHistory(sessions);
  const changeLabel = `${stats.percentChange >= 0 ? '+' : ''}${stats.percentChange}%`;

  return (
    <SafeAreaView style={styles.safe}>
      <AmbientBackdrop intensity="quiet" />
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
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PROGRESS</Text>
          <Text style={styles.title}>Built over time</Text>
          <Text style={styles.subtitle}>
            Volume, completed sessions, and the records that matter.
          </Text>
        </View>

        <View style={styles.rangePicker}>
          {RANGES.map((item) => {
            const selected = range === item.value;
            return (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.rangeButton,
                  selected && styles.rangeButtonActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setRange(item.value)}
              >
                <Text
                  style={[
                    styles.rangeButtonText,
                    selected && styles.rangeButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.performanceCard}>
          <View style={styles.performanceHeader}>
            <Text style={styles.sectionLabel}>TOTAL WEIGHT LIFTED</Text>
            {hasData ? (
              <View
                style={[
                  styles.changeBadge,
                  stats.percentChange < 0 && styles.changeBadgeDown,
                ]}
              >
                <Text
                  style={[
                    styles.changeText,
                    stats.percentChange < 0 && styles.changeTextDown,
                  ]}
                >
                  {changeLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.peakValue}>
            {formatWeight(stats.peak)}
            <Text style={styles.peakUnit}> kg peak</Text>
          </Text>

          <View style={styles.chartWrap}>
            <LineChart data={points} width={chartWidth} height={166} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>LOW</Text>
              <Text style={styles.statValue}>{formatWeight(stats.low)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>AVERAGE</Text>
              <Text style={styles.statValue}>{formatWeight(stats.avg)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>PEAK</Text>
              <Text style={[styles.statValue, styles.statValueAccent]}>
                {formatWeight(stats.peak)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionLabel}>WORKOUT HISTORY</Text>
          <Text style={styles.sectionCount}>{sessions.length} sessions</Text>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyCode}>00</Text>
            <Text style={styles.emptyTitle}>No completed sessions yet</Text>
            <Text style={styles.emptyText}>
              Finished workouts will appear here with their Health metrics and
              full set history.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {sessions.map((session) => (
              <WorkoutHistoryItem key={session.id} session={session} />
            ))}
          </View>
        )}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
          <Text style={styles.sectionCount}>{recordHistory.length} records</Text>
        </View>

        {recordHistory.length === 0 ? (
          <View style={styles.emptyRecords}>
            <View style={styles.recordMarkMuted}>
              <Text style={styles.recordMarkMutedText}>PR</Text>
            </View>
            <Text style={styles.emptyRecordsText}>
              Your first completed best set will start this timeline.
            </Text>
          </View>
        ) : (
          <View style={styles.recordList}>
            {recordHistory.map((record, index) => {
              const isAllTimeBest = records.some(
                (savedRecord) =>
                  savedRecord.exerciseId === record.exerciseId &&
                  savedRecord.weight === record.weight,
              );
              return (
                <View
                  key={`${record.sessionId}_${record.exerciseId}`}
                  style={styles.recordRow}
                >
                  <View style={styles.recordMark}>
                    <Text style={styles.recordMarkText}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordName}>{record.exerciseName}</Text>
                    <Text style={styles.recordDate}>
                      {formatShortDate(record.setAt)} ·{' '}
                      {isAllTimeBest ? 'All-time best' : 'Previous PR'}
                    </Text>
                  </View>
                  <View style={styles.recordValueWrap}>
                    <Text style={styles.recordValue}>{record.weight}</Text>
                    <Text style={styles.recordUnit}>kg</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 112,
  },
  hero: { paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
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
    maxWidth: 310,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  rangePicker: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  rangeButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  rangeButtonActive: { backgroundColor: Colors.accent },
  rangeButtonText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  rangeButtonTextActive: { color: Colors.bg },
  performanceCard: {
    overflow: 'hidden',
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    padding: Spacing.lg,
    marginBottom: Spacing.xxxl,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.9,
  },
  changeBadge: {
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  changeBadgeDown: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBg,
  },
  changeText: {
    color: Colors.accent,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  changeTextDown: { color: Colors.danger },
  peakValue: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: 46,
    letterSpacing: -1.2,
    marginTop: Spacing.md,
  },
  peakUnit: {
    color: Colors.textMuted,
    fontFamily: FontFamily.display,
    fontSize: FontSize.lg,
  },
  chartWrap: { marginLeft: -Spacing.lg, marginTop: Spacing.md },
  statsRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 5,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.7,
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.sm,
    fontVariant: ['tabular-nums'],
  },
  statValueAccent: { color: Colors.accent },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionCount: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
  },
  historyList: { marginBottom: Spacing.xxxl },
  emptyPanel: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.xxxl,
  },
  emptyCode: {
    color: Colors.accent,
    fontFamily: FontFamily.data,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
  },
  emptyText: {
    maxWidth: 310,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  emptyRecords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  recordMarkMuted: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordMarkMutedText: {
    color: Colors.textMuted,
    fontFamily: FontFamily.data,
    fontSize: FontSize.xs,
  },
  emptyRecordsText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 19,
  },
  recordList: { marginBottom: Spacing.xxl },
  recordRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recordMark: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    marginRight: Spacing.md,
  },
  recordMarkText: {
    color: Colors.accent,
    fontFamily: FontFamily.data,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
  },
  recordInfo: { flex: 1 },
  recordName: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.lg,
  },
  recordDate: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  recordValueWrap: { alignItems: 'flex-end' },
  recordValue: {
    color: Colors.accent,
    fontFamily: FontFamily.data,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  recordUnit: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  pressed: { opacity: 0.8 },
});
