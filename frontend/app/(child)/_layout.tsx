import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ChildLayout() {
  return (
    <Tabs
      initialRouteName="(tabs)/pet"
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#555555",
        tabBarStyle: { backgroundColor: "#52AFDD" },
        headerStyle: { backgroundColor: "#52AFDD" },
        headerTintColor: "#000000ff",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarButton: HapticTab,
        headerTitleAlign: 'center',
        tabBarShowLabel: false,
        headerLeft: () => (
          <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => {}}>
            <Ionicons name="menu" size={24} color="black" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 15 }} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="(tabs)/pet"
        options={{
          title: 'Pet',
          headerTitle: 'Pet',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="pawprint.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/calendar"
        options={{
          title: 'Calendar',
          headerTitle: 'Calendar',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/todo"
        options={{
          title: 'To-Do',
          headerTitle: 'To-Do',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/account"
        options={{
          title: 'Account',
          headerTitle: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(pet-pages)"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
