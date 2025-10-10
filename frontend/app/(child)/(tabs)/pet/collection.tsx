import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function CollectionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pet Collection</Text>
      <Text style={styles.subtitle}>View all your pets and items!</Text>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "monospace",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "monospace",
    color: "#666",
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: "#52AFDD",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    fontFamily: "monospace",
    fontSize: 20,
    color: "#000",
  },
});