import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTabIcon } from '../../src/components/navigation/AnimatedTabIcon';
import { TAB_ITEMS } from '../../src/constants/navigation';
import {
  Colors,
  FontSize,
  FontWeight,
  TabBarMetrics,
} from '../../src/constants/tokens';
import { useWorkoutStore } from '../../src/store/workoutStore';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const activeSession = useWorkoutStore((state) => state.session);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarAccessibilityLabel: 'Main navigation',
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.blurTint]} />
          </View>
        ),
        tabBarStyle: {
          position: 'absolute',
          left: TabBarMetrics.horizontalInset,
          right: TabBarMetrics.horizontalInset,
          bottom: Math.max(insets.bottom, TabBarMetrics.bottomGap),
          height: TabBarMetrics.height,
          paddingTop: 5,
          paddingBottom: 4,
          borderRadius: 26,
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: Colors.borderStrong,
          backgroundColor: 'transparent',
          overflow: 'hidden',
        },
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIcon,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {TAB_ITEMS.map((item) => (
        <Tabs.Screen
          key={item.route}
          name={item.route}
          options={{
            title: item.label,
            tabBarAccessibilityLabel: item.label,
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon
                icon={item.icon}
                focused={focused}
                showBadge={item.route === 'workout' && Boolean(activeSession)}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  blurTint: {
    backgroundColor: '#0D100EE8',
  },
  tabItem: {
    minHeight: 44,
    paddingVertical: 2,
  },
  tabIcon: {
    marginTop: 1,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: -2,
  },
});
