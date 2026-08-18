import assert from 'node:assert/strict';
import test from 'node:test';
import { TAB_ITEMS } from '../src/constants/navigation.ts';
import { MotionDuration } from '../src/constants/tokens.ts';
import {
  getMotionDuration,
  getProgressPercentage,
} from '../src/utils/uiPresentation.ts';

test('defines the five stable labeled tabs in display order', () => {
  assert.deepEqual(
    TAB_ITEMS.map(({ route, label, icon }) => ({ route, label, icon })),
    [
      { route: 'index', label: 'Home', icon: 'home' },
      { route: 'workout', label: 'Workout', icon: 'workout' },
      { route: 'routines', label: 'Routines', icon: 'routines' },
      { route: 'progress', label: 'Progress', icon: 'progress' },
      { route: 'library', label: 'Library', icon: 'library' },
    ],
  );
});

test('clamps workout progress to a valid percentage', () => {
  assert.equal(getProgressPercentage(0, 0), 0);
  assert.equal(getProgressPercentage(2, 3), 67);
  assert.equal(getProgressPercentage(12, 9), 100);
  assert.equal(getProgressPercentage(-1, 4), 0);
  assert.equal(getProgressPercentage(Number.NaN, 4), 0);
});

test('disables motion durations when Reduce Motion is enabled', () => {
  assert.equal(MotionDuration.fast, 160);
  assert.equal(MotionDuration.standard, 220);
  assert.equal(getMotionDuration(false, MotionDuration.fast), 160);
  assert.equal(getMotionDuration(true, MotionDuration.standard), 0);
});
