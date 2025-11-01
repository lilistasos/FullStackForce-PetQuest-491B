import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";

// Function to calculate luminance and determine text color
const getContrastColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.4 ? '#000000' : '#FFFFFF';
};

export default function PetScreen() {
  const router = useRouter();
  const { selectedPet } = usePet();
  const { colors } = useTheme();
  const buttonTextColor = getContrastColor(colors.primary);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.petName, { color: colors.text }]}>{selectedPet.name}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image source={selectedPet.image} style={styles.petImage} resizeMode="contain" />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(indv)/(tabs)/pet/customize")}>
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>Customize</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(indv)/(tabs)/pet/shop")}>
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(indv)/(tabs)/pet/collection")}>
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>Collection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
});
