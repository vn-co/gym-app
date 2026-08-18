export function getMotionDuration(
  reduceMotion: boolean,
  duration: number,
): number {
  return reduceMotion ? 0 : duration;
}

export function getProgressPercentage(
  completed: number,
  total: number,
): number {
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}
