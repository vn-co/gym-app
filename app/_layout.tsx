import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/tokens';
import { WorkoutPersistenceGate } from '../src/components/WorkoutPersistenceGate';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <WorkoutPersistenceGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </WorkoutPersistenceGate>
    </SafeAreaProvider>
  );
}
