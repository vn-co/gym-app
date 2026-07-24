import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '../store/workoutStore';

export function useWorkoutTimer() {
  const session = useWorkoutStore((s) => s.session);
  const tickSecond = useWorkoutStore((s) => s.tickSecond);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (session?.isRunning && !session?.isPaused) {
      intervalRef.current = setInterval(() => {
        tickSecond();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session?.isRunning, session?.isPaused]);
}
