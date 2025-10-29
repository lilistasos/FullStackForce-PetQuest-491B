import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  frequency: 'none' | '1hour' | '2hours' | '4hours' | '6hours' | '12hours' | '1day';
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

class NotificationService {
  private static instance: NotificationService;
  private notificationSettings: NotificationSettings = {
    enabled: true,
    frequency: '2hours',
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
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
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
        return null;
      }

      const dueDate = new Date(task.dueDate);
      const now = new Date();
      
      // Calculate notification time based on settings
      const notificationTime = new Date(dueDate.getTime() - (this.notificationSettings.timeBeforeDue * 60 * 1000));
      
      // Don't schedule if the notification time has already passed
      if (notificationTime <= now) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📝 Task Reminder',
          body: `Don't forget: ${task.text}`,
          data: {
            taskId: task.id,
            category: task.category,
            points: task.points,
            dueDate: task.dueDate,
          },
          sound: true,
        },
        // Cast the trigger to match the expected NotificationTriggerInput type
        trigger: notificationTime as any,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Schedule recurring notifications for upcoming tasks
  async scheduleUpcomingTaskNotifications(tasks: Array<{
    id: string;
    text: string;
    dueDate: string;
    category: string;
    points: number;
    completed?: boolean;
  }>): Promise<void> {
    try {
      // Cancel all existing task notifications
      await this.cancelAllTaskNotifications();

      if (!this.notificationSettings.enabled || this.notificationSettings.frequency === 'none') {
        return;
      }

      const now = new Date();
      const upcomingTasks = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate > now && !task.completed;
      });

      // Schedule notifications for each upcoming task
      for (const task of upcomingTasks) {
        await this.scheduleTaskNotification(task);
      }
    } catch (error) {
      console.error('Error scheduling upcoming task notifications:', error);
    }
  }

  // Cancel a specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Cancel all task notifications
  async cancelAllTaskNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const taskNotifications = scheduledNotifications.filter(notification => 
        notification.content.data?.taskId
      );
      
      for (const notification of taskNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Error canceling all task notifications:', error);
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Handle notification received while app is in foreground
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Handle notification tapped
  addNotificationResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Get notification frequency options
  getFrequencyOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'none', label: 'None' },
      { value: '1hour', label: '1 hour before' },
      { value: '2hours', label: '2 hours before' },
      { value: '4hours', label: '4 hours before' },
      { value: '6hours', label: '6 hours before' },
      { value: '12hours', label: '12 hours before' },
      { value: '1day', label: '1 day before' },
    ];
  }

  // Convert frequency to minutes
  getFrequencyInMinutes(frequency: string): number {
    const frequencyMap: { [key: string]: number } = {
      'none': 0,
      '1hour': 60,
      '2hours': 120,
      '4hours': 240,
      '6hours': 360,
      '12hours': 720,
      '1day': 1440,
    };
    return frequencyMap[frequency] || 60;
  }
}

export default NotificationService;
