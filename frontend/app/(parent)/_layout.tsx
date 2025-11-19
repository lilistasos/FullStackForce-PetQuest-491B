import React, { useState, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import HamburgerMenu from '@/components/HamburgerMenu';
import { useTheme } from '@/contexts/ThemeContext';

// Function to calculate luminance and determine text color
const getContrastColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.4 ? '#000000' : '#FFFFFF';
};

export default function ParentLayout() {
  const [headerTitle, setHeaderTitle] = useState('Calendar');
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSubPage, setIsSubPage] = useState(false);
  const { colors } = useTheme();
  const headerTextColor = getContrastColor(colors.primary);
  const router = useRouter();

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
      
      if (tabName === '(tabs)/calendar') {
        setHeaderTitle('Calendar');
      } else if (tabName === '(tabs)/todo') {
        setHeaderTitle('To-Do');
      } else if (tabName === '(tabs)/post') {
        setHeaderTitle('Post');
      } else if (tabName === '(tabs)/account') {
        if (activeTabRoute.state && activeTabRoute.state.routes && activeTabRoute.state.index !== undefined) {
          const accountRoute = activeTabRoute.state.routes[activeTabRoute.state.index];
          const accountPageName = accountRoute?.name || 'index';
          
          // Check if we're on a sub-page (not index)
          setIsSubPage(accountPageName !== 'index');
          
          if (accountPageName === 'edit-profile') setHeaderTitle('Edit Profile');
          else if (accountPageName === 'notifications') setHeaderTitle('Notification Preferences');
          else if (accountPageName === 'settings') setHeaderTitle('Settings');
          else if (accountPageName === 'account-details') setHeaderTitle('Account Details');
          else if (accountPageName === 'theme') setHeaderTitle('Theme');
          else if (accountPageName === 'help-center') setHeaderTitle('Help Center');
          else if (accountPageName === 'contact') setHeaderTitle('Contact');
          else if (accountPageName === 'feedback') setHeaderTitle('Feedback');
          else if (accountPageName === 'subscription') setHeaderTitle('Subscription');
          else if (accountPageName === 'parent-child-settings') setHeaderTitle('Parent-Child Settings');
          else if (accountPageName === 'preferences') setHeaderTitle('Preferences');
          else {
            setHeaderTitle('Account');
            setIsSubPage(false);
          }
        } else {
          setHeaderTitle('Account');
          setIsSubPage(false);
        }
      } else {
        setIsSubPage(false);
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
        initialRouteName="(tabs)/calendar"
        screenOptions={{
          tabBarActiveTintColor: headerTextColor,
          tabBarInactiveTintColor: "#555555",
          tabBarStyle: { backgroundColor: colors.primary },
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: headerTextColor,
          headerTitleStyle: { fontWeight: "bold", color: headerTextColor },
          tabBarButton: HapticTab,
          headerTitleAlign: 'center',
          tabBarShowLabel: false,
          headerTitle: headerTitle,
          headerLeft: () => {
            if (isSubPage) {
              return (
                <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={24} color={headerTextColor} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => setMenuVisible(true)}>
                <Ionicons name="menu" size={24} color={headerTextColor} />
              </TouchableOpacity>
            );
          },
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 15 }} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={24} color={headerTextColor} />
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
    </HamburgerMenu>
  );
}