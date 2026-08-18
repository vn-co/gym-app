import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { ActiveSession } from '../types';
import { getElapsedSeconds } from '../store/activeSessionTimer';

export function useWorkoutTimer(session: ActiveSession | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (session?.runningSince === null || !session) return;

    const refresh = () => setNow(Date.now());
    const interval = setInterval(refresh, 1000);
    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') refresh();
      },
    );

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [session?.sessionId, session?.runningSince]);

  return session ? getElapsedSeconds(session, now) : 0;
}
