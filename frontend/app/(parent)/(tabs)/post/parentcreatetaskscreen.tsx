import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const categories = [
  "Homework",
  "Chores",
  "Extracurriculars",
];

const ParentCreateTaskScreen = () => {
    const router = useRouter();
    const { childName } = useLocalSearchParams(); // Get childId from index.tsk where parent selects child

    const [taskName, setTaskName] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [note, setNote] = useState("");

    const handleAssignTask = () => {
        alert(`Task assigned to ${childName}!\n\nTask: ${taskName}\nCategory: ${category}\nDate: ${date.toDateString()}`);
        router.back(); // Return to previous screen for now
      };
    const handleCancel = () => {
        router.back(); // Just go back to child selection
      };
    const onDateChange = (_event: any, selectedDate?: Date) => {
        if (Platform.OS === "android") {
          setShowDatePicker(false);
        }
        if (selectedDate) {
          setDate(selectedDate);
          if (Platform.OS === "ios") {
            setShowDatePicker(false);
          }
        } else if (Platform.OS === "ios") {
          setShowDatePicker(false);
        }
      };
    
    const handleCategorySelect = (selectedCategory: string) => {
      setCategory(selectedCategory);
      setShowCategoryDropdown(false);
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
            <View style={styles.categoryInputContainer}>
              <TextInput
                placeholder="Select a category"
                value={category}
                editable={false}
                style={styles.categoryInput}
              />
              <TouchableOpacity
                style={styles.dropdownIconButton}
                onPress={() => setShowCategoryDropdown(true)}
              >
                <Ionicons name="chevron-down-outline" size={24} color="#0077B6" />
              </TouchableOpacity>
            </View>
    
            {/* Due Date */}
            <Text style={styles.label}>Due Date</Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                placeholder="Select a date"
                value={date.toDateString()}
                editable={false}
                style={styles.dateInput}
              />
              <TouchableOpacity
                style={styles.calendarIconButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={24} color="#0077B6" />
              </TouchableOpacity>
            </View>
    
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
          
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
            />
          )}

          {/* Category Dropdown Modal */}
          <Modal
            visible={showCategoryDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCategoryDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowCategoryDropdown(false)}
            >
              <View style={styles.dropdownContainer}>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.categoryItem,
                        category === item && styles.categoryItemSelected,
                      ]}
                      onPress={() => handleCategorySelect(item)}
                    >
                      <Text
                        style={[
                          styles.categoryItemText,
                          category === item && styles.categoryItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                      {category === item && (
                        <Ionicons name="checkmark" size={20} color="#0077B6" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>
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
      categoryInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        marginBottom: 20,
      },
      categoryInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: "#333",
      },
      dropdownIconButton: {
        padding: 12,
        justifyContent: "center",
        alignItems: "center",
      },
      dateInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        marginBottom: 20,
      },
      dateInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: "#333",
      },
      calendarIconButton: {
        padding: 12,
        justifyContent: "center",
        alignItems: "center",
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
      modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
      },
      dropdownContainer: {
        backgroundColor: "#fff",
        borderRadius: 12,
        width: "80%",
        maxHeight: 300,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      categoryItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
      },
      categoryItemSelected: {
        backgroundColor: "#E1F5FE",
      },
      categoryItemText: {
        fontSize: 16,
        color: "#333",
      },
      categoryItemTextSelected: {
        color: "#0077B6",
        fontWeight: "600",
      },
    });

