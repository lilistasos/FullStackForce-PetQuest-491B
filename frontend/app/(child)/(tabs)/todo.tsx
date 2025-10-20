import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";

const todo = ()=> {

// Current Date State
// useState hook to store the current date and update it... allows the app to display and maipulate the date dynamically 
  const [currentDate, setCurrentDate] = useState(new Date());

// States for Categories
// expanded state object to track which categories are currently expanded or collapsed
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
    Homework: false, // All categories are collaspsed at first
    Chores: false,
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
    { id: "Completed", title: "Completed" },
  ];
  const renderCategory = (category: { id: string; title: string }) => {
    const isExpanded = expanded[category.id];

    return (
      <View style={styles.card}>
        {/* Header row */}
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

        {/* Expanded area */}
        {isExpanded && (
          <View style={styles.taskList}>
            {/* 3 blank task slots */}
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
};
