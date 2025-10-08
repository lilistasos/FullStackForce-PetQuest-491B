import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

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
  const formattedDate = currentDate.toLocaleDateString("en-US" {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }); 
  const categories = [
    { id: "Homework", title: "Homework" },
    { id: "Chores", title: "Chores" },
    { id: "Completed", title: "Completed" },
  ]  
};