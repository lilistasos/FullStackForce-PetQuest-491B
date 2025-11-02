import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";

const ParentCreateTaskScreen = () => {
    const router = useRouter();
    const { childName } = useLocalSearchParams(); // Get childId from index.tsk where parent selects child

    const [taskName, setTaskName] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [note, setNote] = useState("");

    const handleAssignTask = () => {
        alert(`Task assigned to ${childName}!\n\nTask: ${taskName}\nCategory: ${category}\nDate: ${date.toDateString()}`);
        router.back(); // Return to previous screen for now
      };
    const handleCancel = () => {
        router.back(); // Just go back to child selection
      };
    const onDateChange = (_event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
      };
    
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
            <Text style={styles.header}>
              Create a task for {childName || "your child"}
            </Text>
    
            {/* Task Name */}
            <Text style={styles.label}>Task Title</Text>
            <TextInput
              placeholder="e.g., Finish Math Homework"
              value={taskName}
              onChangeText={setTaskName}
              style={styles.input}
            />
    
            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <TextInput
              placeholder="Homework, Chores, Extracurriculars..."
              value={category}
              onChangeText={setCategory}
              style={styles.input}
            />
    
            {/* Due Date */}
            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{date.toDateString()}</Text>
            </TouchableOpacity>
    
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
    
            {/* Optional Notes */}
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              placeholder="Add extra instructions here..."
              value={note}
              onChangeText={setNote}
              multiline
              style={[styles.input, { height: 80 }]}
            />
    
            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
    
              <TouchableOpacity style={styles.assignButton} onPress={handleAssignTask}>
                <Text style={styles.buttonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    };
    
    export default ParentCreateTaskScreen;
    
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
      },
      header: {
        fontSize: 26,
        fontWeight: "700",
        color: "#0077B6",
        textAlign: "center",
        marginBottom: 30,
      },
      label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 6,
      },
      input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
      },
      dateButton: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
      },
      dateText: {
        fontSize: 16,
        color: "#333",
      },
      buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
      },
      cancelButton: {
        flex: 1,
        backgroundColor: "#ccc",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginRight: 10,
      },
      assignButton: {
        flex: 1,
        backgroundColor: "#52AFDD",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginLeft: 10,
      },
      buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
      },
    });

