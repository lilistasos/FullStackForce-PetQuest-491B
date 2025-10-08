import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from "react-native";

const todo = ()=> {

// Current Date State
  const [currentDate, setCurrentDate] = useState(new Date());

// States for Categories
const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
  Homework: false,
  Chores: false,
  Completed: false,
});
// Helper functions for changing date
const changeDate = (days: number) => {
  const newDate = new Date(currentDate);
  newDate.setDate(newDate.getDate() + days);
  setCurrentDate(newDate);
}

}