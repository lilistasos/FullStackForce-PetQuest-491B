import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import CalendarScreen from './(tabs)/calendar';
import TodoScreen from './(tabs)/todo';
import PostScreen from './(tabs)/post';
import PetScreen from './(tabs)/pet';
import AccountScreen from './(tabs)/account';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
          initialRouteName="Calendar"
          screenOptions={({ route }) => ({
            tabBarActiveTintColor: "#FFFFFF", 
            tabBarInactiveTintColor: "#000000ff", 
            tabBarStyle: {
          backgroundColor: "#7B4FDD",
        },
    
          headerStyle: {
          backgroundColor: "#7B4FDD", 
        },
        headerTintColor: "#000000ff", 
        headerTitleStyle: {
          fontWeight: "bold",
        },
    
            tabBarButton: HapticTab,
            headerTitleAlign: 'center',
            headerTitle: route.name,
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
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: ' ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tab.Screen
        name="To-Do"
        component={TodoScreen}
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
        name="Profile"
        component={AccountScreen} 
        options={{
          title: ' ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="accessibility" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
