// Parent chooses which child to create a task for

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// or import ParentCreateTaskScreen if that’s what you want to see

const ParentSelectChildScreen = () => {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const children = [
    { id: "1", name: "Joey" },
    { id: "2", name: "Theodore" },
    { id: "3", name: "Madalynn" },
    { id: "3", name: "Rinsley" },
  ];

  
  const router = useRouter();

  const handleSelectChild = (childId: string) => {
    setSelectedChild(childId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>
        {selectedChild ? `Create a task for ${selectedChild}` : "Select a child to create a task"}
      </Text>

      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.childButton,
              selectedChild === item.name && styles.selectedChild,
            ]}
            onPress={() => setSelectedChild(item.name)}
          >
            <Text style={styles.childText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedChild && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() =>
            router.push({
              pathname: "./ParentCreateTaskScreen",
              params: { childName: selectedChild },
            })
          }
        >
          <Text style={styles.nextArrow}>→</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default ParentSelectChildScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    fontSize: 22,
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
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedChild: {
    borderColor: "red",
  },
  childText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0077B6",
    textAlign: "center",
  },
  nextButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#0077B6",
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  nextArrow: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
});