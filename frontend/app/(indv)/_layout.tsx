import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Import your screen components
import CalendarScreen from './calendar';
import TodoScreen from './todo';
import PostScreen from './post';
import PetScreen from './pet';
import AccountScreen from './account';

// Create the bottom tab navigator using React Navigation's createBottomTabNavigator
const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: ' ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tab.Screen
        name="Todo"
        component={TodoScreen} // Using ExploreScreen as placeholder
        options={{
          title: '',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{
          title: ' ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.app.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Pet"
        component={PetScreen}
        options={{
          title: ' ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="pawprint.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Heart"
        component={AccountScreen} 
        options={{
          title: ' ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="accessibility" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
