import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet,  Image, ScrollView, Pressable, Modal } from "react-native";
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

  const [showDetails, setShowDetails] = useState<string | null>(null);
  const dropdownOptions = ["Default", "Points: High to Low", "Points: Low to High"];
  
  const [dropdown, setDropdown] = useState(false);
  const [sortType, setSortType] = useState(dropdownOptions[0]);
  const [modal, setModal] = useState(false);

  const handlePressTask = (taskId: string) => {
    setShowDetails((prev) => (prev === taskId ? null : taskId)
   );
  };

  const toggleDropdown = () => {
    setDropdown((prev) => !prev);
  };

// States for Categories
// expanded state object to track which categories are currently expanded or collapsed
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
    Homework: false, // All categories are collaspsed at first
    Chores: false,
    Extracurriculars: false,
    Completed: false,
});

const taskList = {
  "2025-10-20": [
    { id: "1", text: "Read ch.1", completed: false, category: "Homework", description: "Read chapter 1 of history textbook", points: 10 },
    { id: "2", text: "Clean kitchen", completed: false, category: "Chores", description: "Wash dishes and wipe counters", points: 5 },
    { id: "3", text: "Clean room", completed: false, category: "Chores", description: "Tidy up and vacuum", points: 5 },
    { id: "4", text: "Wash dishes", completed: false, category: "Chores", description: "Clean dirty dishes", points: 10 },
    { id: "5", text: "Laundry", completed: false, category: "Chores", description: "Wash and fold clothes", points: 5 },
  ],
  "2025-10-21": [
    { id: "6", text: "Math worksheet", completed: false, category: "Homework", description: "Complete assigned math worksheet", points: 10 },
    { id: "7", text: "Soccer practice", completed: false, category: "Extracurriculars", description: "Attend soccer practice", points: 15 },
  ],
  "2025-10-22": [
    { id: "8", text: "Take out trash", completed: false, category: "Chores", description: "Take out household trash", points: 5 },
  ],
}

const [tasksByDate, setTasksByDate] = useState<{
  [key: string]: Task[];
}>(taskList);
const [originalTasksByDate] = useState(taskList);

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

const handleSort = (sortType: React.SetStateAction<string>) => {
    setSortType(sortType);
    setDropdown(false);
    const sortedTasks = {...tasksByDate}
    switch(sortType) {
    case (dropdownOptions[0]):
      setTasksByDate(originalTasksByDate);
      break;
    case (dropdownOptions[1]):
      Object.keys(sortedTasks).forEach((date) => {
        sortedTasks[date] = [...sortedTasks[date]].sort((a, b) => b.points - a.points);
      })
      setTasksByDate(sortedTasks);
      break;
    case (dropdownOptions[2]):
      Object.keys(sortedTasks).forEach((date) => {
        sortedTasks[date] = [...sortedTasks[date]].sort((a, b) => a.points - b.points);
      })
      setTasksByDate(sortedTasks);
      break;
    default:
      break;
    }
  };

  const deleteTask = (date: string, taskId: string) => {
    setTasksByDate((prev) => {
      const updatedTasks = prev[date].filter(task => task.id !== taskId);
      return {...prev, [date]: updatedTasks };
    })
  }

// The four categories for tasks
  const categories = [
    { id: "Homework", title: "Homework" },
    { id: "Chores", title: "Chores" },
    { id: "Extracurriculars", title: "Extracurriculars" },
    { id: "Completed", title: "Completed" },
  ];
  const renderCategory = (category: { id: string; title: string }) => {
    const isExpanded = expanded[category.id];
    const allTasks = Object.values(tasksByDate).flat();
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
                <TouchableOpacity onPress={() => toggleComplete(task.id)}>
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
                
                {showDetails === task.id && (
                  <View style={{marginTop: 4}}>
                    <Text style={{color: "#555"}}>Description: {task.description}</Text>
                    <Text style={{color: "#555"}}>Points: {task.points}</Text>
                    <TouchableOpacity onPress={() => {setModal(true);}} style={styles.deleteButton}>
                      <Text>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={modal}
                  onRequestClose={() => {
                  setModal(!modal);
                }}
                >
                  <View style={{flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20, margin: 20, borderColor: "#ccc", borderWidth: 1, borderRadius: 10}}>
                    <Text style={{fontSize: 18, fontWeight: "600", marginBottom: 10}}>Are you sure you want to delete? You won't get the points for this task if you do.</Text>
                    <View style={{flexDirection: "row", justifyContent: "space-between", width: "100%"}}>
                      <TouchableOpacity onPress={() => setModal(false)} style={{backgroundColor: "#888", padding: 10, marginHorizontal: 10, borderRadius: 5, marginTop: 6}}>
                        <Text style={{color: 'white'}}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteButton} onPress={() => {
                        deleteTask(formattedKey, task.id);
                        setModal(false);}}>
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

      <View style={{flex: 1, flexDirection: "row", justifyContent: "flex-end", padding: 10, marginBottom: 10, position: "relative", zIndex: 1}}>
        <TouchableOpacity onPress={toggleDropdown}>
          <Ionicons name="funnel-outline" size = {20} color="gray"/>
        </TouchableOpacity>
        {dropdown && (
          <View style={{position: "absolute", top: 40, right: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 6, zIndex: 1000}}>
            <TouchableOpacity onPress={() => handleSort(dropdownOptions[0])} style={{padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee"}}>
              <Text>Default</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSort(dropdownOptions[1])} style={{padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee"}}>
              <Text>Points: High to Low</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSort(dropdownOptions[2])} style={{padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee"}}>
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
    marginTop: 6
  },
});
