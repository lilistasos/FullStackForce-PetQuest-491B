import * as Notifications from "expo-notifications";
import NotificationService from "@/services/NotificationService (2)";

let handlerSet = false;
let listenerSet = false;

/** Call this once at app start to avoid duplicate registration on HMR. */
export function ensureNotificationHandler() {
  if (handlerSet) return;

  // Background/lock screen notifs are handled by OS automatically
  Notifications.setNotificationHandler({
    handleNotification: async () =>
      ({
        // Show notification banner when app is open
        shouldShowAlert: true,

        // Play sound when notification arrives
        shouldPlaySound: true,

        // Update badge count
        shouldSetBadge: true,
      } as Notifications.NotificationBehavior),
  });

  handlerSet = true;
}

/** Set up listener to save notifications to history */
export function setupNotificationListener() {
  if (listenerSet) return;

  const notificationService = NotificationService.getInstance();

  // Listen for notification responses
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { notification } = response;
    const { title, body, data } = notification.request.content;

    await notificationService.addToHistory({
      title: title || "Notification",
      body: body || "",
      taskId: data?.taskId as string,
      category: data?.category as string,
      points: data?.points as number,
    });
  });

  // Also listen for notifications while app is open
  Notifications.addNotificationReceivedListener(async (notification) => {
    const { title, body, data } = notification.request.content;

    await notificationService.addToHistory({
      title: title || "Notification",
      body: body || "",
      taskId: data?.taskId as string,
      category: data?.category as string,
      points: data?.points as number,
    });
  });

  listenerSet = true;
}
