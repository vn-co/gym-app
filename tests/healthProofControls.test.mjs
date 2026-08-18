import assert from 'node:assert/strict';
import test from 'node:test';
import { getHealthProofControls } from '../src/health/healthProofControls.ts';

test('keeps idempotent workout proof commands callable', () => {
  assert.deepEqual(getHealthProofControls('idle'), {
    canStart: true,
    canPause: false,
    canResume: false,
    canFinish: false,
    canDiscard: false,
  });
  assert.deepEqual(getHealthProofControls('running'), {
    canStart: true,
    canPause: true,
    canResume: true,
    canFinish: true,
    canDiscard: true,
  });
  assert.deepEqual(getHealthProofControls('paused'), {
    canStart: false,
    canPause: true,
    canResume: true,
    canFinish: true,
    canDiscard: true,
  });
  assert.deepEqual(getHealthProofControls('ending'), {
    canStart: false,
    canPause: false,
    canResume: false,
    canFinish: false,
    canDiscard: false,
  });
});
