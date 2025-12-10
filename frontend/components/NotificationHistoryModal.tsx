import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NotificationService, {
  NotificationHistoryItem,
} from "../services/NotificationService";
import { useTheme } from "@/contexts/ThemeContext";

interface NotificationHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationHistoryModal({
  visible,
  onClose,
}: NotificationHistoryModalProps) {
  const { colors } = useTheme();
  const notificationService = NotificationService.getInstance();
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible]);

  const loadHistory = async () => {
    const items = await notificationService.getNotificationHistory();
    setHistory(items);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await notificationService.deleteFromHistory(id);
            await loadHistory();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notification history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await notificationService.clearHistory();
            await loadHistory();
          },
        },
      ]
    );
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    await loadHistory();
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: NotificationHistoryItem }) => (
    <View
      style={[
        styles.notificationItem,
        { backgroundColor: item.read ? colors.surface : "#e8f4fd" },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={() => !item.read && handleMarkAsRead(item.id)}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.titleRow}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        <Text style={[styles.notificationBody, { color: "#666" }]}>
          {item.body}
        </Text>
        {item.category && (
          <View style={styles.metaRow}>
            <Ionicons name="folder-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{item.category}</Text>
            {item.points && (
              <>
                <Ionicons
                  name="star-outline"
                  size={14}
                  color="#666"
                  style={{ marginLeft: 12 }}
                />
                <Text style={styles.metaText}>{item.points} pts</Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B35" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {history.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification List */}
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You&apos;ll see your task reminders and updates here
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    padding: 15,
  },
  notificationItem: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ECDC4",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
});
