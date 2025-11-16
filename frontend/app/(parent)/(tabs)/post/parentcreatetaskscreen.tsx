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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTasks } from '@/contexts/TaskContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

const categories = [
  "Homework",
  "Chores",
  "Extracurriculars",
];

const ParentCreateTaskScreen = () => {
    const router = useRouter();
    const { childName } = useLocalSearchParams(); // Get childId from index.tsk where parent selects child
    const { addTask } = useTasks();
    const { user } = useAuth(); // Get parent name
    const { colors, isDarkMode } = useTheme();
    const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

    const [taskName, setTaskName] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [note, setNote] = useState("");

    const resetForm = () => {
      setTaskName("");
      setCategory("");
      setDate(new Date());
      setNote("");
    };

    const handleAssignTask = () => {
        // Create the task
        addTask({
          text: taskName,
          category: category,
          description: note || '',
          points: 0, // You can add points logic later
          dueDate: date.toISOString(),
          assignedTo: childName as string,
          assignedBy: user?.firstName || 'Parent',
        });
        
        Alert.alert(
          "Task Sent!",
          `Task successfully assigned to ${childName}!`,
          [
            {
              text: "Create Another Task",
              onPress: () => {
                router.back();
              },
            },
            
            {
              text: "Go to Homepage",
              onPress: () => {
                // Replace current screen with post index to reset stack
                router.replace("/(parent)/(tabs)/post");
                // Navigate to calendar immediately
                router.push("/(parent)/(tabs)/calendar");
              },
            },
          ],
          { cancelable: false }
        );
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
            {/* Task Name */}
            <Text style={styles.label}>Task Title</Text>
            <TextInput
              placeholder="e.g., Finish Math Homework"
              placeholderTextColor={colors.textSecondary}
              value={taskName}
              onChangeText={setTaskName}
              style={styles.input}
            />
    
            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryInputContainer}>
              <TextInput
                placeholder="Select a category"
                placeholderTextColor={colors.textSecondary}
                value={category}
                editable={false}
                style={styles.categoryInput}
              />
              <TouchableOpacity
                style={styles.dropdownIconButton}
                onPress={() => setShowCategoryDropdown(true)}
              >
                <Ionicons name="chevron-down-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
    
            {/* Due Date */}
            <Text style={styles.label}>Due Date</Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                placeholder="Select a date"
                placeholderTextColor={colors.textSecondary}
                value={date.toDateString()}
                editable={false}
                style={styles.dateInput}
              />
              <TouchableOpacity
                style={styles.calendarIconButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
    
            {/* Optional Notes */}
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              placeholder="Add extra instructions here..."
              placeholderTextColor={colors.textSecondary}
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
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
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
        padding: 20,
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
      buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
      },
      cancelButton: {
        flex: 1,
        backgroundColor: colors.secondary,
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginRight: 10,
      },
      assignButton: {
        flex: 1,
        backgroundColor: colors.primary,
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

