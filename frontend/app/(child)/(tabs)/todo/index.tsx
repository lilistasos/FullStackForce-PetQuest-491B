import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable, Modal, TextInput, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from 'expo-router';
import { useTasks } from "@/contexts/TaskContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { usePet } from "@/contexts/PetContext";
import { useAchievements } from "@/contexts/AchievementContext";
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
  assignedByUserId?: number; // If exists, task was assigned by parent (child cannot edit/delete)
};

const ToDoScreen = ()=> {
  const { getTasksByChild, toggleComplete: contextToggleComplete, tasks: contextTasks, refreshTasks, loading: tasksLoading } = useTasks();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { selectedPet } = usePet();
  const { recordTaskCompletion } = useAchievements();
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);
  const router = useRouter();
  
  // Refresh tasks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && user.role === 'child') {
        refreshTasks();
      }
    }, [user, refreshTasks])
  );

  // Current Date State
  const [currentDate, setCurrentDate] = useState(new Date());

  //const [showDetails, setShowDetails] = useState(false);
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

  //states for confirm modal
  const [confirmModal, setConfirmModal] = useState(false);
  const [taskToConfirm, setTaskToConfirm] = useState<Task | null>(null);

  //states for points popup
  const [pointsPopup, setPointsPopup] = useState({ visible: false, message: "" });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const closeDropdown = () => {
    if (dropdown) {
      setDropdown(false);
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

  // Delete task function - Note: Children typically can't delete tasks assigned by parents
  // This is kept for UI purposes but may need to be restricted
  const deleteTask = async (dateKey: string, taskId: string) => {
    // Note: Task deletion would need backend API endpoint
    // For now, this is UI-only. Backend may restrict child from deleting parent-assigned tasks
    // Refresh tasks after attempting delete
    refreshTasks();
  };

  const handlePressTask = (taskId: string) => {
    closeDropdown();
    setShowDetails((prev) => (prev === taskId ? null : taskId));
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

// Helper function to format date - defined before useMemo
const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

// Transform tasks from TaskContext into tasksByDate format
const tasksByDateTransformed = useMemo(() => {
  const grouped: { [key: string]: Task[] } = {};
  
  contextTasks
    .filter((task) => task.type === 'task' || !task.type) // Only show tasks on todo list (filter out events)
    .forEach((task) => {
      // Use dueDate to group tasks by date (format: YYYY-MM-DD)
      const dateKey = task.dueDate ? task.dueDate.split('T')[0] : formatDateKey(new Date());
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      // Map TaskContext Task to local Task format
      // Map category to match todo categories
      let mappedCategory = task.category || 'Other';
      // Map "Other" to "Extra" to match todo categories
      if (mappedCategory === 'Other') {
        mappedCategory = 'Extra';
      }
      // Keep Extracurriculars as is (it's a valid category)
      
      // Preserve original category before completion
      const originalCategory = task.originalCategory || mappedCategory;
      
      // If task is completed, move it to "Completed" category
      // When uncompleted, it will go back to original category
      const displayCategory = task.completed ? 'Completed' : mappedCategory;
      
      grouped[dateKey].push({
        id: task.id.toString(),
        text: task.text,
        completed: task.completed,
        category: displayCategory, // Show in "Completed" if completed, otherwise original category
        originalCategory: originalCategory, // Preserve original category for when uncompleting
        description: task.description || '',
        points: task.points || 0,
        assignedByUserId: task.assignedByUserId, // Check if assigned by parent
      });
    });
  
  return grouped;
}, [contextTasks]);

// Get current date key and tasks for that date
const formattedKey = formatDateKey(currentDate);
// Use transformed tasks from TaskContext instead of mock data
const tasks = tasksByDateTransformed[formattedKey] || [];

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

// Handling Edit Save Logic - Note: Editing tasks may need backend update
  const handleEditSave = () => {
    if (taskToEdit) {
      // For now, just update local view - backend update would require API endpoint
      // TODO: Implement backend API for editing tasks if needed
      setEditModal(false);
      setTaskToEdit(null);
      // Refresh tasks from backend after editing
      refreshTasks();
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


// Update toggleComplete - use TaskContext instead of local state
const toggleComplete = async (taskId: string) => {
  try {
    const task = contextTasks.find(t => t.id.toString() === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }
    
    // Track achievement when task is being completed (before toggle)
    const wasCompleted = task.completed;
    
    // Use TaskContext's toggleComplete which syncs with backend
    await contextToggleComplete(taskId);
    
    // Track achievement when task is completed (was false, now true)
    if (!wasCompleted) {
      recordTaskCompletion();
    }
    
    // Refresh tasks to update the UI with new category (Completed or original)
    refreshTasks();
  } catch (error) {
    console.error('Error toggling task completion:', error);
  }
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
    // Use tasks from TaskContext for current date
    const currentDateTasks = tasksByDateTransformed[formattedKey] || [];
    const categoryTasks = currentDateTasks.filter((t) => t.category === category.id);
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
                <TouchableOpacity onPress={() => {
                  closeDropdown();
                  if (!task.completed) {
                    setTaskToConfirm(task);
                    setConfirmModal(true);
                  } else {
                    toggleComplete(task.id);
                  }
                }}
                >
                  <Ionicons
                    name={
                      task.completed ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={20}
                    color={task.completed ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
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
                      {task.text}
                    </Text>
                  </Pressable>
                
                {/* Task Details (description, points, delete button) */}
                {showDetails === task.id && (
                  <View style={{marginTop: 4}}>
                    <Text style={styles.detailText}>Description: {task.description}</Text>
                    <View style={styles.pointsBadge}>
                      <Text style={[styles.pointsText, { color: colors.primary }]}>{task.points} pts</Text>
                    </View>
                    {/* Only show edit/delete buttons if task was NOT assigned by a parent */}
                    {!task.assignedByUserId && (
                      <View style={styles.buttonRow}>
                        {/* Edit Button - only for non-completed, non-parent-assigned tasks */}
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
                        {/* Delete Button - only for non-parent-assigned tasks */}
                        <TouchableOpacity onPress={() => {setDeleteModal(true); setTaskDelete(task.id)}} style={styles.deleteButton}>
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
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
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Avatar */}
        <Image
          source={selectedPet?.image || { uri: "https://cdn-icons-png.flaticon.com/512/1067/1067840.png" }}
          style={styles.petImage}
          resizeMode="contain"
        />

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
        }}
      >
        <View style={styles.filterWrapper}>
          <TouchableOpacity onPress={toggleDropdown} style={styles.filterButton}>
            <Ionicons name="funnel-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.historyButton, { backgroundColor: colors.primary }]} 
            onPress={() => router.push("/(child)/(tabs)/todo/task-history" as any)}>
            <Text style={[styles.historyButtonText, { color: colors.text }]}>Task History</Text>
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

      {/* Completion Confirmation Modal */}
      <Modal visible={confirmModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          {taskToConfirm && (
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Complete this task?</Text>
              <Text style={styles.modalBodyText}>Task: {taskToConfirm.text}</Text>
              <Text style={styles.modalBodyText}>Description: {taskToConfirm.description}</Text>
              <Text style={styles.modalBodyText}>Points: {taskToConfirm.points}</Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity onPress={() => setConfirmModal(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    toggleComplete(taskToConfirm.id);
                    setConfirmModal(false);
                    setTaskToConfirm(null);
                  }}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    petImage: {
      width: 70,
      height: 70,
      marginRight: 16,
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
      justifyContent: 'space-between',
      flexDirection: 'row',
      width: '100%',
    },
    historyButton: {
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    historyButtonText: {
      fontSize: 14,
      fontWeight: '600',
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
      paddingBottom: 100,
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
