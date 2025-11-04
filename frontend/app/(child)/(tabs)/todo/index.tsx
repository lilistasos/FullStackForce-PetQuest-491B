import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet,  Image, ScrollView, Pressable, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";


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

// Current Date State
// useState hook to store the current date and update it... allows the app to display and maipulate the date dynamically 
  const [currentDate, setCurrentDate] = useState(new Date());

  //const [showDetails, setShowDetails] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

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

// States for editting modal
  const [editModal, setEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editText, setEditText] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPoints, setEditPoints] = useState("");
  
// States for completion confirmation
  const [confirmModal, setConfirmModal] = useState(false);
  const [taskToConfirm, setTaskToConfirm] = useState<Task | null>(null);

const [tasksByDate, setTasksByDate] = useState<{
  [key: string]: Task[];
}>({
  "2025-11-02": [
    { id: "1", text: "Read ch.1", completed: false, category: "Homework", description: "Read chapter 1 of history textbook", points: 10 },
    { id: "2", text: "Clean kitchen", completed: false, category: "Chores", description: "Wash dishes and wipe counters", points: 5 },
    { id: "3", text: "Clean room", completed: false, category: "Chores", description: "Tidy up and vacuum", points: 5 },
    { id: "4", text: "Wash dishes", completed: false, category: "Chores", description: "Clean dirty dishes", points: 5 },
    { id: "5", text: "Laundry", completed: false, category: "Chores", description: "Wash and fold clothes", points: 5 },
  ],
  "2025-11-03": [
    { id: "6", text: "Math worksheet", completed: false, category: "Homework", description: "Complete assigned math worksheet", points: 10 },
    { id: "7", text: "Soccer practice", completed: false, category: "Extracurriculars", description: "Attend soccer practice", points: 15 },
  ],
  "2025-11-04": [
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

// When a user taps tasks it is moved to completed and can be moved back if not
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
    const categoryTasks = tasks.filter((t) => t.category === category.id);
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
                  {task.text}
                </Text>
                </Pressable>
                {showDetails === task.id && (
                  <View style={{marginTop: 4}}>
                    <Text style={{color: "#555"}}>Description: {task.description}</Text>
                    <Text style={{color: "#555"}}>Points: {task.points}</Text>
                    {/* Edit Button */}
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
});
