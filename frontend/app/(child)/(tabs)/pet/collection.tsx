import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { usePet } from "@/contexts/PetContext";

interface CollectionItem {
  id: string;
  name: string;
  icon: string;
  selected?: boolean;
  owned: boolean;
}

export default function CollectionScreen() {
  const router = useRouter();
  const { selectedPet, setSelectedPet } = usePet();

  const collectionItems: CollectionItem[] = [
    { id: "dragon", name: "Dragon", icon: "", owned: true },
    { id: "cat", name: "Cat", icon: "", owned: true },
    { id: "bird", name: "Bird", icon: "", owned: false },
    { id: "dog", name: "Dog", icon: "", owned: false },
    { id: "rabbit", name: "Rabbit", icon: "", owned: false },
    { id: "hamster", name: "Hamster", icon: "", owned: false },
  ];

  const getPetImage = (petId: string) => {
    switch (petId) {
      case "dragon":
        return require("@/assets/images/pdragon.png");
      case "cat":
        return require("@/assets/images/cat.png");
      default:
        return require("@/assets/images/green-dragon.png"); // Default image
    }
  };

  const handlePetSelect = (petId: string) => {
    const pet = collectionItems.find(item => item.id === petId);
    // Only allow selection if the pet is owned
    if (pet && pet.owned) {
      setSelectedPet({
        id: petId,
        name: pet.name,
        image: getPetImage(petId)
      });
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
      <View style={[
        styles.itemBox,
        selectedPet.id === item.id && item.owned && styles.selectedItemBox,
        !item.owned && styles.unownedItemBox
      ]}>
        {item.id === "dragon" ? (
          <Image 
            source={require("@/assets/images/pdragon.png")} 
            style={[
              styles.itemImage,
              !item.owned && styles.grayedOutImage
            ]}
            resizeMode="contain"
          />
        ) : item.id === "cat" ? (
          <Image 
            source={require("@/assets/images/cat.png")} 
            style={[
              styles.itemImage,
              !item.owned && styles.grayedOutImage
            ]}
            resizeMode="contain"
          />
        ) : item.owned ? (
          <Text style={styles.itemTitle}>{item.name}</Text>
        ) : (
          // Empty box for unowned pets - no text
          null
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <IconSymbol 
            name="chevron.left" 
            size={24} 
            color="#000" 
            weight="medium"
          />
        </TouchableOpacity>
      </View>

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
    backgroundColor: "#FFFFFF",
  },
  header: {
    width: "100%",
    paddingTop: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backButton: {
    backgroundColor: "#52AFDD",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#52AFDD",
    padding: 10,
  },
  selectedItemBox: {
    borderWidth: 4,
    borderColor: "#52AFDD",
  },
  unownedItemBox: {
    backgroundColor: "#F5F5F5",
    borderColor: "#CCCCCC",
  },
  itemTitle: {
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  grayedOutText: {
    color: "#999999",
  },
  itemImage: {
    width: 120,
    height: 120,
  },
  grayedOutImage: {
    opacity: 0.4,
  },
});