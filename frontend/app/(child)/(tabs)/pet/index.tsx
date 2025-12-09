import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { getApiUrl } from "@/utils/api";

interface BackendPet {
  id: number;
  userId: string;
  name: string;
  imageUrl: string | null;
  isUnlocked: boolean;
  isVisible: boolean;
  cost: number;
  level: number;
}

const petKeyFromName = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-");

// Static fallback levels (matching collection page)
const staticPetLevels: { [key: string]: number } = {
  dragon: 8,
  cat: 5,
  bird: 0,
  dog: 0,
  rabbit: 0,
  hamster: 0,
};

export default function PetScreen() {
  const router = useRouter();
  const { selectedPet } = usePet();
  const { colors } = useTheme();
  const { token } = useAuth();
  const [petLevel, setPetLevel] = useState<number | null>(null);

  // Fetch pet level from backend
  useEffect(() => {
    const loadPetLevel = async () => {
      // Set fallback level immediately
      const fallbackLevel = staticPetLevels[selectedPet.id] || 1;
      setPetLevel(fallbackLevel);

      if (!token) return;

      try {
        const API_URL = getApiUrl();
        const res = await fetch(`${API_URL}/api/pets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.log("Failed to fetch pets:", await res.text());
          return;
        }

        const data: BackendPet[] = await res.json();
        const currentPet = data.find(
          (p) => petKeyFromName(p.name) === selectedPet.id
        );
        
        if (currentPet) {
          setPetLevel(currentPet.level);
        }
      } catch (err) {
        console.log("Error fetching pet level:", err);
        // Keep fallback level if API fails
      }
    };

    loadPetLevel();
  }, [token, selectedPet.id]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.petName, { color: colors.text }]}>{selectedPet.name}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image source={selectedPet.image} style={styles.petImage} resizeMode="contain" />
        <View style={[styles.levelContainer, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
          <Ionicons name="star" size={20} color={colors.primary} style={styles.levelIcon} />
          <Text style={[styles.levelText, { color: colors.primary }]}>Level {petLevel || 1}</Text>
        </View>
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
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginTop: 4,
    marginBottom: 12,
  },
  levelIcon: {
    marginRight: 6,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});