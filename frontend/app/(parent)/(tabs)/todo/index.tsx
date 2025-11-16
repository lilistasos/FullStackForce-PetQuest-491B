import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Modal, TextInput, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from 'expo-router';
import { useTasks } from "@/contexts/TaskContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodoCategoryPreferences } from '../account/preferences';

const TODO_CATEGORIES_KEY = '@petquest:todoCategories';

const defaultCategoryPreferences: TodoCategoryPreferences = {
  Homework: true,
  Chores: true,
  Work: true,
  Extra: true,
};

// Defines what a task looks like
type Task = {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  originalCategory?: string;
  description: string;
  points: number;
  childName?: string; // Which child the task is assigned to
};

const ToDoScreen = ()=> {
  const { getTasksByChild, toggleComplete: contextToggleComplete } = useTasks();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

  // Current Date State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Child selection state
  const [selectedChild, setSelectedChild] = useState<string>("All");
  const [childSelectorOpen, setChildSelectorOpen] = useState(false);
  
  // Example children list - in production, this would come from the backend
  const children = ["All", "Emma", "Lucas", "Sophia"];

  const [showDetails, setShowDetails] = useState<string | null>(null);
  const dropdownOptions = ["Default", "Points: High to Low", "Points: Low to High"];
  
  //states for sort dropdown
  const [dropdown, setDropdown] = useState(false);
  const [sortType, setSortType] = useState(dropdownOptions[0]);

  //states for delete task
  const [deleteModal, setDeleteModal] = useState(false);
  const [taskDelete, setTaskDelete] = useState<string | null>(null);

  //states for edit task
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editText, setEditText] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPoints, setEditPoints] = useState("");


  //states for points popup
  const [pointsPopup, setPointsPopup] = useState({ visible: false, message: "" });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const closeDropdown = () => {
    if (dropdown) {
      setDropdown(false);
    }
    if (childSelectorOpen) {
      setChildSelectorOpen(false);
    }
  };

  // Dropdown toggle function
  const toggleDropdown = () => {
    setDropdown((prev) => !prev);
  };

  // Handle sort selection
  const handleSort = (option: string) => {
    setSortType(option);
    setDropdown(false);
  };

  // Delete task function
  const deleteTask = (dateKey: string, taskId: string) => {
    setTasksByDate((prev) => {
      const updatedTasks = (prev[dateKey] || []).filter((task) => task.id !== taskId);
      return { ...prev, [dateKey]: updatedTasks };
    });
  };

  const handlePressTask = (taskId: string) => {
  closeDropdown();
  setShowDetails((prev) => (prev === taskId ? null : taskId)
  );
}

