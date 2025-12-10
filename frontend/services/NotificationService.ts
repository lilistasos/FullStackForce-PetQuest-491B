import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  frequency: "none" | "1hour" | "5hours" | "1day";
  timeBeforeDue: number; // in minutes
}

export interface TaskNotification {
  id: string;
  taskId: string;
  taskText: string;
  dueDate: string;
  scheduledTime: number;
  category: string;
  points: number;
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  taskId?: string;
  category?: string;
  points?: number;
  read: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private notificationSettings: NotificationSettings = {
    enabled: true,
    frequency: "1hour",
    timeBeforeDue: 60, // 1 hour before due
  };

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === "granted";
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  // Get current notification settings
  getNotificationSettings(): NotificationSettings {
    return { ...this.notificationSettings };
  }

  // Update notification settings
  updateNotificationSettings(settings: Partial<NotificationSettings>): void {
    this.notificationSettings = { ...this.notificationSettings, ...settings };
  }

  // Schedule a notification for a task
  async scheduleTaskNotification(task: {
    id: string;
    text: string;
    dueDate: string;
    category: string;
    points: number;
  }): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission || !this.notificationSettings.enabled) {
        console.log("No permission or notifications disabled");
        return null;
      }

      const dueDate = new Date(task.dueDate);
      const now = new Date();

      // Calculate notification time based on settings
      const notificationTime = new Date(
        dueDate.getTime() - this.notificationSettings.timeBeforeDue * 60 * 1000
      );

      // Don't schedule if the notification time has already passed
      if (notificationTime <= now) {
        console.log("Notification time already passed, not scheduling");
        return null;
      }

      // Calculate seconds until notification should fire
      const secondsUntilNotification = Math.floor(
        (notificationTime.getTime() - now.getTime()) / 1000
      );

      console.log("seconds until notification:", secondsUntilNotification);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📝 Task Reminder",
          body: `Don't forget: ${task.text}`,
          data: {
            taskId: task.id,
            category: task.category,
            points: task.points,
            dueDate: task.dueDate,
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilNotification,
          repeats: false,
        },
      });
      return notificationId;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      return null;
    }
  }

  // Schedule recurring notifications for upcoming tasks
  async scheduleUpcomingTaskNotifications(
    tasks: {
      id: string;
      text: string;
      dueDate: string;
      category: string;
      points: number;
      completed?: boolean;
    }[]
  ): Promise<void> {
    try {
      // Cancel all existing task notifications
      await this.cancelAllTaskNotifications();

      if (!this.notificationSettings.enabled) {
        return;
      }

      const now = new Date();
      const upcomingTasks = tasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate > now && !task.completed;
      });

      // Schedule notifications for each upcoming task
      for (const task of upcomingTasks) {
        await this.scheduleTaskNotification(task);
      }
    } catch (error) {
      console.error("Error scheduling upcoming task notifications:", error);
    }
  }

  // Cancel a specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error("Error canceling notification:", error);
    }
  }

  // Cancel notifications for a specific task
  async cancelTaskNotifications(taskId: string): Promise<void> {
    try {
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const taskNotifications = scheduledNotifications.filter(
        (notification) => notification.content.data?.taskId === taskId
      );

      for (const notification of taskNotifications) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    } catch (error) {
      console.error("Error canceling task notifications:", error);
    }
  }

  // Cancel all task notifications
  async cancelAllTaskNotifications(): Promise<void> {
    try {
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const taskNotifications = scheduledNotifications.filter(
        (notification) => notification.content.data?.taskId
      );

      for (const notification of taskNotifications) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    } catch (error) {
      console.error("Error canceling all task notifications:", error);
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error getting scheduled notifications:", error);
      return [];
    }
  }

  // Handle notification received while app is in foreground
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Handle notification tapped
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Get notification frequency options
  getFrequencyOptions(): Array<{ value: string; label: string }> {
    return [
      { value: "none", label: "None" },
      { value: "1hour", label: "1 hour before" },
      { value: "5hours", label: "5 hours before" },
      { value: "1day", label: "1 day before" },
    ];
  }

  // Convert frequency to minuetes
  getFrequencyInMinutes(frequency: string): number {
    const frequencyMap: { [key: string]: number } = {
      none: 0,
      "1hour": 60,
      "5hours": 300,
      "1day": 1440,
    };
    return frequencyMap[frequency] || 60;
  }

  // Notif history methods
  async addToHistory(
    notification: Omit<NotificationHistoryItem, "id" | "timestamp" | "read">
  ): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const newItem: NotificationHistoryItem = {
        ...notification,
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
      };

      // Add to beginning of array
      history.unshift(newItem);

      // Keep only the last 25 notifications (can change later to liking)
      const trimmedHistory = history.slice(0, 25);

      await AsyncStorage.setItem(
        "notification_history",
        JSON.stringify(trimmedHistory)
      );
    } catch (error) {
      console.error("Error adding notification to history:", error);
    }
  }

  async getNotificationHistory(): Promise<NotificationHistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem("notification_history");
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error("Error getting notification history:", error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const updated = history.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item
      );
      await AsyncStorage.setItem(
        "notification_history",
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async deleteFromHistory(notificationId: string): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const filtered = history.filter((item) => item.id !== notificationId);
      await AsyncStorage.setItem(
        "notification_history",
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error("Error deleting notification from history:", error);
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem("notification_history", JSON.stringify([]));
    } catch (error) {
      console.error("Error clearing notification history:", error);
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const history = await this.getNotificationHistory();
      return history.filter((item) => !item.read).length;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }
}

export default NotificationService;
