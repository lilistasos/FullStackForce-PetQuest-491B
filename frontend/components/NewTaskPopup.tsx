import React from 'react';
import { View, Text, Modal, Button, StyleSheet } from 'react-native';
import { useNewTask } from '@/contexts/NewTaskContext';

export default function NewTaskPopup() {
  const { newTask, hideTask } = useNewTask();

  if (!newTask) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={true}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>New Task Assigned!</Text>
          <Text style={styles.text}>Task: {newTask.title}</Text>
          <Text style={styles.text}>Description: {newTask.description}</Text>

          <Button title="Close" onPress={hideTask} />
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  popup: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
});
