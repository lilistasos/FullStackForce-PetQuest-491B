import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNewTask } from '@/contexts/NewTaskContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function NewTaskPopup() {
  const { newTasks, hideTasks } = useNewTask();
  const { colors } = useTheme();

  if (!newTasks || newTasks.length === 0) return null;

  const taskCount = newTasks.length;
  const isMultiple = taskCount > 1;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={newTasks.length > 0}
      onRequestClose={hideTasks}
    >
      <View style={styles.overlay}>
        <View style={[styles.popup, { backgroundColor: colors.surface || colors.background }]}>
          {/* Header with icon */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="notifications" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {isMultiple ? `New Tasks Assigned! (${taskCount})` : 'New Task Assigned!'}
            </Text>
          </View>

          {/* Task details - scrollable if multiple tasks */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {newTasks.map((task, index) => (
              <View key={task.id} style={styles.taskContainer}>
                {isMultiple && (
                  <View style={styles.taskNumberContainer}>
                    <Text style={[styles.taskNumber, { color: colors.primary }]}>
                      Task {index + 1}
                    </Text>
                  </View>
                )}
                <View style={styles.taskRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.taskIcon} />
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                </View>
                
                {/* Points display */}
                <View style={styles.pointsContainer}>
                  <View style={[styles.pointsBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="star" size={16} color={colors.primary} style={styles.pointsIcon} />
                    <Text style={[styles.pointsText, { color: colors.primary }]}>
                      {task.points} {task.points === 1 ? 'Point' : 'Points'}
                    </Text>
                  </View>
                </View>
                
                {task.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Description:</Text>
                    <Text style={[styles.description, { color: colors.text }]}>{task.description}</Text>
                  </View>
                )}
                
                {index < newTasks.length - 1 && (
                  <View style={[styles.divider, { borderTopColor: colors.border || '#E0E0E0' }]} />
                )}
              </View>
            ))}
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={hideTasks}
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
  scrollView: {
    maxHeight: 400, // Limit height for multiple tasks
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  content: {
    marginBottom: 24,
  },
  taskContainer: {
    marginBottom: 16,
  },
  taskNumberContainer: {
    marginBottom: 8,
  },
  taskNumber: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    borderTopWidth: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  taskIcon: {
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  pointsContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsIcon: {
    marginRight: 6,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
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
