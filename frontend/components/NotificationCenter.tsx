import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import NotificationService from '@/services/NotificationService';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data: any;
  date: Date;
  isRead: boolean;
}

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<Notifications.NotificationRequest[]>([]);
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    try {
      // Load scheduled notifications
      const scheduled = await notificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);

      // For now, we'll create some mock notifications
      // In a real app, you'd store these in a database
      const mockNotifications: NotificationItem[] = [
        {
          id: '1',
          title: '📝 Task Reminder',
          body: "Don't forget: Math worksheet",
          data: { taskId: '6', category: 'Homework', points: 10 },
          date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isRead: false,
        },
        {
          id: '2',
          title: '📝 Task Reminder',
          body: "Don't forget: Clean kitchen",
          data: { taskId: '2', category: 'Chores', points: 5 },
          date: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          isRead: true,
        },
        {
          id: '3',
          title: '📝 Task Reminder',
          body: "Don't forget: Soccer practice",
          data: { taskId: '7', category: 'Extracurriculars', points: 15 },
          date: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          isRead: false,
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;                // ✅ fixed backticks
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`; // ✅ fixed backticks
    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.notificationBody}>{item.body}</Text>
        {item.data && (
          <View style={styles.notificationData}>
            <Text style={styles.categoryText}>Category: {item.data.category}</Text>
            <Text style={styles.pointsText}>Points: {item.data.points}</Text>
          </View>
        )}
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderScheduledNotification = ({ item }: { item: Notifications.NotificationRequest }) => (
    <View style={styles.scheduledItem}>
      <View style={styles.scheduledContent}>
        <Text style={styles.scheduledTitle}>📅 Scheduled: {item.content.title}</Text>
        <Text style={styles.scheduledBody}>{item.content.body}</Text>
        <Text style={styles.scheduledTime}>
          Due: {item.trigger && 'date' in item.trigger ? new Date(item.trigger.date).toLocaleString() : 'Unknown'}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={clearAllNotifications} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#0077B6" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Recent Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            {notifications.length > 0 ? (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotificationItem}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            )}
          </View>

          {/* Scheduled Notifications */}
          {scheduledNotifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Scheduled Notifications</Text>
              <FlatList
                data={scheduledNotifications}
                keyExtractor={(item) => item.identifier}
                renderItem={renderScheduledNotification}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff6b6b',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#0077B6',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationBody: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  notificationData: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pointsText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0077B6',
    marginLeft: 8,
    marginTop: 4,
  },
  scheduledItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  scheduledContent: {
    flex: 1,
  },
  scheduledTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0077B6',
    marginBottom: 4,
  },
  scheduledBody: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  scheduledTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default NotificationCenter;
