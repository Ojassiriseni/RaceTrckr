import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { theme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#070D14',
          borderTopColor: '#1B2734',
          borderTopWidth: 1,
          height: 74,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarButton: (props: any) => <HapticTab {...props} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={26} name="house.fill" color={focused ? theme.colors.primary : (typeof color === 'string' ? color : theme.colors.muted)} />
          )
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: 'Runs',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={26} name="chart.bar.fill" color={focused ? theme.colors.primary : (typeof color === 'string' ? color : theme.colors.muted)} />
          )
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={26} name="flag.checkered" color={focused ? theme.colors.primary : (typeof color === 'string' ? color : theme.colors.muted)} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={26} name="person.fill" color={focused ? theme.colors.primary : (typeof color === 'string' ? color : theme.colors.muted)} />
          )
        }}
      />
    </Tabs>
  );
}
