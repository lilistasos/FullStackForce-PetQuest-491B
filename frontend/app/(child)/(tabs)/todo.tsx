import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from "react-native";

const todo = () => {
  // Shows current date
  const [currentDate, setCurrentDate] = useState(new Date());

// Categories of tasks
const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
  Homework: false,
  Chores: false,
  Completed: false,
});
}