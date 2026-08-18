import type { HealthWorkoutState } from './types';

export const getHealthProofControls = (
  state: HealthWorkoutState,
) => ({
  canStart:
    state === 'idle' ||
    state === 'running' ||
    state === 'ended' ||
    state === 'failed',
  canPause: state === 'running' || state === 'paused',
  canResume: state === 'running' || state === 'paused',
  canFinish: state === 'running' || state === 'paused',
  canDiscard: state !== 'idle' && state !== 'ending',
});
