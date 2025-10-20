import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet,  Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const ToDoScreen = ()=> {

// Current Date State
// useState hook to store the current date and update it... allows the app to display and maipulate the date dynamically 
  const [currentDate, setCurrentDate] = useState(new Date());

// States for Categories
// expanded state object to track which categories are currently expanded or collapsed
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
    Homework: false, // All categories are collaspsed at first
    Chores: false,
    Extracurriculars: false,
    Completed: false,
});
// Helper functions for changing date
// Able to move back and forth between days 
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
}
//Format dates
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }); 
  const categories = [
    { id: "Homework", title: "Homework" },
    { id: "Chores", title: "Chores" },
    { id: "Extracurriculars", title: "Extracurriculars" },
    { id: "Completed", title: "Completed" },
  ];
  const renderCategory = (category: { id: string; title: string }) => {
    const isExpanded = expanded[category.id];
    const visibleTasks = isExpanded ? 6 : 3;

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

        {/* Expanded View (Blank Task Slots) */}
        {isExpanded && (
          <View style={styles.taskList}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={styles.taskItem}>
                <Ionicons name="ellipse-outline" size={18} color="gray" />
                <View style={styles.taskLine} />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>To-Do</Text>

        {/* Date Navigation */}
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => changeDate(-1)}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>

          <View style={styles.dateTextWrapper}>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          <TouchableOpacity onPress={() => changeDate(1)}>
            <Ionicons name="chevron-forward" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Categories List */}
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
  header: {
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  dateTextWrapper: {
    backgroundColor: "#E8F4FA",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
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
    alignItems: "center",
    marginVertical: 6,
  },
  taskLine: {
    height: 1,
    backgroundColor: "#ddd",
    flex: 1,
    marginLeft: 8,
  },
});
