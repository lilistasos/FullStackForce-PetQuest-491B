import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { PetProvider } from '@/contexts/PetContext';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/hooks/useAuth';
import { TaskProvider } from '@/contexts/TaskContext';

import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { ensureNotificationHandler } from '../lib/notifications';
ensureNotificationHandler();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      // Android notification channels
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('tasks', {
          name: 'Task Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      // Ask for permission (Android 13+ and iOS)
      if (Device.isDevice) {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      }
    })();

    const sub: Notifications.Subscription =
      Notifications.addNotificationReceivedListener((n) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[NotifLog]', {
            id: n.request.identifier ?? String(Date.now()),
            title: n.request.content.title ?? 'Notification',
            body: n.request.content.body ?? '',
            receivedAt: Date.now(),
          });
        }
      });

    return () => sub.remove();
  }, []);

  return (
    <AuthProvider>
      <CustomThemeProvider>
        <PetProvider>
          <TaskProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(child)" options={{ headerShown: false }} />
                <Stack.Screen name="(parent)" options={{ headerShown: false }} />
                <Stack.Screen name="(indv)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </TaskProvider>
        </PetProvider>
      </CustomThemeProvider>
    </AuthProvider>
  );
}

