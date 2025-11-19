import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from "react-native";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return __DEV__ ? "http://10.0.2.2:4000" : "http://10.0.2.2:4000";
  } else if (Platform.OS === 'ios') {
    return __DEV__ ? "http://localhost:4000" : "http://localhost:4000";
  } else {
    return "http://localhost:4000";
  }
};

interface CollectionItem {
  id: string;
  name: string;
  icon: string;
  selected?: boolean;
  owned: boolean;
}

interface BackendAccessory {
  id: number;
  name: string;
  imageUrl: string | null;
  isUnlocked: boolean;
  isVisible: boolean;
  cost: number;
}

interface BackendPet {
  id: number;
  userId: string;
  name: string;
  imageUrl: string | null;
  isUnlocked: boolean;
  isVisible: boolean;
  cost: number;
  accessories: BackendAccessory[];
}

const petKeyFromName = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-");


export default function CollectionScreen() {
  const { selectedPet, setSelectedPet } = usePet();
  const { colors } = useTheme();
  const { token } = useAuth();

  const [backendPets, setBackendPets] = useState<BackendPet[]>([]);
  const [loading, setLoading] = useState(false);


  const staticCollectionItems: CollectionItem[] = [
    { id: "dragon", name: "Dragon", icon: "", owned: true },
    { id: "cat", name: "Cat", icon: "", owned: true },
    { id: "bird", name: "Bird", icon: "", owned: false },
    { id: "dog", name: "Dog", icon: "", owned: false },
    { id: "rabbit", name: "Rabbit", icon: "", owned: false },
    { id: "hamster", name: "Hamster", icon: "", owned: false },
  ];

  const collectionItems: CollectionItem[] =
    backendPets.length > 0
      ? backendPets.map((p) => ({
          id: petKeyFromName(p.name),
          name: p.name,
          icon: "",
          owned: p.isUnlocked,
        }))
      : staticCollectionItems;

  const getPetImage = (petId: string) => {
    switch (petId) {
      case "dragon":
        return require("@/assets/images/pdragon.png");
      case "cat":
        return require("@/assets/images/cat.png");
      case "dog":
        return require("@/assets/images/fbdog.png");
      case "lion":
        return require("@/assets/images/lion.png");
      case "unicorn":
        return require("@/assets/images/unicorn.png");
      default:
        return require("@/assets/images/green-dragon.png"); // fallback
    }
  };

  // Load pets from backend when token is available
  useEffect(() => {
    if (!token) return;

    const loadPets = async () => {
      try {
        setLoading(true);
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
        setBackendPets(data);

        // Pick an active / visible pet for the main view
        if (data.length > 0) {
          const active =
            data.find((p) => p.isVisible) ||
            data.find((p) => p.isUnlocked) ||
            data[0];

          if (active) {
            const key = petKeyFromName(active.name);
            setSelectedPet({
              id: key,
              name: active.name,
              image: getPetImage(key),
            });
          }
        }
      } catch (err) {
        console.log("Error fetching pets:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPets();
  }, [token]);

  const handlePetSelect = async (petKey: string) => {
    // Find matching item in the current list (static OR backend-derived)
    const petItem = collectionItems.find((item) => item.id === petKey);
    if (!petItem || !petItem.owned) return;

    // Update UI selection
    setSelectedPet({
      id: petKey,
      name: petItem.name,
      image: getPetImage(petKey),
    });

    // If we have backend data + token, also update which pet is visible
    if (token && backendPets.length > 0) {
      const backendPet = backendPets.find(
        (p) => petKeyFromName(p.name) === petKey
      );
      if (!backendPet) return;

      try {
        const API_URL = getApiUrl();
        await fetch(
          `${API_URL}/api/pets/${backendPet.id}/visibility`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isVisible: true }),
          }
        );
      } catch (err) {
        console.log("Error updating pet visibility:", err);
      }
    }
  };


  const renderCollectionItem = (item: CollectionItem) => (
  <TouchableOpacity 
    key={item.id} 
    style={styles.itemContainer}
    onPress={() => handlePetSelect(item.id)}
    disabled={!item.owned}
    activeOpacity={item.owned ? 0.7 : 1}
  >
    <View
      style={[
        styles.itemBox,
        {
          backgroundColor: item.owned ? colors.background : colors.surface,
          borderColor: colors.primary,
        },
        selectedPet.id === item.id && item.owned && {
          borderWidth: 4,
          borderColor: colors.primary,
        },
        !item.owned && { borderColor: colors.border },
      ]}
    >
      {["dragon", "cat", "dog", "lion", "unicorn"].includes(item.id) ? (
        <Image
          source={getPetImage(item.id)}
          style={[styles.itemImage, !item.owned && styles.grayedOutImage]}
          resizeMode="contain"
        />
      ) : item.owned ? (
        <Text style={[styles.itemTitle, { color: colors.text }]}>
          {item.name}
        </Text>
      ) : null}
    </View>
  </TouchableOpacity>
);


  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {collectionItems.map(renderCollectionItem)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemContainer: {
    width: "45%",
    marginBottom: 40,
    alignItems: "center",
  },
  itemBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    padding: 10,
  },
  itemTitle: {
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  grayedOutText: {
    opacity: 0.5,
  },
  itemImage: {
    width: 120,
    height: 120,
  },
  grayedOutImage: {
    opacity: 0.4,
  },
});