import React, { useState, useMemo } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTasks } from '@/contexts/TaskContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { getApiUrl } from '@/utils/api';

const taskCategories = [
  "Homework",
  "Chores",
  "Extracurriculars",
  "Practice",
  "Appointments",
  "Other",
];

const eventCategories = [
  "School",
  "Sporting Games",
  "Family Gatherings",
  "Appointments",
  "Other",
];

const pointOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

type ItemType = "tasks" | "events";

const ParentCreateTaskScreen = () => {
    const router = useRouter();

    // Receiving childID instead of Name
    const { childId } = useLocalSearchParams();
    // API Authorization
    const { token } = useAuth();
    const { colors, isDarkMode } = useTheme();

    const [itemType, setItemType] = useState<ItemType>("tasks");
    const [taskName, setTaskName] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState<string[]>(taskCategories);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    //Adding Task Points
    const [showPointsDropdown, setShowPointsDropdown] = useState(false);
    const [points, setPoints] = useState(0);

    const [note, setNote] = useState("");

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

    const onTimeChange = (_event: any, selectedTime?: Date) => {
      if (Platform.OS === "android") {
        setShowTimePicker(false);
      }
      if (selectedTime) {
        setTime(selectedTime);
        if (Platform.OS === "ios") {
          setShowTimePicker(false);
        }
      } else if (Platform.OS === "ios") {
        setShowTimePicker(false);
      }
    };

    // Format time as "10:00 AM" or "2:30 PM"
    const formatTime = (date: Date): string => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `${displayHours}:${displayMinutes} ${period}`;
    };

    const handleCancel = () => {
      Alert.alert(
        "Discard Task?",
        "Are you sure you want to discard this task? All your changes will be lost.",
        [
          {
            text: "Go Back",
            style: "cancel",
            onPress: () => {
              // Do nothing, just close the alert
            },
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              router.back(); // Navigate back to previous screen
            },
          },
        ],
        { cancelable: true }
      );
    };
    const handleCategorySelect = (selectedCategory: string) => {
      setCategory(selectedCategory);
      setShowCategoryDropdown(false);
    };

    const handleTypeSelect = (type: ItemType) => {
      setItemType(type);
      setShowTypeDropdown(false);
      // Reset category when switching types
      setCategory("");
      // Update categories based on type
      if (type === "events") {
        setCategories(eventCategories);
      } else {
        setCategories(taskCategories);
      }
    };

    const handlePointsSelect = (selectedPoints: number) => {
      setPoints(selectedPoints);
      setShowPointsDropdown(false);
    };    

    const handleAssignTask = async () => {
      // Validate required fields
      if (!taskName.trim()) {
        Alert.alert("Error", `Please enter a ${itemType === "events" ? "event" : "task"} title.`);
        return;
      }
      if (!category) {
        Alert.alert("Error", "Please select a category.");
        return;
      }
      // Points are optional for both tasks and events (can be 0)
      // No validation needed - points can be 0 for events
      if (!childId) {
        Alert.alert("Error", "Child not selected.");
        return;
      }

      try {
        const api = getApiUrl();
        const res = await fetch(`${api}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: taskName,
            description: note || '',
            dueDate: date.toISOString().split('T')[0],
            points: points || 0, // Events can have 0 points
            category: category || "Other",
            assignedToUserId: parseInt(childId as string),
            type: itemType === "events" ? "event" : "task",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert("Error", data.error || `${itemType === "events" ? "Event" : "Task"} creation failed.`);
          return;
        }
        const itemTypeName = itemType === "events" ? "Event" : "Task";
        Alert.alert(`${itemTypeName} Created!`, `${itemTypeName} successfully ${itemType === "events" ? "added to calendar" : "assigned"}.`, [
          {
            text: `Create Another ${itemTypeName}`,
            onPress: () => {
              // Reset form
              setTaskName("");
              setCategory("");
              setPoints(0);
              setNote("");
              setDate(new Date());
              router.back();
            },
          },
          {
            text: itemType === "events" ? "Go to Calendar" : "Go to Homepage",
            onPress: () => {
              if (itemType === "events") {
                router.replace("/(parent)/(tabs)/calendar");
              } else {
                router.replace("/(parent)/(tabs)/calendar");
              }
            },
          },
        ]);
      } catch (err: any) {
        console.error(`${itemType} creation error:`, err);
        Alert.alert("Error", err.message || `Failed to send ${itemType}. Please check your connection.`);
      }
    };

    // Create styles using the theme
    const styles = createStyles(colors, isDarkMode);

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            bounces={true}
          >
          {/* Type Selection Dropdown */}
          <Text style={styles.label}>Type</Text>
          <View style={styles.categoryInputContainer}>
            <TextInput
              placeholder="Select type"
              value={itemType === "events" ? "Events" : "Tasks"}
              editable={false}
              style={styles.categoryInput}
            />
            <TouchableOpacity
              style={styles.dropdownIconButton}
              onPress={() => setShowTypeDropdown(true)}
            >
              <Ionicons name="chevron-down-outline" size={24} color="#0077B6" />
            </TouchableOpacity>
          </View>
  
          {/* Task/Event Name */}
          <Text style={styles.label}>{itemType === "events" ? "Event Title" : "Task Title"}</Text>
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

          {/* Points - Available for both tasks and events */}
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
          <Text style={styles.label}>Date</Text>
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

          {/* Time - Only show for events */}
          {itemType === "events" && (
            <>
              <Text style={styles.label}>Time</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  placeholder="Select a time"
                  value={formatTime(time)}
                  editable={false}
                  style={styles.dateInput}
                />
                <TouchableOpacity
                  style={styles.calendarIconButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={24} color="#0077B6" />
                </TouchableOpacity>
              </View>
            </>
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
          
          {/* Extra spacing at bottom of scroll */}
          <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        
        {/* Buttons fixed at bottom - always visible */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
  
            <TouchableOpacity 
              style={styles.assignButton} 
              onPress={handleAssignTask}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{itemType === "events" ? "Add to Calendar" : "Send"}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onTimeChange}
          />
        )}

        {/* Type Dropdown Modal */}
        <Modal
          visible={showTypeDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTypeDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTypeDropdown(false)}
          >
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  itemType === "events" && styles.categoryItemSelected,
                ]}
                onPress={() => handleTypeSelect("events")}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    itemType === "events" && styles.categoryItemTextSelected,
                  ]}
                >
                  Events
                </Text>
                {itemType === "events" && (
                  <Ionicons name="checkmark" size={20} color="#0077B6" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  itemType === "tasks" && styles.categoryItemSelected,
                ]}
                onPress={() => handleTypeSelect("tasks")}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    itemType === "tasks" && styles.categoryItemTextSelected,
                  ]}
                >
                  Tasks
                </Text>
                {itemType === "tasks" && (
                  <Ionicons name="checkmark" size={20} color="#0077B6" />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  categoryInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: colors.surface,
  },
  categoryInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
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
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: colors.surface,
  },
  dateInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  calendarIconButton: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.secondary || "#888",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  assignButton: {
    flex: 1,
    backgroundColor: colors.primary || "#0077B6",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: "80%",
    maxHeight: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDarkMode ? 0.4 : 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryItemSelected: {
    backgroundColor: isDarkMode ? colors.primary + "40" : colors.primary + "20",
  },
  categoryItemText: {
    fontSize: 16,
    color: colors.text,
  },
  categoryItemTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});