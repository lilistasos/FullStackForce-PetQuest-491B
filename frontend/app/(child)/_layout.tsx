import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import HamburgerMenu from '@/components/HamburgerMenu';
import { useTheme } from '@/contexts/ThemeContext';

export default function ChildLayout() {
  const [headerTitle, setHeaderTitle] = useState('Pet');
  const [menuVisible, setMenuVisible] = useState(false);
  const { colors } = useTheme();

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
        if (activeTabRoute.state && activeTabRoute.state.routes && activeTabRoute.state.index !== undefined) {
          const accountRoute = activeTabRoute.state.routes[activeTabRoute.state.index];
          const accountPageName = accountRoute?.name || 'index';
          
          if (accountPageName === 'edit-profile') setHeaderTitle('Edit Profile');
          else if (accountPageName === 'notifications') setHeaderTitle('Notification Preferences');
          else if (accountPageName === 'settings') setHeaderTitle('Settings');
          else if (accountPageName === 'account-details') setHeaderTitle('Account Details');
          else if (accountPageName === 'theme') setHeaderTitle('Theme');
          else if (accountPageName === 'parental-controls') setHeaderTitle('Parental Controls');
          else if (accountPageName === 'contact') setHeaderTitle('Contact');
          else setHeaderTitle('Account');
        } else {
          setHeaderTitle('Account');
        }
      }
    }
  }, [navigationState]);

  return (
    <HamburgerMenu 
      visible={menuVisible} 
      onClose={() => setMenuVisible(false)}
      backgroundColor={colors.primary}
    >
      <Tabs
      initialRouteName="(tabs)/pet"
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#555555",
        tabBarStyle: { backgroundColor: colors.primary },
        headerStyle: { backgroundColor: colors.primary },
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
    </HamburgerMenu>
  );
}
