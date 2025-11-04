import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationService from '../services/NotificationService';

const NotificationTest: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const notificationService = NotificationService.getInstance();

  const testNotification = async () => {
    try {
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
        return;
      }

      // Test with a sample task
      const testTask = {
        id: 'test-task-1',
        text: 'Test Task - Math Homework',
        dueDate: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
        category: 'Homework',
        points: 10,
      };

      const notificationId = await notificationService.scheduleTaskNotification(testTask);
      
      if (notificationId) {
        Alert.alert(
          'Test Notification Scheduled',
          `A test notification will appear in 2 minutes for: "${testTask.text}"`,
          [
            { text: 'OK' },
            { 
              text: 'Cancel Notification', 
              onPress: () => notificationService.cancelNotification(notificationId)
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to schedule notification. Check your notification settings.');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Error', 'Failed to schedule test notification.');
    }
  };

  const checkPermissions = async () => {
    try {
      const hasPermission = await notificationService.requestPermissions();
      setIsEnabled(hasPermission);
      
      Alert.alert(
        'Notification Status',
        hasPermission 
          ? 'Notifications are enabled and ready to use!' 
          : 'Notifications are disabled. Please enable them in your device settings.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Permission check error:', error);
      Alert.alert('Error', 'Failed to check notification permissions.');
    }
  };

  const viewScheduledNotifications = async () => {
    try {
      const scheduled = await notificationService.getScheduledNotifications();
      const taskNotifications = scheduled.filter(n => n.content.data?.taskId);
      
      Alert.alert(
        'Scheduled Notifications',
        `You have ${taskNotifications.length} task notifications scheduled.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      Alert.alert('Error', 'Failed to get scheduled notifications.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test</Text>
      <Text style={styles.description}>
        Test the notification system to ensure it's working properly.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={checkPermissions}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#0077B6" />
          <Text style={styles.buttonText}>Check Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testNotification}>
          <Ionicons name="notifications-outline" size={24} color="#0077B6" />
          <Text style={styles.buttonText}>Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={viewScheduledNotifications}>
          <Ionicons name="list-outline" size={24} color="#0077B6" />
          <Text style={styles.buttonText}>View Scheduled</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#0077B6" />
        <Text style={styles.infoText}>
          The test notification will appear in 2 minutes. Make sure your device is not in silent mode.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0077B6',
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default NotificationTest;
