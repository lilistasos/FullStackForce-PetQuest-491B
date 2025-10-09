import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function PetScreen() {
  const router = useRouter();

  const pet = {
    name: "Pet Name!",
    image: require("@/assets/images/example.png"),
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.petName}>{pet.name}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image source={pet.image} style={styles.petImage} resizeMode="contain" />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push("../(pet-pages)/customize")}>
          <Text style={styles.buttonText}>Customize</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push("/(pet-pages)/shop")}>
          <Text style={styles.buttonText}>Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push("../(pet-pages)/collection")}>
          <Text style={styles.buttonText}>Name’s Pet</Text>
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
    marginBottom: .05,
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
  },
  button: {
    backgroundColor: "#52AFDD",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "monospace",
    fontSize: 24,
    color: "#000",
  },
});
