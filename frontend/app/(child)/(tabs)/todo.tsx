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

  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Read ch.1", completed: false, category: "Homework"}
  ]);
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

  const toggleComplete = (taskId: string) =>{
    
  };

  const categories = [
    { id: "Homework", title: "Homework" },
    { id: "Chores", title: "Chores" },
    { id: "Extracurriculars", title: "Extracurriculars" },
    { id: "Completed", title: "Completed" },
  ];
  const renderCategory = (category: { id: string; title: string }) => {
    const isExpanded = expanded[category.id];
    const visibleTasks = isExpanded ? 6 : 3; // shows three tasks then can expand into more

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

        {/* Placeholder Task Lines */}
        <View style={styles.taskList}>
          {[...Array(visibleTasks)].map((_, i) => (
            <View key={i} style={styles.taskItem}>
              <Ionicons name="ellipse-outline" size={18} color="gray" />
              <View style={styles.taskLine} />
            </View>
          ))}
        </View>
      </View>
    );
  };

    return (
      <SafeAreaView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          {/* Top row: avatar + date + arrows */}
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
  
        {/* Task Categories */}
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
      marginTop: 20,
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