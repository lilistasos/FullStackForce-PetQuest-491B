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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTasks } from '@/contexts/TaskContext';
import { useAuth } from '@/hooks/useAuth';

const getApiUrl = () => {
  if (Platform.OS === "android") {
    // Android emulator uses 10.0.2.2
    return __DEV__ ? "http://10.0.2.2:4000" : "http://10.0.2.2:4000";
  } else if (Platform.OS === "ios") {
    // iOS simulator uses localhost
    return __DEV__ ? "http://localhost:4000" : "http://localhost:4000";
  } else {
    // Web
    return "http://localhost:4000";
  }
};

const categories = [
  "Homework",
  "Chores",
  "Extracurriculars",
  "Practice",
  "Appointments",
  "Other",
];

const pointOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

const ParentCreateTaskScreen = () => {
    const router = useRouter();

    // Receiving childID instead of Name
    const { childId } = useLocalSearchParams();
    // API Authorization
    const { token } = useAuth();

    const [taskName, setTaskName] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    //Adding Task Points
    const [showPointsDropdown, setShowPointsDropdown] = useState(false);
    const [points, setPoints] = useState(0);

    const [note, setNote] = useState("");

    const onDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
    };

    const handleCategorySelect = (selectedCategory: string) => {
      setCategory(selectedCategory);
      setShowCategoryDropdown(false);
    };

    const handlePointsSelect = (selectedPoints: number) => {
      setPoints(selectedPoints);
      setShowPointsDropdown(false);
    };    

    const handleAssignTask = async () => {
      try {
        const api = getApiUrl();
        const res = await fetch(`${api}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: taskName,
            description: note,
            dueDate: date.toISOString(),
            pointValue: points,
            category: category || "Other",
            assignedTo: childId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert("Error", data.error || "Task creation failed.");
          return;
        }
        Alert.alert("Task Sent!", "Task successfully assigned.", [
          {
            text: "Create Another Task",
            onPress: () => router.back(),
          },
          {
            text: "Go to Homepage",
            onPress: () => {
              router.replace("/(parent)/(tabs)/post");
              router.push("/(parent)/(tabs)/calendar");
            },
          },
        ]);
      } catch (err) {
        Alert.alert("Error", "Failed to send task.");
        console.log(err);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={styles.header}>Create a task</Text>
  
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

          {/* Points */}
          <Text style={styles.label}>Points</Text>
          <View style={styles.categoryInputContainer}>
            <TextInput
              placeholder="Select points"
              value={points > 0 ? `${points} points` : ""}
              editable={false}
              style={styles.categoryInput}
            />
            <TouchableOpacity
              style={styles.dropdownIconButton}
              onPress={() => setShowPointsDropdown(true)}
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
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
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

        <Modal
          visible={showPointsDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPointsDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPointsDropdown(false)}
          >
            <View style={styles.dropdownContainer}>
              <FlatList
                data={pointOptions}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      points === item && styles.categoryItemSelected,
                    ]}
                    onPress={() => handlePointsSelect(item)}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        points === item && styles.categoryItemTextSelected,
                      ]}
                    >
                      {item} points
                    </Text>
                    {points === item && (
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

