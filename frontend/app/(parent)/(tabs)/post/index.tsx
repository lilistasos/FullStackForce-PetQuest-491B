// Parent chooses which child to create a task for

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const ParentSelectChildScreen = () => {
  const [children] = useState([
    { id: "1", name: "Joey" },
    { id: "2", name: "Theodore" },
    { id: "3", name: "Madalynn" },
    { id: "4", name: "Rinsley" },
  ]);

  
  const router = useRouter();

  return ( 
    <View> 
      <Text>Select a Child</Text>
      <TouchableOpacity onPress={() => router.push("./ParentCreateTaskScreen")}>
        <Text>→</Text>
      </TouchableOpacity> 
    </View> ); 
    };

export default ParentSelectChildScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#0077B6",
    marginBottom: 30,
  },
  childButton: {
    padding: 18,
    backgroundColor: "#E1F5FE",
    borderRadius: 10,
    marginBottom: 15,
  },
  childText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0077B6",
  },
});