// States for Categories
// expanded state object to track which categories are currently expanded or collapsed
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
    Homework: false, // All categories are collaspsed at first
    Chores: false,
    Work: false,
    Extra: false,
    Extracurriculars: false, // Keep for backward compatibility
    Completed: false,
  });

  // Category preferences state
  const [categoryPreferences, setCategoryPreferences] = useState<TodoCategoryPreferences>(defaultCategoryPreferences);

  // Load category preferences function
  const loadCategoryPreferences = useCallback(async () => {
    try {
      const savedCategories = await AsyncStorage.getItem(TODO_CATEGORIES_KEY);
      if (savedCategories !== null) {
        const parsed = JSON.parse(savedCategories);
        setCategoryPreferences({ ...defaultCategoryPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Error loading category preferences:', error);
    }
  }, []);

  // Load category preferences on mount and when screen comes into focus
  useEffect(() => {
    loadCategoryPreferences();
  }, [loadCategoryPreferences]);

  // Reload preferences when screen comes into focus (e.g., returning from preferences screen)
  useFocusEffect(
    useCallback(() => {
      loadCategoryPreferences();
    }, [loadCategoryPreferences])
  );

// Converts current date to a string
const formatDateKey = (date: Date) => date.toISOString().split("T")[0];
const todayKey = formatDateKey(new Date());

const [tasksByDate, setTasksByDate] = useState<{
  [key: string]: Task[];
}>({
  [todayKey]: [
    { id: "1", text: "Complete science project", completed: false, category: "Homework", description: "Finish the solar system model for science class", points: 25, childName: "Emma" },
    { id: "2", text: "Practice piano", completed: false, category: "Work", description: "Practice scales and new piece for 30 minutes", points: 15, childName: "Emma" },
    { id: "3", text: "Clean bedroom", completed: false, category: "Chores", description: "Organize toys and make bed", points: 10, childName: "Lucas" },
    { id: "4", text: "Read chapter 5", completed: false, category: "Homework", description: "Read and summarize chapter 5 of history book", points: 20, childName: "Sophia" },
    { id: "5", text: "Set dinner table", completed: true, category: "Completed", originalCategory: "Chores", description: "Set plates, utensils, and napkins", points: 5, childName: "Lucas" },
    { id: "6", text: "Math homework pages 45-47", completed: false, category: "Homework", description: "Complete all problems and show work", points: 15, childName: "Emma" },
    { id: "7", text: "Basketball practice", completed: false, category: "Work", description: "Team practice at the community center", points: 20, childName: "Lucas" },
    { id: "8", text: "Feed the dog", completed: false, category: "Chores", description: "Morning and evening feeding", points: 8, childName: "Sophia" },
    { id: "9", text: "Art club meeting", completed: false, category: "Extra", description: "After school art club session", points: 12, childName: "Emma" },
    { id: "10", text: "Take out recycling", completed: false, category: "Chores", description: "Sort and take recycling bins to curb", points: 7, childName: "Lucas" },
    { id: "11", text: "Book report draft", completed: false, category: "Homework", description: "Write first draft of book report on 'The Giver'", points: 30, childName: "Sophia" },
    { id: "12", text: "Water plants", completed: false, category: "Chores", description: "Water all indoor plants", points: 5, childName: "Emma" },
    { id: "13", text: "Swimming lessons", completed: false, category: "Work", description: "Weekly swimming lesson at the pool", points: 18, childName: "Lucas" },
    { id: "14", text: "Science fair preparation", completed: false, category: "Extra", description: "Work on display board and presentation", points: 25, childName: "Sophia" },
  ],
});

// Converts current date to a string (already defined above)
const formattedKey = formatDateKey(currentDate);
const tasks = tasksByDate[formattedKey] || [];

  // Helper functions for changing date
  // Able to move back and forth between days 
  const changeDate = (days: number) => {
    closeDropdown();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
}
//Format date in a 3 line stagger
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const weekday = currentDate.toLocaleDateString("en-US", { weekday: "long" });
const dayNumber = currentDate.getDate();
const ordinalSuffix = getOrdinalSuffix(dayNumber);
const monthName = currentDate.toLocaleDateString("en-US", { month: "long" });
const monthDay = `${monthName} ${dayNumber}${ordinalSuffix}`;

// Handling Edit Save Logic
  const handleEditSave = () => {
    if (taskToEdit) {
      setTasksByDate((prev) => {
        const updatedTasks = prev[formattedKey].map((task) =>
          task.id === taskToEdit.id
            ? { ...task, text: editText, description: editDescription, points: parseInt(editPoints) || task.points }
            : task
        );
        return { ...prev, [formattedKey]: updatedTasks };
      });
      setEditModal(false);
      setTaskToEdit(null);
    }
  };

// Points PopUp Function
const showPopup = (message: string) => {
  setPointsPopup({ visible: true, message });

  // Fading in
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 400,
    useNativeDriver: true,
  }).start(() => {
    // hold for 1.5s, then fade out
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setPointsPopup({ visible: false, message: "" }));
    }, 1500);
  });
};


// Update toggleComplete
const toggleComplete = (taskId: string) => {
  setTasksByDate((prev) => {
    const updatedDayTasks = (prev[formattedKey] || []).map((task) => {
      if (task.id === taskId) {
        if (task.completed && task.category === "Completed" && task.originalCategory) {
          // unmark completed → move back to original
          return {
            ...task,
            completed: false,
            category: task.originalCategory,
            originalCategory: undefined,
          };
        } else if (!task.completed && task.category !== "Completed") {
          // mark as completed → move to Completed section
          return {
            ...task,
            completed: true,
            originalCategory: task.category,
            category: "Completed",
          };
        }
      }
      return task;
    });
    return { ...prev, [formattedKey]: updatedDayTasks };
  });
};

