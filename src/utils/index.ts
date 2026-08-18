import type {
  WorkoutSession,
  ProgressDataPoint,
  ProgressStats,
  ProgressRange,
} from '../types';

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function calcVolume(
  sets: { weight: number; reps: number; completed: boolean }[],
): number {
  return sets
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.weight * s.reps, 0);
}

export function parseNumericInput(text: string, integer = false): number {
  const normalized = text.trim().replace(',', '.');
  if (!normalized) return 0;

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return 0;

  return integer ? Math.trunc(value) : value;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTimerDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatWeight(kg?: number): string {
  const n = typeof kg === 'number' && !Number.isNaN(kg) ? kg : 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatSessionTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Returns last 7 days starting from today
export function getLast7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

// Build chart data from sessions for a given range
export function buildProgressData(
  sessions: WorkoutSession[],
  range: ProgressRange,
): { points: ProgressDataPoint[]; stats: ProgressStats } {
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const count = range === '7d' ? 7 : range === '1m' ? 30 : 52;
  const daysPerBucket = range === '1y' ? 7 : 1;
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 1);
  rangeEnd.setHours(0, 0, 0, 0);

  const points: ProgressDataPoint[] = Array.from({ length: count }, (_, i) => {
    const bucketEnd = new Date(rangeEnd);
    bucketEnd.setDate(
      bucketEnd.getDate() - (count - 1 - i) * daysPerBucket,
    );
    const bucketStart = new Date(bucketEnd);
    bucketStart.setDate(bucketStart.getDate() - daysPerBucket);

    const startTimestamp = bucketStart.getTime();
    const endTimestamp = bucketEnd.getTime();
    const volume = sessions
      .filter(
        (session) =>
          session.startTime >= startTimestamp &&
          session.startTime < endTimestamp,
      )
      .reduce((acc, s) => acc + s.totalVolume, 0);
    return {
      date:
        range === '7d'
          ? DAY_LABELS[bucketStart.getDay()]
          : `${bucketStart.getMonth() + 1}/${bucketStart.getDate()}`,
      timestamp: startTimestamp,
      volume,
    };
  });

  const nonZero = points.map((p) => p.volume).filter((v) => v > 0);
  const low = nonZero.length ? Math.min(...nonZero) : 0;
  const peak = nonZero.length ? Math.max(...nonZero) : 0;
  const avg = nonZero.length
    ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length)
    : 0;

  // percent change vs first half vs second half
  const comparisonSize = Math.floor(points.length / 2);
  const firstHalf = points
    .slice(0, comparisonSize)
    .reduce((a, b) => a + b.volume, 0);
  const secondHalf = points
    .slice(-comparisonSize)
    .reduce((a, b) => a + b.volume, 0);
  const percentChange =
    firstHalf > 0
      ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
      : 0;

  return { points, stats: { low, avg, peak, percentChange } };
}

// Weekly consistency — returns array of 7 booleans (Mon–Sun) for current week
export function getWeeklyConsistency(sessions: WorkoutSession[]): boolean[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const dayStartDate = new Date(monday);
    dayStartDate.setDate(dayStartDate.getDate() + i);
    const dayEndDate = new Date(dayStartDate);
    dayEndDate.setDate(dayEndDate.getDate() + 1);
    const dayStart = dayStartDate.getTime();
    const dayEnd = dayEndDate.getTime();
    return sessions.some(
      (s) => s.startTime >= dayStart && s.startTime < dayEnd,
    );
  });
}
