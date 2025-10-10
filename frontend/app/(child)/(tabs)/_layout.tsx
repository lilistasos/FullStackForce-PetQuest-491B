import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="pet"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#FFFFFF", 
        tabBarInactiveTintColor: "#555555", 
        tabBarStyle: {
          backgroundColor: "#52AFDD",
        },
        headerStyle: {
          backgroundColor: "#52AFDD", 
        },
        headerTintColor: "#000000ff", 
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarButton: HapticTab,
        headerTitleAlign: 'center',
        tabBarShowLabel: false,
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 15 }}
            onPress={() => {
              // TODO
            }}
          >
            <Ionicons name="menu" size={24} color="black" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={() => {
              // TODO
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tabs.Screen
        name="pet"
        options={{
          title: 'Pet',
          headerTitle: 'Pet',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="pawprint.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerTitle: 'Calendar',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: 'To-Do',
          headerTitle: 'To-Do',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          headerTitle: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}