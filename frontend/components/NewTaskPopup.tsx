import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNewTask } from '@/contexts/NewTaskContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function NewTaskPopup() {
  const { newTask, hideTask } = useNewTask();
  const { colors } = useTheme();

  if (!newTask) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!newTask}
      onRequestClose={hideTask}
    >
      <View style={styles.overlay}>
        <View style={[styles.popup, { backgroundColor: colors.surface || colors.background }]}>
          {/* Header with icon */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="notifications" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>New Task Assigned!</Text>
          </View>

          {/* Task details */}
          <View style={styles.content}>
            <View style={styles.taskRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.taskIcon} />
              <Text style={[styles.taskTitle, { color: colors.text }]}>{newTask.title}</Text>
            </View>
            
            {newTask.description && (
              <View style={styles.descriptionContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Description:</Text>
                <Text style={[styles.description, { color: colors.text }]}>{newTask.description}</Text>
              </View>
            )}
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={hideTask}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  popup: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskIcon: {
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  closeButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
