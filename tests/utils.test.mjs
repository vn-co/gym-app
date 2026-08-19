import assert from 'node:assert/strict';
import test from 'node:test';
import * as utils from '../src/utils/index.ts';

function sessionAt(date, totalVolume) {
  return {
    id: `session_${date.getTime()}`,
    name: 'Test workout',
    startTime: date.getTime(),
    durationSeconds: 60,
    exercises: [],
    totalVolume,
    totalSets: 1,
  };
}

function daysAgo(days, totalVolume) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return sessionAt(date, totalVolume);
}

test('includes every day in the one-year weekly buckets', () => {
  const { points } = utils.buildProgressData([daysAgo(1, 123)], '1y');
  assert.equal(
    points.reduce((sum, point) => sum + point.volume, 0),
    123,
  );
});

test('compares equal windows for seven-day change', () => {
  const sessions = [
    daysAgo(6, 100),
    daysAgo(3, 100),
    daysAgo(0, 200),
  ];
  assert.equal(utils.buildProgressData(sessions, '7d').stats.percentChange, 100);
});

test('parses locale-friendly non-negative numeric input', () => {
  assert.equal(typeof utils.parseNumericInput, 'function');
  assert.equal(utils.parseNumericInput('62,5'), 62.5);
  assert.equal(utils.parseNumericInput('12abc'), 0);
  assert.equal(utils.parseNumericInput('-5'), 0);
  assert.equal(utils.parseNumericInput('8.9', true), 8);
});

test('moveItem reorders without mutating the saved sequence', () => {
  const original = ['bench', 'row', 'press'];

  assert.deepEqual(utils.moveItem(original, 2, 0), [
    'press',
    'bench',
    'row',
  ]);
  assert.deepEqual(original, ['bench', 'row', 'press']);
  assert.equal(utils.moveItem(original, 0, -1), original);
});

test('formats completion metrics consistently', () => {
  assert.equal(utils.formatDuration(59), '00:59');
  assert.equal(utils.formatDuration(3_661), '01:01:01');
  assert.equal(utils.formatTimerDisplay(3_661), '01:01:01');
  assert.equal(utils.formatWeight(1_250), '1.3k');
  assert.equal(utils.formatWeight(Number.NaN), '0');
});
