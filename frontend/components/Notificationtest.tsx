import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationService from "../services/NotificationService";

const NotificationTest: React.FC = () => {
  const notificationService = NotificationService.getInstance();

  const testNotification = async () => {
    try {
      const hasPermission = await notificationService.requestPermissions();

      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings."
        );
        return;
      }

      // Cancel any previous test notifications
      const scheduled = await notificationService.getScheduledNotifications();
      const testNotifications = scheduled.filter((n) => {
        const taskId = n.content.data?.taskId;
        return typeof taskId === "string" && taskId.startsWith("test-task-");
      });
      for (const notification of testNotifications) {
        await notificationService.cancelNotification(notification.identifier);
        console.log(
          "Cancelled old test notification:",
          notification.identifier
        );
      }

      // Get current settings to get due date
      const settings = notificationService.getNotificationSettings();

      const notificationDelaySeconds = 10;
      const taskDueSeconds =
        settings.timeBeforeDue * 60 + notificationDelaySeconds;

      const now = new Date();
      const dueDate = new Date(now.getTime() + taskDueSeconds * 1000);

      // Test with a sample task
      const uniqueId = `test-task-${Date.now()}`;
      const testTask = {
        id: uniqueId,
        text: "Test - Math homework",
        dueDate: dueDate.toISOString(),
        category: "Homework",
        points: 10,
      };

      const notificationId = await notificationService.scheduleTaskNotification(
        testTask
      );

      if (notificationId) {
        Alert.alert(
          "Test Notification Scheduled",
          `Notification will appear in ${notificationDelaySeconds} seconds.\n\nTask: "${testTask.text}"`,
          [{ text: "OK" }]
        );
      } else {
        console.log("Failed to schedule notification");
        Alert.alert(
          "Error",
          "Failed to schedule notification. Check console logs."
        );
      }
    } catch (error) {
      console.error("Test notification error:", error);
      Alert.alert("Error", `Failed: ${error}`);
    }
  };

  const clearAllTasksAndNotifications = async () => {
    Alert.alert(
      "Clear All Tasks & Notifications",
      "This will remove all saved tasks and notifications.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all notifications
              await notificationService.cancelAllTaskNotifications();

              // Clear saved tasks from AsyncStorage
              await AsyncStorage.removeItem("tasks");

              console.log("Cleared all tasks and notifications");
              Alert.alert(
                "Success",
                "All tasks and notifications have been cleared. Reload the app to see changes."
              );
            } catch (error) {
              console.error("Error clearing tasks and notifications:", error);
              Alert.alert("Error", "Failed to clear tasks and notifications.");
            }
          },
        },
      ]
    );
  };

  const testRealTask = async () => {
    try {
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert("Permission Required", "Please enable notifications");
        return;
      }

      // Create a task due in 61 minutes
      const now = new Date();
      const dueDate = new Date(now.getTime() + 61 * 60 * 1000);

      const realTask = {
        id: `real-task-${Date.now()}`,
        text: `Science Project (test)`,
        dueDate: dueDate.toISOString(),
        category: "Homework",
        points: 20,
      };

      const notificationId = await notificationService.scheduleTaskNotification(
        realTask
      );

      if (notificationId) {
        Alert.alert(
          "Real Task Created",
          `Task: "${
            realTask.text
          }"\nDue: ${dueDate.toLocaleTimeString()}\n\nYou should get a notification in ~ a minute (1 hour before the due time)`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", "Failed to schedule notif");
      }
    } catch (error) {
      console.error("Task test failed:", error);
      Alert.alert("Error", `Failed: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: "#fff3cd", borderColor: "#ffc107" },
          ]}
          onPress={testRealTask}
        >
          <Ionicons name="time-outline" size={24} color="#ff8c00" />
          <Text style={styles.buttonText}>Real Task Test (1 min)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testNotification}>
          <Ionicons name="notifications-outline" size={24} color="#0077B6" />
          <Text style={styles.buttonText}>Test Notification (10 sec)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: "#ffcccc", borderColor: "#cc0000" },
          ]}
          onPress={clearAllTasksAndNotifications}
        >
          <Ionicons name="nuclear-outline" size={24} color="#cc0000" />
          <Text style={styles.buttonText}>Clear Tasks & Notifications</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  buttonText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e8f4fd",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#0077B6",
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default NotificationTest;
