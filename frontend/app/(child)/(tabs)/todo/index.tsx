import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet,  Image, ScrollView, Pressable, Modal, TextInput, Animated, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return __DEV__ ? "http://10.0.2.2:4000" : "http://10.0.2.2:4000";
  } else if (Platform.OS === 'ios') {
    return __DEV__ ? "http://localhost:4000" : "http://localhost:4000";
  } else {
    return "http://localhost:4000";
  }
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
  date?: string;
  time?: string;
};

const ToDoScreen = ()=> {
  const { user, token } = useAuth();

  // Current Date State
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showDetails, setShowDetails] = useState<string | null>(null);
  const dropdownOptions = ["Default", "Points: High to Low", "Points: Low to High"];
  
  //states for sort dropdown
  const [dropdown, setDropdown] = useState(false);
  const [sortType, setSortType] = useState(dropdownOptions[0]);

  //states for confirm modal
  const [confirmModal, setConfirmModal] = useState(false);
  const [taskToConfirm, setTaskToConfirm] = useState<Task | null>(null);

  //states for points popup
  const [pointsPopup, setPointsPopup] = useState({ visible: false, message: "" });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Role check - only children can use this screen
  if (user && user.role !== 'child') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 18, textAlign: 'center' }}>
            This screen is only available for child accounts
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Dropdown toggle function
  const toggleDropdown = () => {
    setDropdown((prev) => !prev);
  };

  // Handle sort selection
  const handleSort = (option: string) => {
    setSortType(option);
    setDropdown(false);
  };

  const handlePressTask = (taskId: string) => {
    setShowDetails((prev) => (prev === taskId ? null : taskId)
    );
  }

  // States for Categories
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
    Homework: false,
    Chores: false,
    Extracurriculars: false,
    Practice: false,
    Appointments: false,
    Other: false,
    Completed: false,
  });

  const [tasksByDate, setTasksByDate] = useState<{
    [key: string]: Task[];
  }>({});

  // Converts current date to a string
  const formatDateKey = (date: Date) => date.toISOString().split("T")[0];
  const formattedKey = formatDateKey(currentDate);
  const tasks = tasksByDate[formattedKey] || [];

  // Fetch tasks from API
  const fetchTasks = async () => {
    if (!user || !token || user.role !== 'child') return;
    
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/tasks/my-assigned-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const tasks = await response.json();
      
      // Transform tasks to the format expected by the to-do list
      const tasksByDate: { [key: string]: Task[] } = {};

      tasks.forEach((task: any) => {
        const dateKey = task.date || formatDateKey(new Date()); // Use current date if no date specified
        if (!tasksByDate[dateKey]) {
          tasksByDate[dateKey] = [];
        }
        
        tasksByDate[dateKey].push({
          id: task.id.toString(),
          text: task.text,
          completed: task.completed || false,
          category: task.category || 'Other',
          description: task.description || '',
          points: task.points || 0,
          date: task.date,
          time: task.time || 'All Day',
        });
      });

      setTasksByDate(tasksByDate);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  // Load tasks when component mounts or user changes
  useEffect(() => {
    if (user && token) {
      fetchTasks();
    }
  }, [user, token, currentDate]);

  // Complete task function
  const completeTask = async (taskId: string) => {
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
        throw new Error('Failed to complete task');
      }

      const result = await response.json();
      
      // Update local state
      setTasksByDate((prev) => {
        const updatedDayTasks = (prev[formattedKey] || []).map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              completed: true,
              category: "Completed",
            };
          }
          return task;
        });
        return { ...prev, [formattedKey]: updatedDayTasks };
      });

      // Show points popup
      showPopup(result.message || `You earned ${result.pointsEarned} points!`);
      return result.pointsEarned;
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task');
      return 0;
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

  // Toggle task completion
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

  // Helper functions for changing date
  // Able to move back and forth between days 
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  }

  //Format date in a 3 line stagger
  const weekday = currentDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = currentDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const year = currentDate.getFullYear();

  // The categories for tasks
  const categories = [
    { id: "Homework", title: "Homework" },
    { id: "Chores", title: "Chores" },
    { id: "Extracurriculars", title: "Extracurriculars" },
    { id: "Practice", title: "Practice" },
    { id: "Appointments", title: "Appointments" },
    { id: "Other", title: "Other" },
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
          onPress={() =>
            setExpanded((prev) => ({ ...prev, [category.id]: !prev[category.id] }))
          }
        >
          <Ionicons
            name={isExpanded ? "chevron-down" : "chevron-forward"}
            size={20}
            color="black"
          />
          <Text style={styles.cardTitle}>{category.title}</Text>
        </TouchableOpacity>

        {/* Task List ; displays expanded or unexpanded list*/}
        
        <View style={styles.taskList}>
          {visibleTasks.length > 0 ? (
            visibleTasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <TouchableOpacity onPress={() => {
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
                    color={task.completed ? "#0077B6" : "gray"}
                  />
                </TouchableOpacity>
                <View style={{flex: 1, flexDirection: "column", marginLeft: 8}}>
                <Pressable onPress={() => handlePressTask(task.id)}>
                <Text
                  style={[
                    styles.taskText,
                    task.completed && { textDecorationLine: "line-through" },
                  ]}
                >
                  <Ionicons
                    name={showDetails === task.id ? "chevron-down" : "chevron-forward"}
                    size={16}
                    color="gray"
                    style={{marginRight: 6}}
                  />
                  {task.text}
                  
                </Text>
                </Pressable>
                
                {/* Task Details (description, points) */}
                {showDetails === task.id && (
                  <View style={{marginTop: 4}}>
                    <Text style={{color: "#555"}}>Description: {task.description}</Text>
                    <Text style={{color: "#555"}}>Points: {task.points}</Text>
                    {task.time && task.time !== 'All Day' && (
                      <Text style={{color: "#555"}}>Time: {task.time}</Text>
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
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
      </View>

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          {/* Avatar */}
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/1067/1067840.png",
            }}
            style={styles.avatar}
          />

          {/* Date (centered + stacked) */}
          <View style={styles.dateSection}>
            <Text style={styles.weekday}>{weekday}</Text>
            <Text style={styles.monthDay}>{monthDay},</Text>
            <Text style={styles.year}>{year}</Text>
          </View>

          {/* Date navigation arrows */}
          <View style={styles.arrowContainer}>
            <TouchableOpacity onPress={() => changeDate(-1)}>
              <Ionicons name="chevron-back" size={26} color="#0077B6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeDate(1)}>
              <Ionicons name="chevron-forward" size={26} color="#0077B6" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/*Dropdown for sorting tasks */}

      <View style={styles.dropdownContainer}>
        <TouchableOpacity onPress={toggleDropdown}>
          <Ionicons name="funnel-outline" size = {20} color="gray"/>
        </TouchableOpacity>
        {dropdown && (
          <View style={styles.dropdown}>
            <TouchableOpacity onPress={() => handleSort(dropdownOptions[0])} style={styles.dropdownOption}>
              <Text>Default</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSort(dropdownOptions[1])} style={styles.dropdownOption}>
              <Text>Points: High to Low</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSort(dropdownOptions[2])} style={styles.dropdownOption}>
              <Text>Points: Low to High</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Task Categories; renders all categories vertically,flatlist for efficient scrolling */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderCategory(item)}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Completion Confirmation Modal */}
      <Modal visible={confirmModal} animationType="slide" transparent={true}>
        <View style={styles.modalBox}>
          {taskToConfirm && (
            <>
              <Text style={styles.modalTitle}>Complete this task?</Text>
              <Text>Task: {taskToConfirm.text}</Text>
              <Text>Description: {taskToConfirm.description}</Text>
              <Text>Points: {taskToConfirm.points}</Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity onPress={() => setConfirmModal(false)} style={styles.cancelButton}>
                  <Text style={{ color: "white" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    await completeTask(taskToConfirm.id);
                    setConfirmModal(false);
                    setTaskToConfirm(null);
                  }}
                  style={styles.saveButton}
                >
                  <Text style={{ color: "white" }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  topBar: {
    alignItems: "center",
    marginTop: 15,
  },
  topTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },
  header: {
    marginTop: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  dateSection: {
    alignItems: "center",
    flex: 1,
  },
  weekday: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  monthDay: {
    fontSize: 18,
    color: "#333",
  },
  year: {
    fontSize: 18,
    color: "#333",
  },
  arrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "600",
  },
  taskList: {
    marginTop: 10,
    paddingLeft: 24,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 6,
  },
  taskText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    fontStyle: "italic",
    color: "#aaa",
    marginLeft: 30,
    marginTop: 6,
  },
  moreText: {
    marginTop: 4,
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  dropdownContainer: {
    flex: 1, 
    flexDirection: "row", 
    justifyContent: "flex-end", 
    padding: 10, 
    marginBottom: 10, 
    position: "relative", 
    zIndex: 1
  },
  dropdownOption: {
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: "#eee"
  },
  dropdown: {
    position: "absolute", 
    top: 40, 
    right: 10, 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 6, 
    zIndex: 1000
  },
  modalBox: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "white", 
    margin: 20, 
    borderRadius: 10, 
    padding: 20 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    marginBottom: 10 
  },
  modalButtonRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    width: "100%", 
    marginTop: 10 
  },
  cancelButton: { 
    backgroundColor: "#888", 
    padding: 10, 
    borderRadius: 5 
  },
  saveButton: { backgroundColor: "#0077B6", 
    padding: 10, 
    borderRadius: 5 
  },
  pointsPopup: {
  position: "absolute",
  bottom: 100,
  alignSelf: "center",
  backgroundColor: "#0077B6",
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
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});