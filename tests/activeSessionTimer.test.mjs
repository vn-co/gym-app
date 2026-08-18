import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getElapsedMilliseconds,
  getElapsedSeconds,
  pauseActiveSession,
  resumeActiveSession,
} from '../src/store/activeSessionTimer.ts';

const running = {
  sessionId: 'session_1',
  workoutName: 'Push',
  startTime: 1_000,
  accumulatedMilliseconds: 2_500,
  runningSince: 5_000,
  exercises: [],
};

test('derives running time from timestamps', () => {
  assert.equal(getElapsedMilliseconds(running, 8_500), 6_000);
  assert.equal(getElapsedSeconds(running, 8_500), 6);
});

test('pause and resume preserve exact accumulated time', () => {
  const paused = pauseActiveSession(running, 8_500);
  assert.equal(paused.accumulatedMilliseconds, 6_000);
  assert.equal(paused.runningSince, null);
  assert.equal(getElapsedMilliseconds(paused, 20_000), 6_000);

  const resumed = resumeActiveSession(paused, 20_000);
  assert.equal(resumed.accumulatedMilliseconds, 6_000);
  assert.equal(resumed.runningSince, 20_000);
  assert.equal(getElapsedMilliseconds(resumed, 21_250), 7_250);
});

test('backward clock movement never creates negative duration', () => {
  assert.equal(getElapsedMilliseconds(running, 4_000), 2_500);
});
