export function getGoalProgress(
  value: number | null,
  goal: number | null,
): number | null {
  if (value == null || goal == null || goal <= 0) return null;
  return Math.min(Math.max(value / goal, 0), 1);
}

export function formatActivityValue(
  value: number | null,
  suffix: string,
): string {
  if (value == null) return 'Unavailable';
  return `${Math.round(value).toLocaleString()} ${suffix}`;
}

export function formatCompactActivityValue(value: number | null): string {
  if (value == null) return '—';
  const rounded = Math.round(value);
  if (rounded >= 10_000) return `${Math.round(rounded / 1000)}k`;
  return rounded.toLocaleString();
}
