import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  
  const [notifications, setNotifications] = useState({
    newTask: true,
    taskCompletion: true,
    taskMissed: true,
    taskReminder: true,
    petNotifications: true,
    petLevelUp: true,
    taskRewards: true,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const notificationItems = [
    { key: 'newTask' as keyof typeof notifications, label: 'New Task' },
    { key: 'taskCompletion' as keyof typeof notifications, label: 'Task Completion' },
    { key: 'taskMissed' as keyof typeof notifications, label: 'Task Missed/Overdue' },
    { key: 'taskReminder' as keyof typeof notifications, label: 'Task Reminder' },
    { key: 'petNotifications' as keyof typeof notifications, label: 'Pet Notifications' },
    { key: 'petLevelUp' as keyof typeof notifications, label: 'Pet Level Up' },
    { key: 'taskRewards' as keyof typeof notifications, label: 'Task Rewards' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
          {notificationItems.map((item, index) => (
            <View key={item.key}>
              <View style={styles.notificationRow}>
                <Text style={[styles.notificationLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
                <Switch
                  value={notifications[item.key]}
                  onValueChange={() => handleToggle(item.key)}
                  trackColor={{ false: '#767577', true: '#4ECDC4' }}
                  thumbColor={notifications[item.key] ? '#ffffff' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                />
              </View>
              {index < notificationItems.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
    overflow: 'hidden',
    marginBottom: 20,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  notificationLabel: {
    fontSize: 18,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 16,
    marginRight: 16,
  },
});

