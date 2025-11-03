import * as Notifications from 'expo-notifications';

let handlerSet = false;

/** Call this once at app start to avoid duplicate registration on HMR. */
export function ensureNotificationHandler() {
  if (handlerSet) return;

  Notifications.setNotificationHandler({
    handleNotification: async () =>
      ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      } as Notifications.NotificationBehavior), // <-- TS-safe
  });

  handlerSet = true;
}


