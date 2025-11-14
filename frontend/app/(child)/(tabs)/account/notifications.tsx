import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import NotificationService from "@/services/NotificationService";
import NotificationTest from "@/components/Notificationtest";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const notificationService = NotificationService.getInstance();

  const [notifications, setNotifications] = useState({
    newTask: true,
    taskCompletion: true,
    taskMissed: true,
    taskReminder: true,
    petNotifications: true,
    petLevelUp: true,
    taskRewards: true,
  });

  const [notificationSettings, setNotificationSettings] = useState(
    notificationService.getNotificationSettings()
  );

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    // If toggling task reminder, update the notification service
    if (key === "taskReminder") {
      const newEnabled = !notifications[key];
      notificationService.updateNotificationSettings({ enabled: newEnabled });
      setNotificationSettings(notificationService.getNotificationSettings());
    }
  };

  const handleFrequencyChange = (frequency: "1hour" | "5hours" | "1day") => {
    const timeBeforeDue = notificationService.getFrequencyInMinutes(frequency);
    notificationService.updateNotificationSettings({
      frequency,
      timeBeforeDue,
    });
    setNotificationSettings(notificationService.getNotificationSettings());
  };

  const notificationItems = [
    { key: "newTask" as keyof typeof notifications, label: "New Task" },
    {
      key: "taskCompletion" as keyof typeof notifications,
      label: "Task Completion",
    },
    {
      key: "taskMissed" as keyof typeof notifications,
      label: "Task Missed/Overdue",
    },
    {
      key: "taskReminder" as keyof typeof notifications,
      label: "Task Reminder",
    },
    {
      key: "petNotifications" as keyof typeof notifications,
      label: "Pet Notifications",
    },
    { key: "petLevelUp" as keyof typeof notifications, label: "Pet Level Up" },
    { key: "taskRewards" as keyof typeof notifications, label: "Task Rewards" },
  ];

  const frequencyOptions = notificationService.getFrequencyOptions();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Test Component */}
        <NotificationTest />

        {/* Reminder Frequency Section */}
        <View
          style={[styles.sectionContainer, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reminder Frequency
          </Text>
          <Text style={[styles.sectionDescription, { color: "#666" }]}>
            Choose when to be notified before tasks are due
          </Text>

          {frequencyOptions.map((option, index) => (
            <View key={option.value}>
              <TouchableOpacity
                style={styles.frequencyRow}
                onPress={() =>
                  handleFrequencyChange(
                    option.value as "1hour" | "5hours" | "1day"
                  )
                }
              >
                <Text style={[styles.frequencyLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
                {notificationSettings.frequency === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                )}
              </TouchableOpacity>
              {index < frequencyOptions.length - 1 && (
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Notification Settings */}
        <View
          style={[styles.sectionContainer, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Notification Types
          </Text>
          {notificationItems.map((item, index) => (
            <View key={item.key}>
              <View style={styles.notificationRow}>
                <Text
                  style={[styles.notificationLabel, { color: colors.text }]}
                >
                  {item.label}
                </Text>
                <Switch
                  value={notifications[item.key]}
                  onValueChange={() => handleToggle(item.key)}
                  trackColor={{ false: "#767577", true: "#4ECDC4" }}
                  thumbColor={notifications[item.key] ? "#ffffff" : "#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                />
              </View>
              {index < notificationItems.length - 1 && (
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  frequencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  notificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  notificationLabel: {
    fontSize: 18,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginLeft: 0,
    marginRight: 0,
    marginVertical: 4,
  },
});
