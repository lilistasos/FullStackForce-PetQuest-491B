import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { usePet } from "@/contexts/PetContext";

export default function PetScreen() {
  const router = useRouter();
  const { selectedPet } = usePet();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.petName}>{selectedPet.name}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image source={selectedPet.image} style={styles.petImage} resizeMode="contain" />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push("/(indv)/(tabs)/pet/customize")}>
          <Text style={styles.buttonText}>Customize</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push("/(indv)/(tabs)/pet/shop")}>
          <Text style={styles.buttonText}>Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push("/(indv)/(tabs)/pet/collection")}>
          <Text style={styles.buttonText}>Collection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  header: {
    width: "100%",
    paddingTop: 20,
    alignItems: "center",
  },
  petName: {
    fontSize: 34,
    fontWeight: "bold",
    fontFamily: "monospace",
    marginTop: 20,
    textAlign: "center",
    marginBottom: 0.05,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  petImage: {
    width: 300,
    height: 300,
  },
  buttonContainer: {
    width: "80%",
    alignItems: "center",
    marginBottom: 40,
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: "#7B4FDD",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
    marginHorizontal: 20,
  },
  buttonText: {
    fontFamily: "monospace",
    fontSize: 24,
    color: "#000",
  },
});
