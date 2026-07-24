import type { WorkoutSession, ProgressDataPoint, ProgressStats, ProgressRange } from '../types';

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

export function formatWeight(lbs?: number): string {
  const n = typeof lbs === 'number' && !Number.isNaN(lbs) ? lbs : 0;
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
  const now = Date.now();
  let days: Date[];

  if (range === '7d') {
    days = getLast7Days();
  } else if (range === '1m') {
    days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d;
    });
  } else {
    // 1 year — weekly buckets
    days = Array.from({ length: 52 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (51 - i) * 7);
      return d;
    });
  }

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const points: ProgressDataPoint[] = days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = dayStart + 86400000;
    const volume = sessions
      .filter((s) => s.startTime >= dayStart && s.startTime < dayEnd)
      .reduce((acc, s) => acc + s.totalVolume, 0);
    return {
      date: range === '7d' ? DAY_LABELS[day.getDay()] : `${day.getMonth() + 1}/${day.getDate()}`,
      timestamp: dayStart,
      volume,
    };
  });

  const nonZero = points.map((p) => p.volume).filter((v) => v > 0);
  const low = nonZero.length ? Math.min(...nonZero) : 0;
  const peak = nonZero.length ? Math.max(...nonZero) : 0;
  const avg = nonZero.length ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length) : 0;

  // percent change vs first half vs second half
  const half = Math.floor(points.length / 2);
  const firstHalf = points.slice(0, half).reduce((a, b) => a + b.volume, 0);
  const secondHalf = points.slice(half).reduce((a, b) => a + b.volume, 0);
  const percentChange =
    firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

  return { points, stats: { low, avg, peak, percentChange } };
}

// Weekly consistency — returns array of 7 booleans (Mon–Sun) for current week
export function getWeeklyConsistency(sessions: WorkoutSession[]): boolean[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = monday.getTime() + i * 86400000;
    const dayEnd = dayStart + 86400000;
    return sessions.some((s) => s.startTime >= dayStart && s.startTime < dayEnd);
  });
}
