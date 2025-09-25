import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Import your screen components
import HomeScreen from './index';
import ExploreScreen from './explore';

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
        component={HomeScreen} // Using HomeScreen as placeholder
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tab.Screen
        name="Todo"
        component={ExploreScreen} // Using ExploreScreen as placeholder
        options={{
          title: 'Todo',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tab.Screen
        name="Add"
        component={HomeScreen} // Using HomeScreen as placeholder
        options={{
          title: 'Add',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus" color={color} />,
        }}
      />
      <Tab.Screen
        name="Heart"
        component={ExploreScreen} // Using ExploreScreen as placeholder
        options={{
          title: 'Pets',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={HomeScreen} // Using HomeScreen as placeholder
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear.fill" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
