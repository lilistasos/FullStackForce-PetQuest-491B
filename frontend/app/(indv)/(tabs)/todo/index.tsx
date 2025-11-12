import React, { useState, useRef, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable, Modal, TextInput, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTasks } from "@/contexts/TaskContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { usePet } from "@/contexts/PetContext";

// Defines what a task looks like
type Task = {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  originalCategory?: string;
  description: string;
  points: number;
};

const ToDoScreen = ()=> {
  const { getTasksByChild, toggleComplete: contextToggleComplete } = useTasks();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { selectedPet } = usePet();
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

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
    Extracurriculars: false,
    Completed: false,
});

const [tasksByDate, setTasksByDate] = useState<{
  [key: string]: Task[];
}>({
  "2025-10-20": [
    { id: "1", text: "Read ch.1", completed: false, category: "Homework", description: "Read chapter 1 of history textbook", points: 10 },
    { id: "2", text: "Clean kitchen", completed: false, category: "Chores", description: "Wash dishes and wipe counters", points: 5 },
    { id: "3", text: "Clean room", completed: false, category: "Chores", description: "Tidy up and vacuum", points: 5 },
    { id: "4", text: "Wash dishes", completed: false, category: "Chores", description: "Clean dirty dishes", points: 5 },
    { id: "5", text: "Laundry", completed: false, category: "Chores", description: "Wash and fold clothes", points: 5 },
  ],
  "2025-10-21": [
    { id: "6", text: "Math worksheet", completed: false, category: "Homework", description: "Complete assigned math worksheet", points: 10 },
    { id: "7", text: "Soccer practice", completed: false, category: "Extracurriculars", description: "Attend soccer practice", points: 15 },
  ],
  "2025-10-22": [
    { id: "8", text: "Take out trash", completed: false, category: "Chores", description: "Take out household trash", points: 5 },
  ],
});

// Converts current date to a string
const formatDateKey = (date: Date) => date.toISOString().split("T")[0];
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

// The four categories for tasks
  const categories = [
    { id: "Homework", title: "Homework" },
    { id: "Chores", title: "Chores" },
    { id: "Extracurriculars", title: "Extracurriculars" },
    { id: "Completed", title: "Completed" },
  ];
  const renderCategory = (category: { id: string; title: string }) => {
    const isExpanded = expanded[category.id];
    const tasks = tasksByDate[formattedKey] || [];
    const categoryTasks = tasks.filter((t) => t.category === category.id);
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
                    <TouchableOpacity onPress={() => {setDeleteModal(true); setTaskDelete(task.id)}} style={styles.deleteButton}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
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
    deleteButton: {
      backgroundColor: "#FF4D4D",
      padding: 10,
      marginHorizontal: 0,
      borderRadius: 5,
      marginTop: 6,
      alignSelf: "flex-start",
    },
    deleteButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    editButton: {
      padding: 10,
      borderRadius: 5,
      marginTop: 6,
      alignSelf: "flex-start",
    },
    editButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
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
