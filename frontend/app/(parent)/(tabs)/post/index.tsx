// Parent chooses which child to create a task for

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";



const ParentSelectChildScreen = () => {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const children = [
    { id: "1", name: "Joey" },
    { id: "2", name: "Theodore" },
    { id: "3", name: "Madalynn" },
    { id: "4", name: "Rinsley" },
  ];

  
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const cardSize = (screenWidth - 60) / 2; // 2 cards per row with padding

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
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.childCard,
              { width: cardSize, height: cardSize },
              selectedChild === item.name && styles.selectedChild,
            ]}
            onPress={() => setSelectedChild(item.name)}
          >
            <View style={styles.cardContent}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={require('@/assets/images/defaultpp.jpg')}
                  style={styles.profileImage}
                  defaultSource={require('@/assets/images/defaultpp.jpg')}
                />
              </View>
              <Text style={styles.childName}>{item.name}</Text>
            </View>
            {selectedChild === item.name && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#0077B6" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {selectedChild && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() =>
            router.push({
              pathname: "/(parent)/(tabs)/post/parentcreatetaskscreen",
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
  row: {
    justifyContent: "space-between",
  },
  childCard: {
    backgroundColor: "#E1F5FE",
    borderRadius: 16,
    marginBottom: 15,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedChild: {
    borderColor: "#0077B6",
    backgroundColor: "#B3E5FC",
  },
  cardContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#0077B6",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  childName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0077B6",
    textAlign: "center",
  },
  checkmarkContainer: {
    position: "absolute",
    top: 8,
    right: 8,
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