// Categories for tasks - filter based on preferences
  // Map category IDs to preference keys (for backward compatibility, map Extracurriculars to Work)
  const categoryMapping: { [key: string]: keyof TodoCategoryPreferences } = {
    "Homework": "Homework",
    "Chores": "Chores",
    "Work": "Work",
    "Extra": "Extra",
    "Extracurriculars": "Work", // Map old category to Work preference
  };

  const allCategories = [
    { id: "Homework", title: "Homework" },
    { id: "Chores", title: "Chores" },
    { id: "Work", title: "Work" },
    { id: "Extra", title: "Extra" },
    { id: "Extracurriculars", title: "Extracurriculars" }, // Keep for backward compatibility
    { id: "Completed", title: "Completed" }, // Always visible
  ];

  // Filter categories based on preferences (Completed is always shown)
  const categories = useMemo(() => {
    return allCategories.filter((category) => {
      if (category.id === "Completed") return true; // Always show Completed
      const preferenceKey = categoryMapping[category.id];
      if (!preferenceKey) return true; // Show if no mapping found (safety)
      return categoryPreferences[preferenceKey] !== false;
    });
  }, [categoryPreferences]);
  const renderCategory = (category: { id: string; title: string }) => {
    const isExpanded = expanded[category.id];
    const tasks = tasksByDate[formattedKey] || [];
    // Filter tasks by category and selected child
    let categoryTasks = tasks.filter((t) => t.category === category.id);
    
    // Filter by selected child if not "All"
    if (selectedChild !== "All") {
      categoryTasks = categoryTasks.filter((t) => t.childName === selectedChild);
    }
    //sort tasks based on selected sort
    switch(sortType) {
      case (dropdownOptions[1]):
        categoryTasks.sort((a, b) => b.points - a.points);
        break;
      case (dropdownOptions[2]):
        categoryTasks.sort((a, b) => a.points - b.points);
        break;
      case (dropdownOptions[0]):
      default:
        categoryTasks.sort((a, b) => a.text.localeCompare(b.text));
        break;
    }
    const visibleTasks = isExpanded ? categoryTasks : categoryTasks.slice(0, 3);
    const hiddenCount = categoryTasks.length - visibleTasks.length;
    

    return (
      <View style={styles.card}>
        {/* Header Row (Category Title + Arrow) */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => {
            closeDropdown();
            setExpanded((prev) => ({ ...prev, [category.id]: !prev[category.id] }));
          }}
        >
          <Ionicons
            name={isExpanded ? "chevron-down" : "chevron-forward"}
            size={20}
            color={colors.primary}
            style={styles.cardHeaderIcon}
          />
          <Text style={styles.cardTitle}>{category.title}</Text>
        </TouchableOpacity>

        {/* Task List ; displays expanded or unexpanded list*/}
        
        <View style={styles.taskList}>
          {visibleTasks.length > 0 ? (
            visibleTasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View>
                  <Ionicons
                    name={
                      task.completed ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={20}
                    color={task.completed ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.taskDetailsColumn}>
                  <Pressable onPress={() => handlePressTask(task.id)} style={styles.taskTitleRow}>
                    <Ionicons
                      name={showDetails === task.id ? "chevron-down" : "chevron-forward"}
                      size={16}
                      color={colors.primary}
                      style={styles.taskChevronIcon}
                    />
                    <Text
                      style={[
                        styles.taskText,
                        task.completed && styles.completedTaskText,
                      ]}
                    >
                      {selectedChild === "All" && task.childName 
                        ? `${task.childName}: ${task.text}` 
                        : task.text}
                    </Text>
                  </Pressable>
                
                {/* Task Details (description, points, delete button) */}
                {showDetails === task.id && (
                  <View style={{marginTop: 4}}>
                    <Text style={styles.detailText}>Description: {task.description}</Text>
                    <View style={styles.pointsBadge}>
                      <Text style={[styles.pointsText, { color: colors.primary }]}>{task.points} pts</Text>
                    </View>
                    <View style={styles.buttonRow}>
                      {/* Edit Button */}
                      {!task.completed && (
                        <TouchableOpacity
                          onPress={() => {
                            setTaskToEdit(task);
                            setEditText(task.text);
                            setEditDescription(task.description);
                            setEditPoints(task.points.toString());
                            setEditModal(true);
                          }}
                          style={[styles.editButton, { backgroundColor: colors.primary }]}
                        >
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => {setDeleteModal(true); setTaskDelete(task.id)}} style={styles.deleteButton}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No tasks yet</Text>
          )}
          {/* Fine print for hidden tasks */}
          {!isExpanded && hiddenCount > 0 && (
            <Text style={styles.moreText}>+{hiddenCount} more task{hiddenCount > 1 ? "s" : ""}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Child Selector */}
        <View style={styles.childSelectorContainer}>
          <TouchableOpacity 
            style={styles.childSelectorButton}
            onPress={() => setChildSelectorOpen(!childSelectorOpen)}
          >
            <Text style={styles.childSelectorText} numberOfLines={1}>{selectedChild}</Text>
            <Ionicons 
              name={childSelectorOpen ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={colors.primary} 
              style={styles.childSelectorIcon}
            />
          </TouchableOpacity>
          {childSelectorOpen && (
            <>
              <TouchableOpacity style={styles.childSelectorBackdrop} onPress={() => setChildSelectorOpen(false)} />
              <View style={styles.childSelectorDropdown}>
                {children.map((child) => (
                  <TouchableOpacity
                    key={child}
                    style={[
                      styles.childOption,
                      selectedChild === child && styles.childOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedChild(child);
                      setChildSelectorOpen(false);
                    }}
                  >
                    <Text style={[
                      styles.childOptionText,
                      selectedChild === child && { color: colors.primary }
                    ]}>{child}</Text>
                    {selectedChild === child && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Date (centered + stacked) */}
        <View style={styles.dateSection}>
          <Text style={styles.weekday}>{weekday}</Text>
          <Text style={styles.monthDay}>{`${monthDay}`}</Text>
        </View>

        {/* Date navigation arrows */}
        <View style={styles.chevronRow}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeDate(1)} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Categories */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onTouchStart={() => {
          if (dropdown) {
            setDropdown(false);
          }
          if (childSelectorOpen) {
            setChildSelectorOpen(false);
          }
        }}
      >
        <View style={styles.filterWrapper}>
          <TouchableOpacity onPress={toggleDropdown} style={styles.filterButton}>
            <Ionicons name="funnel-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          {dropdown && (
            <>
              <TouchableOpacity style={styles.dropdownBackdrop} onPress={() => setDropdown(false)} />
              <View style={styles.dropdown}>
                <TouchableOpacity onPress={() => handleSort(dropdownOptions[0])} style={styles.dropdownOption}>
                  <Text style={styles.dropdownOptionText}>Default</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSort(dropdownOptions[1])} style={styles.dropdownOption}>
                  <Text style={styles.dropdownOptionText}>Points: High to Low</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSort(dropdownOptions[2])} style={styles.dropdownOption}>
                  <Text style={styles.dropdownOptionText}>Points: Low to High</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        {categories.map((category) => (
          <View key={category.id}>{renderCategory(category)}</View>
        ))}
      </ScrollView>

      {/* Edit Task Modal */}
      <Modal visible={editModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TextInput placeholder="Task name" placeholderTextColor={colors.textSecondary} value={editText} onChangeText={setEditText} style={styles.input} />
            <TextInput placeholder="Description" placeholderTextColor={colors.textSecondary} value={editDescription} onChangeText={setEditDescription} style={styles.input} />
            <TextInput placeholder="Points" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={editPoints} onChangeText={setEditPoints} style={styles.input} />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={() => setEditModal(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModal}
        onRequestClose={() => {
          setDeleteModal(!deleteModal);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalText}>Are you sure you want to delete? You won't get the points for this task if you do.</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={() => setDeleteModal(false)} style={styles.cancelDeleteButton}>
                <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={() => {
                if (taskDelete)
                deleteTask(formattedKey, taskDelete);
                setDeleteModal(false);
                setTaskDelete(null);}}>
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Animated points gained popup */}
        {pointsPopup.visible && (
          <Animated.View style={[styles.pointsPopup, { opacity: fadeAnim }]}>
            <Text style={styles.pointsPopupText}>{pointsPopup.message}</Text>
          </Animated.View>
        )}      
    </SafeAreaView>
  );
};

export default ToDoScreen;

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 0,
    },
    header: {
      marginTop: 0,
      paddingVertical: 12,
      marginBottom: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    childSelectorContainer: {
      position: "relative",
      width: 100,
      marginRight: 16,
    },
    childSelectorButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 40,
    },
    childSelectorText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      marginRight: 4,
    },
    childSelectorIcon: {
      marginLeft: 4,
    },
    childSelectorBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
      zIndex: 998,
    },
    childSelectorDropdown: {
      position: "absolute",
      top: 44,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      zIndex: 999,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.4 : 0.2,
      shadowRadius: 4,
      elevation: 5,
      marginTop: 4,
    },
    childOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    childOptionSelected: {
      backgroundColor: colors.background,
    },
    childOptionText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    dateSection: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    weekday: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
    },
    monthDay: {
      fontSize: 20,
      color: colors.textSecondary,
    },
    chevronRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    navButton: {
      padding: 4,
    },
    filterWrapper: {
      position: "relative",
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    filterButton: {
      padding: 4,
    },
    dropdownBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginTop: 6,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contentContainer: {
      paddingBottom: 20,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    cardHeaderIcon: {
      marginRight: 8,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    taskList: {
      marginTop: 10,
      paddingLeft: 8,
    },
    taskItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginVertical: 6,
    },
    taskDetailsColumn: {
      flex: 1,
      flexDirection: "column",
      marginLeft: 12,
    },
    taskTitleRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    taskChevronIcon: {
      marginRight: 8,
    },
    taskText: {
      fontSize: 16,
      color: colors.text,
    },
    completedTaskText: {
      textDecorationLine: "line-through",
      color: colors.textSecondary,
    },
    detailText: {
      color: colors.textSecondary,
      marginTop: 4,
    },
    pointsBadge: {
      alignSelf: "flex-start",
      marginTop: 8,
    },
    pointsText: {
      fontSize: 14,
      fontWeight: "bold",
      fontFamily: "monospace",
    },
    emptyText: {
      fontStyle: "italic",
      color: colors.textSecondary,
      marginLeft: 30,
      marginTop: 6,
    },
    moreText: {
      marginTop: 4,
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    buttonRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 6,
    },
    deleteButton: {
      backgroundColor: "#FF4D4D",
      padding: 10,
      borderRadius: 5,
      flex: 1,
    },
    deleteButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      textAlign: "center",
    },
    editButton: {
      padding: 10,
      borderRadius: 5,
      flex: 1,
    },
    editButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      textAlign: "center",
    },
    dropdownOption: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownOptionText: {
      color: colors.text,
    },
    dropdown: {
      position: "absolute",
      top: 34,
      left: 0,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      zIndex: 1000,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.4 : 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDarkMode ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
      padding: 20,
    },
    deleteModalContainer: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      padding: 20,
    },
    deleteModalText: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 16,
      textAlign: "center",
      color: colors.text,
    },
    deleteConfirmButton: {
      backgroundColor: "#FF4D4D",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 5,
      marginLeft: 12,
      flex: 1,
      alignItems: "center",
    },
    deleteConfirmButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    cancelDeleteButton: {
      backgroundColor: colors.secondary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 5,
      flex: 1,
      alignItems: "center",
    },
    cancelDeleteButtonText: {
      color: colors.text,
      fontWeight: "600",
    },
    modalBox: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 10,
      color: colors.text,
      textAlign: "center",
    },
    modalBodyText: {
      color: colors.textSecondary,
      marginTop: 6,
      textAlign: "center",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
      padding: 10,
      width: "100%",
      marginBottom: 8,
      color: colors.text,
      backgroundColor: colors.background,
    },
    modalButtonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 10,
      gap: 12,
    },
    cancelButton: {
      backgroundColor: colors.secondary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 5,
      flex: 1,
      alignItems: "center",
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: "600",
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 5,
      flex: 1,
      alignItems: "center",
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    pointsPopup: {
      position: "absolute",
      bottom: 100,
      alignSelf: "center",
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    pointsPopupText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 16,
    },
  });
