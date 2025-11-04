import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function PetScreen() {
  const router = useRouter();
  const { selectedPet } = usePet();
  const { colors } = useTheme();

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
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/(child)/(tabs)/pet/customize")}
        >
          <Ionicons name="color-palette-outline" size={24} color={colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Customize</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/(child)/(tabs)/pet/shop")}
        >
          <Ionicons name="cart-outline" size={24} color={colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Shop</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/(child)/(tabs)/pet/collection")}
        >
          <Ionicons name="pricetags-outline" size={24} color={colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Collection</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
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
    width: "90%",
    alignItems: "center",
    marginBottom: 40,
  },
  button: {
    width: "100%",
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 12,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
  },
});