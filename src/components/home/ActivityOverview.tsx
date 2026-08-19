import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from '../../constants/tokens';
import type { TodayActivity } from '../../health/types';
import {
  formatCompactActivityValue,
  getGoalProgress,
} from '../../utils/todayActivity';

interface ActivityOverviewProps {
  activity: TodayActivity | null;
}

interface ActivityMetricProps {
  label: string;
  value: string;
  unit: string;
  detail: string;
}

const OUTER_RADIUS = 62;
const INNER_RADIUS = 49;
const OUTER_CIRCUMFERENCE = 2 * Math.PI * OUTER_RADIUS;
const INNER_CIRCUMFERENCE = 2 * Math.PI * INNER_RADIUS;

function ActivityMetric({
  label,
  value,
  unit,
  detail,
}: ActivityMetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

export function ActivityOverview({ activity }: ActivityOverviewProps) {
  const moveProgress = getGoalProgress(
    activity?.activeEnergyKilocalories ?? null,
    activity?.activeEnergyGoalKilocalories ?? null,
  );
  const exerciseProgress = getGoalProgress(
    activity?.exerciseMinutes ?? null,
    activity?.exerciseGoalMinutes ?? null,
  );
  const activeEnergy = activity?.activeEnergyKilocalories ?? null;
  const exerciseMinutes = activity?.exerciseMinutes ?? null;
  const steps = activity?.stepCount ?? null;

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>TODAY'S ACTIVITY</Text>
          <Text style={styles.heading}>Current state</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>HEALTH</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.ringWrap}>
          <Svg width={154} height={154} viewBox="0 0 154 154">
            <Circle
              cx={77}
              cy={77}
              r={OUTER_RADIUS}
              fill="none"
              stroke={Colors.borderStrong}
              strokeWidth={9}
            />
            <Circle
              cx={77}
              cy={77}
              r={OUTER_RADIUS}
              fill="none"
              stroke={Colors.accent}
              strokeWidth={9}
              strokeLinecap="round"
              strokeDasharray={OUTER_CIRCUMFERENCE}
              strokeDashoffset={
                OUTER_CIRCUMFERENCE * (1 - (moveProgress ?? 0))
              }
              rotation={-90}
              origin="77, 77"
              opacity={moveProgress == null ? 0.25 : 1}
            />
            <Circle
              cx={77}
              cy={77}
              r={INNER_RADIUS}
              fill="none"
              stroke={Colors.border}
              strokeWidth={5}
            />
            <Circle
              cx={77}
              cy={77}
              r={INNER_RADIUS}
              fill="none"
              stroke={Colors.accentSoft}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={INNER_CIRCUMFERENCE}
              strokeDashoffset={
                INNER_CIRCUMFERENCE * (1 - (exerciseProgress ?? 0))
              }
              rotation={-90}
              origin="77, 77"
              opacity={exerciseProgress == null ? 0.2 : 0.9}
            />
          </Svg>
          <View style={styles.ringLabel}>
            <Text style={styles.ringValue}>
              {formatCompactActivityValue(activeEnergy)}
            </Text>
            <Text style={styles.ringUnit}>KCAL</Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <ActivityMetric
            label="EXERCISE"
            value={formatCompactActivityValue(exerciseMinutes)}
            unit="min"
            detail={
              activity?.exerciseGoalMinutes == null
                ? 'Today'
                : `of ${Math.round(activity.exerciseGoalMinutes)} min`
            }
          />
          <View style={styles.metricDivider} />
          <ActivityMetric
            label="STEPS"
            value={formatCompactActivityValue(steps)}
            unit=""
            detail="Today"
          />
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendMark, styles.legendMove]} />
          <Text style={styles.legendText}>Active energy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMark, styles.legendExercise]} />
          <Text style={styles.legendText}>Exercise</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  heading: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
  },
  livePill: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
  },
  liveText: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringWrap: {
    width: 166,
    height: 166,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: 35,
    fontVariant: ['tabular-nums'],
  },
  ringUnit: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
    marginTop: -2,
  },
  metrics: {
    flex: 1,
    paddingLeft: Spacing.md,
  },
  metric: {
    paddingVertical: Spacing.sm,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 2,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.display,
    fontSize: FontSize.xxl,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  metricDetail: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  metricDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendMark: {
    width: 14,
    height: 3,
    borderRadius: Radius.full,
  },
  legendMove: {
    backgroundColor: Colors.accent,
  },
  legendExercise: {
    backgroundColor: Colors.accentSoft,
  },
  legendText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
