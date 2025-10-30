// Parent chooses which child to create a task for

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Select a Child</Text>

        {/* Arrow only shows when a child is selected */}
        {selectedChild && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() =>
              router.push({
                pathname: "./ParentCreateTaskScreen",
                params: { childId: selectedChild },
              })
            }
          >
            <Ionicons name="arrow-forward-circle" size={36} color="#52AFDD" />
          </TouchableOpacity>
        )}
      </View>

      {/* List of children */}
      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.childButton,
              selectedChild === item.id && styles.selectedChildButton,
            ]}
            onPress={() => handleSelectChild(item.id)}
          >
            <Text style={styles.childText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
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
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#0077B6",
  },
  nextButton: {
    padding: 5,
  },
  childButton: {
    padding: 18,
    backgroundColor: "#E1F5FE",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedChildButton: {
    borderColor: "red",
  },
  childText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0077B6",
  },
});
