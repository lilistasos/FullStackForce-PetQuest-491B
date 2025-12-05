import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Modal, TextInput, Animated, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from 'expo-router';
import { useTasks } from "@/contexts/TaskContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodoCategoryPreferences } from '../account/preferences';
import { getApiUrl } from '@/utils/api';

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
  const { user, token } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

  // Current Date State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Child selection state
  const [selectedChild, setSelectedChild] = useState<string>("All");
  const [childSelectorOpen, setChildSelectorOpen] = useState(false);
  const [children, setChildren] = useState<Array<{id: number, firstName: string, lastName: string}>>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

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

  // Delete task function - sync with backend
  const deleteTask = async (taskId: string) => {
    if (!token) return;
    
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Refresh tasks from backend
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
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
      fetchChildren();
      fetchTasks();
    }, [loadCategoryPreferences])
  );

  // Fetch children from backend
  const fetchChildren = async () => {
    if (!user || user.role !== 'parent' || !token) return;
    
    try {
      setLoadingChildren(true);
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/users/children`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }

      const childrenData = await response.json();
      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
      Alert.alert('Error', 'Failed to load children');
    } finally {
      setLoadingChildren(false);
    }
  };

  // Fetch tasks from backend
  const fetchTasks = async () => {
    if (!user || user.role !== 'parent' || !token) return;
    
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const tasks = await response.json();
      
      // Transform backend tasks to local format, filter to show only tasks (not events)
      const tasksByDateMap: { [key: string]: Task[] } = {};
      
          tasks
        .filter((task: any) => task.type === 'task' || !task.type) // Only show tasks, not events
        .forEach((task: any) => {
          const dateKey = task.dueDate ? task.dueDate.split('T')[0] : formatDateKey(new Date());
          
          if (!tasksByDateMap[dateKey]) {
            tasksByDateMap[dateKey] = [];
          }
          
          // Map category to match todo categories
          let mappedCategory = task.category || 'Other';
          if (mappedCategory === 'Other') {
            mappedCategory = 'Extra';
          }
          
          const displayCategory = task.completed ? 'Completed' : mappedCategory;
          
          // Get child name - match format used in child selector (full name)
          let childName = 'Unknown';
          if (task.assignedToName) {
            // Find matching child by first name to get full name
            const child = children.find(c => c.firstName === task.assignedToName);
            childName = child ? `${child.firstName} ${child.lastName}` : task.assignedToName;
          }
          
          tasksByDateMap[dateKey].push({
            id: task.id.toString(),
            text: task.text,
            completed: task.completed,
            category: displayCategory,
            originalCategory: mappedCategory,
            description: task.description || '',
            points: task.points || 0,
            childName: childName,
          });
        });
      
      setTasksByDate(tasksByDateMap);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  // Load children on mount
  useEffect(() => {
    if (user && user.role === 'parent' && token) {
      fetchChildren();
    }
  }, [user, token]);

  // Refetch tasks when children are loaded (to get proper child names)
  useEffect(() => {
    if (children.length > 0 && user && user.role === 'parent' && token) {
      fetchTasks();
    }
  }, [children.length, user, token]);

// Converts current date to a string
const formatDateKey = (date: Date) => date.toISOString().split("T")[0];
const todayKey = formatDateKey(new Date());

const [tasksByDate, setTasksByDate] = useState<{
  [key: string]: Task[];
}>({});

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

// Handling Edit Save Logic - sync with backend
  const handleEditSave = async () => {
    if (!taskToEdit || !token) return;
    
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/tasks/${taskToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editText,
          description: editDescription,
          points: parseInt(editPoints) || taskToEdit.points,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Refresh tasks from backend
      await fetchTasks();
      setEditModal(false);
      setTaskToEdit(null);
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
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


// Update toggleComplete - sync with backend
const toggleComplete = async (taskId: string) => {
  if (!token) return;
  
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to toggle task completion');
    }

    // Refresh tasks from backend
    await fetchTasks();
  } catch (error) {
    console.error('Error toggling task completion:', error);
    Alert.alert('Error', 'Failed to update task');
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
                <TouchableOpacity onPress={() => toggleComplete(task.id)}>
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
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
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
                <TouchableOpacity
                  style={[
                    styles.childOption,
                    selectedChild === "All" && styles.childOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedChild("All");
                    setChildSelectorOpen(false);
                  }}
                >
                  <Text style={[
                    styles.childOptionText,
                    selectedChild === "All" && { color: colors.primary }
                  ]}>All</Text>
                  {selectedChild === "All" && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
                {children.map((child) => {
                  const childName = `${child.firstName} ${child.lastName}`;
                  return (
                    <TouchableOpacity
                      key={child.id}
                      style={[
                        styles.childOption,
                        selectedChild === childName && styles.childOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedChild(childName);
                        setChildSelectorOpen(false);
                      }}
                    >
                      <Text style={[
                        styles.childOptionText,
                        selectedChild === childName && { color: colors.primary }
                      ]}>{childName}</Text>
                      {selectedChild === childName && (
                        <Ionicons name="checkmark" size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
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
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={async () => {
                if (taskDelete) {
                  await deleteTask(taskDelete);
                }
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
