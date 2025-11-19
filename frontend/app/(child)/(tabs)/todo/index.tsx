import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet,  Image, ScrollView, Pressable, Modal, TextInput, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTasks } from "@/contexts/TaskContext";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";

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
  const router = useRouter();

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
                
                {/* Task Details (description, points, delete button) */}
                {showDetails === task.id && (
                  <View style={{marginTop: 4}}>
                    <Text style={{color: "#555"}}>Description: {task.description}</Text>
                    <Text style={{color: "#555"}}>Points: {task.points}</Text>
                    <TouchableOpacity onPress={() => {setDeleteModal(true); setTaskDelete(task.id)}} style={styles.deleteButton}>
                      <Text>Delete</Text>
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
                        style={{ backgroundColor: "#0077B6", padding: 10, borderRadius: 5, marginTop: 6 }}
                      >
                        <Text style={{ color: "white" }}>Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Delete Confirmation Modal */}
                
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={deleteModal}
                  onRequestClose={() => {
                  setDeleteModal(!deleteModal);
                }}
                >
                  <View style={styles.deleteModalContainer}>
                    <Text style={styles.deleteModalText}>Are you sure you want to delete? You won't get the points for this task if you do.</Text>
                    <View style={{flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 10}}>
                      <TouchableOpacity onPress={() => setDeleteModal(false)} style={styles.cancelDeleteButton}>
                        <Text style={{color: 'white'}}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteButton} onPress={() => {
                        if (taskDelete)
                        deleteTask(formattedKey, taskDelete);
                        setDeleteModal(false);
                        setTaskDelete(null);}}>
                        <Text style={{color: 'white'}}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
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

      {/* Edit Task Modal */}
      <Modal visible={editModal} animationType="slide" transparent={true}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Edit Task</Text>
          <TextInput placeholder="Task name" value={editText} onChangeText={setEditText} style={styles.input} />
          <TextInput placeholder="Description" value={editDescription} onChangeText={setEditDescription} style={styles.input} />
          <TextInput placeholder="Points" keyboardType="numeric" value={editPoints} onChangeText={setEditPoints} style={styles.input} />
          <View style={styles.modalButtonRow}>
            <TouchableOpacity onPress={() => setEditModal(false)} style={styles.cancelButton}>
              <Text style={{ color: "white" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEditSave} style={styles.saveButton}>
              <Text style={{ color: "white" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                  onPress={() => {
                    toggleComplete(taskToConfirm.id);
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
        {/* <View style={{flex:1, flexDirection: 'row', alignItems: 'center'}}> */}
        <TouchableOpacity style={{alignItems: 'center', backgroundColor: 'gray'}} onPress={() => router.push("/(child)/(tabs)/todo/task-history")}>
          <Text style={{fontSize: 20}}>Task History</Text>
        </TouchableOpacity>
        {/* </View> */}
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
  deleteButton: {
    backgroundColor:"#FF0000", 
    padding: 10, 
    marginHorizontal:10, 
    borderRadius: 5,
    marginTop: 6,
    alignSelf: "flex-start"
  },
  cancelDeleteButton: {
    backgroundColor: "#888", 
    padding: 10, 
    marginHorizontal: 10, 
    borderRadius: 5, 
    marginTop: 6
  },
  dropdownContainer: {
    flex: 1, 
    flexDirection: "row", 
    justifyContent: "flex-end", 
    padding: 10, 
    marginBottom: 10, 
    position: "relative", 
    zIndex: 999,
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
  deleteModalContainer: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "white", 
    padding: 35, 
    margin: 20, 
    marginTop: "75%",
    marginBottom: "75%",
    borderColor: "#888", 
    borderWidth: 1, 
    borderRadius: 10,
  },
  deleteModalText: {
    fontSize: 18, 
    fontWeight: "600", 
    marginBottom: 10, 
    textAlign: "center"
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
  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 5, 
    padding: 8, 
    width: "100%", 
    marginBottom: 8 
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
