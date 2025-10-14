import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import HamburgerMenu from '@/components/HamburgerMenu';

export default function ChildLayout() {
  const [headerTitle, setHeaderTitle] = useState('Pet');
  const [menuVisible, setMenuVisible] = useState(false);

  const navigationState = useNavigationState(state => state);

  useEffect(() => {
    if (navigationState && navigationState.index !== undefined) {
      const currentRoute = navigationState.routes[navigationState.index];
      
      if (!currentRoute || !currentRoute.state || !currentRoute.state.routes) return;
      
      const tabState = currentRoute.state;
      const tabIndex = tabState.index;
      if (tabIndex === undefined) return;
      
      const activeTabRoute = tabState.routes[tabIndex];
      
      if (!activeTabRoute) return;
      
      const tabName = activeTabRoute.name || '';
      
      if (tabName === '(tabs)/pet') {
        if (activeTabRoute.state && activeTabRoute.state.routes && activeTabRoute.state.index !== undefined) {
          const petRoute = activeTabRoute.state.routes[activeTabRoute.state.index];
          const petPageName = petRoute?.name || 'index';
          
          if (petPageName === 'customize') setHeaderTitle('Customize');
          else if (petPageName === 'shop') setHeaderTitle('Shop');
          else if (petPageName === 'collection') setHeaderTitle('Collection');
          else setHeaderTitle('Pet');
        } else {
          setHeaderTitle('Pet');
        }
      } else if (tabName === '(tabs)/calendar') {
        setHeaderTitle('Calendar');
      } else if (tabName === '(tabs)/todo') {
        setHeaderTitle('To-Do');
      } else if (tabName === '(tabs)/account') {
        setHeaderTitle('Account');
      }
    }
  }, [navigationState]);

  return (
    <>
      <HamburgerMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)}
        backgroundColor="#52AFDD"
      />
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
        headerTitle: headerTitle,
        headerLeft: () => (
          <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => setMenuVisible(true)}>
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
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="pawprint.fill" color={color} />,
        }}
      />
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
        name="(tabs)/account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
    </>
  );
}
