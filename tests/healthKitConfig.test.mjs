import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('declares the HealthKit entitlement and honest permission copy', async () => {
  const app = JSON.parse(
    await readFile(new URL('../app.json', import.meta.url), 'utf8'),
  );
  const ios = app.expo.ios;

  assert.equal(ios.entitlements['com.apple.developer.healthkit'], true);
  assert.match(ios.infoPlist.NSHealthShareUsageDescription, /activity|heart/i);
  assert.match(ios.infoPlist.NSHealthUpdateUsageDescription, /workout/i);
});

test('registers the local Apple module', async () => {
  const config = JSON.parse(
    await readFile(
      new URL(
        '../modules/healthkit-workout/expo-module.config.json',
        import.meta.url,
      ),
      'utf8',
    ),
  );

  assert.deepEqual(config.platforms, ['apple']);
  assert.deepEqual(config.apple.modules, ['HealthKitWorkoutModule']);
});
