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
      initialRouteName="calendar"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#FFFFFF", 
        tabBarInactiveTintColor: "#000000ff", 
        tabBarStyle: {
          backgroundColor: "#dd4f4fff",
        },
        headerStyle: {
          backgroundColor: "#dd4f4fff", 
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
        name="post"
        options={{
          title: 'Post',
          headerTitle: 'Post',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.app.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Profile',
          headerTitle: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="accessibility" color={color} />,
        }}
      />
    </Tabs>
  );
}