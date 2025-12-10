import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { getApiUrl } from "@/utils/api";

const hatImages: Record<string, any> = {
  cap: require("@/assets/images/bbhat.png"),
  "top-hat": require("@/assets/images/tophat.png"),
};
const combinedImages: Record<string, any> = {
  "capdragon": require("@/assets/images/capdragon.png"),
  "top-hatdragon": require("@/assets/images/top-hatdragon.png"),
  "nonedragon": require("@/assets/images/pdragon.png"),
};

export default function PetScreen() {
  const router = useRouter();
  const { selectedPet, setSelectedPet, selectedAccessories } = usePet();
  const { colors } = useTheme();
  const { token } = useAuth();
  const [petLevel, setPetLevel] = useState<number>(1);

  // Fetch user points and calculate level
  useEffect(() => {
    if (!token) return;

    const fetchUserPoints = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const userData = await response.json();
          const points = userData.points ?? 0;
          // Calculate level: every 100 points = 1 level (level 1 = 0-99, level 2 = 100-199, etc.)
          const level = Math.floor(points / 100) + 1;
          setPetLevel(level);
        }
      } catch (error) {
        console.error("Error fetching user points:", error);
      }
    };

    fetchUserPoints();
  }, [token]);

  if (!selectedPet) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.petName, { color: colors.text }]}>
          No pet selected
        </Text>
      </View>
    );
  }

  // Read hat choice from shared context (set in customize.tsx)
  const hatId = selectedAccessories?.hats || "none";
  const combinedSource = `${hatId.toLowerCase()}${selectedPet.name.toLowerCase()}`;
  const petImageSource = combinedImages[combinedSource] || selectedPet.image;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.petName, { color: colors.text }]}>
          {selectedPet.name}
        </Text>
      </View>

      <View style={styles.imageContainer}>
        {/* Pet + hat overlay wrapper */}
        <View style={styles.petWrapper}>
          {/* Base pet image with hat */}
          <Image
            source={petImageSource}
            style={styles.petImage}
            resizeMode="contain"
          />
        </View>
        {/* Level display */}
        <View style={[styles.levelContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="star" size={20} color={colors.primary} />
          <Text style={[styles.levelText, { color: colors.text }]}>Level {petLevel}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push("/(child)/(tabs)/pet/customize")}
        >
          <Ionicons
            name="color-palette-outline"
            size={24}
            color={colors.primary}
            style={styles.buttonIcon}
          />
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Customize
          </Text>
          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push("/(child)/(tabs)/pet/shop")}
        >
          <Ionicons
            name="cart-outline"
            size={24}
            color={colors.primary}
            style={styles.buttonIcon}
          />
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Shop
          </Text>
          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push("/(child)/(tabs)/pet/collection")}
        >
          <Ionicons
            name="pricetags-outline"
            size={24}
            color={colors.primary}
            style={styles.buttonIcon}
          />
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Collection
          </Text>
          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color={colors.text}
          />
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
  // Wrapper so we can absolutely-position the hat
  petWrapper: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  petImage: {
    width: 300,
    height: 300,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: -8,
    gap: 6,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: "90%",
    alignItems: "center",
    marginBottom: 40,
  },
  button: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "bold",
    fontSize: 20,
    flex: 1,
    textAlign: "center",
  },
});
