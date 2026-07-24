import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../../src/constants/tokens';
import { useWorkoutStore } from '../../src/store/workoutStore';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  const activeSession = useWorkoutStore((s) => s.session);
  const showDot = label === 'Workout' && !!activeSession;

  return (
    <View style={styles.iconWrapper}>
      <View>
        <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
        {showDot && <View style={styles.activeDot} />}
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💪" label="Workout" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Routines" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" label="Progress" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗂️" label="Library" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 22,
    opacity: 0.45,
  },
  emojiActive: {
    opacity: 1,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
});
