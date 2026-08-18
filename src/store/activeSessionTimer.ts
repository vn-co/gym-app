import type { ActiveSession } from '../types';

export function getElapsedMilliseconds(
  session: ActiveSession,
  now: number,
): number {
  const currentPeriod =
    session.runningSince === null
      ? 0
      : Math.max(0, now - session.runningSince);
  return session.accumulatedMilliseconds + currentPeriod;
}

export function getElapsedSeconds(
  session: ActiveSession,
  now: number,
): number {
  return Math.floor(getElapsedMilliseconds(session, now) / 1000);
}

export function pauseActiveSession(
  session: ActiveSession,
  now: number,
): ActiveSession {
  if (session.runningSince === null) return session;
  return {
    ...session,
    accumulatedMilliseconds: getElapsedMilliseconds(session, now),
    runningSince: null,
  };
}

export function resumeActiveSession(
  session: ActiveSession,
  now: number,
): ActiveSession {
  if (session.runningSince !== null) return session;
  return { ...session, runningSince: now };
}
