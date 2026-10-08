import React from 'react';
import { Platform, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function icon(outline: IconName, filled: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} size={22} color={color as string} />;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          // Balandlik berilmaydi: safe-area (iPhone home indicator, Android gesture bar) avtomatik hisoblanadi
          ...(Platform.OS === 'android' ? { elevation: 8 } : null),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: -0.2 },
        tabBarAllowFontScaling: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: Colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bosh sahifa', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="calendar" options={{ title: 'Kalendar', tabBarIcon: icon('calendar-outline', 'calendar') }} />
      <Tabs.Screen
        name="bookings"
        options={{ title: 'Bronlar', tabBarIcon: icon('document-text-outline', 'document-text') }}
      />
      <Tabs.Screen name="clients" options={{ title: 'Mijozlar', tabBarIcon: icon('people-outline', 'people') }} />
      <Tabs.Screen name="menu" options={{ title: 'Menyu', tabBarIcon: icon('restaurant-outline', 'restaurant') }} />
      <Tabs.Screen name="more" options={{ title: 'Boshqa', tabBarIcon: icon('grid-outline', 'grid') }} />
    </Tabs>
  );
}
