import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ParentLayout() {
  const [headerTitle, setHeaderTitle] = useState('Calendar');

  const navigationState = useNavigationState(state => state);

  useEffect(() => {
    if (navigationState) {
      const currentRoute = navigationState.routes[navigationState.index];
      
      const getDeepestRouteName = (route: any): string => {
        if (route.state && route.state.routes) {
          const nestedRoute = route.state.routes[route.state.index];
          return getDeepestRouteName(nestedRoute);
        }
        return route.name;
      };

      const deepestRouteName = getDeepestRouteName(currentRoute);
      
      const routeMap: { [key: string]: string } = {
        'calendar': 'Calendar',
        'post': 'Post',
        'todo': 'To-Do',
        'account': 'Account',
        'notifications': 'Notifications',
      };
      
      setHeaderTitle(routeMap[deepestRouteName] || 'Calendar');
    }
  }, [navigationState]);

  return (
    <Tabs
      initialRouteName="(tabs)/calendar"
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#000000ff",
        tabBarStyle: { backgroundColor: "#dd4f4fff" },
        headerStyle: { backgroundColor: "#dd4f4fff" },
        headerTintColor: "#000000ff",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarButton: HapticTab,
        headerTitleAlign: 'center',
        tabBarShowLabel: false,
        headerTitle: headerTitle,
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
        name="(tabs)/calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/todo"
        options={{
          title: 'To-Do',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/post"
        options={{
          title: 'Post',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
