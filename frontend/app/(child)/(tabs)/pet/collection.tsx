import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Platform, TextInput } from "react-native";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getApiUrl } from '@/utils/api';

interface CollectionItem {
  id: string;
  name: string;
  icon: string;
  selected?: boolean;
  owned: boolean;
  level: number;
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
  level: number;
  petType?: string; // Store original pet type for image lookup
}

const petKeyFromName = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-");

// Determine original pet type from name (handles renamed pets)
// This tries to match known pet types, but if renamed, we'll need to preserve the type elsewhere
const getPetTypeFromName = (name: string): string => {
  const normalized = name.toLowerCase().trim();
  // Check exact matches first (most common case)
  const knownTypes = ['dragon', 'cat', 'dog', 'lion', 'unicorn'];
  
  // Exact match
  if (knownTypes.includes(normalized)) {
    return normalized;
  }
  
  // Check if name starts with a known type (e.g., "Dragon Buddy" -> "dragon")
  for (const type of knownTypes) {
    if (normalized.startsWith(type + ' ')) {
      return type;
    }
  }
  
  // Check if name contains a known type word anywhere (e.g., "My Dragon" -> "dragon", "Dragon Pet" -> "dragon")
  for (const type of knownTypes) {
    // Check if the name contains the type as a whole word
    const words = normalized.split(/\s+/);
    if (words.includes(type)) {
      return type;
    }
  }
  
  // If we can't determine, default to 'dragon' (this shouldn't happen for properly initialized pets)
  // In practice, pets should always contain one of the known types
  return 'dragon';
};


export default function CollectionScreen() {
  const { selectedPet, setSelectedPet } = usePet();
  const { colors } = useTheme();
  const { token } = useAuth();

  const [backendPets, setBackendPets] = useState<BackendPet[]>([]);
  const [loading, setLoading] = useState(false);

  const [showPet, setShowPet] = useState<CollectionItem | null>(null);
  const [petModal, setPetModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const staticCollectionItems: CollectionItem[] = [
    { id: "dragon", name: "Dragon", icon: "", owned: true, level: 8 },
    { id: "cat", name: "Cat", icon: "", owned: true, level: 5 },
    { id: "bird", name: "Bird", icon: "", owned: false, level: 0 },
    { id: "dog", name: "Dog", icon: "", owned: false, level: 0 },
    { id: "rabbit", name: "Rabbit", icon: "", owned: false, level: 0 },
    { id: "hamster", name: "Hamster", icon: "", owned: false, level: 0 },
  ];

  const collectionItems: CollectionItem[] =
    backendPets.length > 0
      ? backendPets
          .filter(p => p.isUnlocked) // Only show unlocked pets (user's requirement: "any pets not bought should not appear here even grayed out")
          .map((p) => ({
            id: `pet-${p.id}`, // Use unique backend ID to avoid duplicate keys
            name: p.name,
            icon: p.petType || petKeyFromName(p.name), // Use stored petType for image lookup, fallback to name
            owned: p.isUnlocked,
            level: p.level,
          }))
      : staticCollectionItems.filter(item => item.owned); // Only show owned pets from static list

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

  // Load pets from backend
  const loadPets = useCallback(async () => {
    if (!token) return;
      try {
        setLoading(true);
        const API_URL = getApiUrl();
        const res = await fetch(`${API_URL}/api/pets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          return;
        }

        const data: BackendPet[] = await res.json();
        
        // Add petType to each pet based on original name
        const petsWithType = data.map(p => ({
          ...p,
          petType: getPetTypeFromName(p.name)
        }));
        
        // Deduplicate pets by petType (original type), preferring unlocked ones if duplicates exist
        // If same type exists, prefer the one with the lower ID (first created)
        const uniquePets = petsWithType.reduce((acc, p) => {
          const existing = acc.find(existing => existing.petType === p.petType);
          
          if (!existing) {
            acc.push(p);
          } else if (p.isUnlocked && !existing.isUnlocked) {
            // Replace locked pet with unlocked one if we find a duplicate
            const index = acc.indexOf(existing);
            acc[index] = p;
          } else if (p.isUnlocked && existing.isUnlocked) {
            // If both are unlocked, keep the one with the lower ID (first created)
            if (p.id < existing.id) {
              const index = acc.indexOf(existing);
              acc[index] = p;
            }
          } else if (!p.isUnlocked && !existing.isUnlocked) {
            // If both are locked, keep the one with the lower ID
            if (p.id < existing.id) {
              const index = acc.indexOf(existing);
              acc[index] = p;
            }
          }
          return acc;
        }, [] as BackendPet[]);
        
        setBackendPets(uniquePets);

        // Pick an active / visible pet for the main view
        if (uniquePets.length > 0) {
          const active =
            uniquePets.find((p) => p.isVisible) ||
            uniquePets.find((p) => p.isUnlocked) ||
            uniquePets[0];

          if (active) {
            const key = active.petType || petKeyFromName(active.name);
            setSelectedPet({
              id: key,
              name: active.name,
              image: getPetImage(key),
            });
          }
        }
      } catch (err) {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
  }, [token]);

  // Load pets when token is available
  useEffect(() => {
    loadPets();
  }, [loadPets]);

  // Refresh pets when screen comes into focus (e.g., after purchasing in shop)
  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets])
  );

  const handlePetSelect = async (petKey: string) => {
    // Find matching item in the current list (static OR backend-derived)
    // petKey might be the full ID (pet-1) or just the icon/key (dragon)
    const petItem = collectionItems.find((item) => 
      item.id === petKey || item.icon === petKey
    );
    if (!petItem || !petItem.owned) return;

    // Use the icon (pet key) for selection, or fallback to id
    const actualPetKey = petItem.icon || petKey;

    // Update UI selection
    setSelectedPet({
      id: actualPetKey,
      name: petItem.name,
      image: getPetImage(actualPetKey),
    });

    // If we have backend data + token, also update which pet is visible
    if (token && backendPets.length > 0) {
      const backendPet = backendPets.find(
        (p) => petKeyFromName(p.name) === actualPetKey || `pet-${p.id}` === petKey
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
        // Silently handle errors
      }
    }
  };

  const handleShowPet = (item: CollectionItem) => {
    setShowPet(item);
    setEditedName(item.name);
    setIsEditingName(false);
    setPetModal(true);
  };

  const handleSaveName = async () => {
    if (!showPet || !token || !showPet.owned || !editedName.trim()) {
      return;
    }

    // Extract pet ID from showPet.id (format: "pet-1" or just the icon key)
    let petId: number | null = null;
    
    if (showPet.id.startsWith('pet-')) {
      // Extract the numeric ID from "pet-1" format
      petId = parseInt(showPet.id.replace('pet-', ''));
    } else {
      // Find by matching the icon/name
      const backendPet = backendPets.find(
        (p) => petKeyFromName(p.name) === showPet.icon || petKeyFromName(p.name) === showPet.id
      );
      petId = backendPet?.id || null;
    }

    if (!petId) {
      return;
    }

    try {
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/pets/${petId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editedName.trim() }),
      });

      if (res.ok) {
        // Refresh pets from backend to get updated data and proper deduplication
        // This ensures we have the latest state and correct deduplication
        await loadPets();
        
        // Update the showPet state with new name, preserving the icon (petType)
        // The icon should remain the same since we're not changing the pet type
        setShowPet({ 
          ...showPet, 
          name: editedName.trim()
        });
        setIsEditingName(false);
      }
    } catch (err) {
      // Silently handle errors
    }
  };

  const renderCollectionItem = (item: CollectionItem) => {
    // Use icon (pet key) for image lookup, fallback to id if icon not set
    const petKey = item.icon || item.id;
    const isKnownPet = ["dragon", "cat", "dog", "lion", "unicorn"].includes(petKey);
    const isSelected = selectedPet.id === petKey || selectedPet.id === item.id;
    
    return (
      <TouchableOpacity 
        key={item.id} 
        style={styles.itemContainer}
        onPress={() => handleShowPet(item)}
        disabled={!item.owned}
        activeOpacity={item.owned ? 0.7 : 1}
      >
        <View style={[
          styles.itemBox,
          {
            backgroundColor: item.owned ? colors.background : colors.surface,
            borderColor: colors.primary,
          },
          isSelected && item.owned && {
            borderWidth: 4,
            borderColor: colors.primary,
          },
          !item.owned && { borderColor: colors.border },
        ]}
      >
        {isKnownPet ? (
          <Image
            source={getPetImage(petKey)}
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
  };


  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {collectionItems.map(renderCollectionItem)}
        </View>
      </View>
    </ScrollView>

    {/* Pet Selection Modal*/}
     {showPet && (
      <Modal
        visible={petModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setPetModal(false);
          setShowPet(null);
          setIsEditingName(false);
        }}>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <View style={{backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center'}}>
              <View style={{flexDirection: 'column', justifyContent: 'space-between', width: '100%', alignItems: "center"}}>
                <Image
                  source={getPetImage(showPet.icon || showPet.id)}
                  style={{width: 150, height: 150}}
                  resizeMode='contain'
                />
                {/* Pet Name with Edit Icon */}
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8}}>
                  {isEditingName ? (
                    <TextInput
                      style={{
                        fontSize: 28,
                        fontWeight: 'bold',
                        color: 'black',
                        borderWidth: 1,
                        borderColor: '#52AFDD',
                        borderRadius: 5,
                        padding: 8,
                        minWidth: 150,
                        textAlign: 'center',
                      }}
                      value={editedName}
                      onChangeText={setEditedName}
                      autoFocus
                      maxLength={20}
                    />
                  ) : (
                    <Text style={{fontSize: 28, fontWeight: 'bold', color: 'black'}}>
                      {showPet.name}
                    </Text>
                  )}
                  {showPet.owned && (
                    <TouchableOpacity
                      onPress={() => {
                        if (isEditingName) {
                          handleSaveName();
                        } else {
                          setIsEditingName(true);
                        }
                      }}
                      style={{padding: 5}}
                    >
                      <Ionicons 
                        name={isEditingName ? "checkmark" : "pencil"} 
                        size={24} 
                        color="#52AFDD" 
                      />
                    </TouchableOpacity>
                  )}
                </View>
                {isEditingName && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditedName(showPet.name);
                      setIsEditingName(false);
                    }}
                    style={{marginBottom: 10}}
                  >
                    <Text style={{fontSize: 14, color: '#999'}}>Cancel</Text>
                  </TouchableOpacity>
                )}
                {showPet.owned ? (
                  <Text style={{fontSize: 20, marginBottom: 20}}>
                    Level: {showPet.level}
                  </Text> ) : (
                  <Text style={{fontSize: 16, marginBottom: 20, color: 'red'}}>
                    You do not own this pet yet.
                  </Text>
                  )
                }
                <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 24, gap: 12, alignItems: 'center'}}>
                <TouchableOpacity style={{backgroundColor: 'red', padding: 10, borderRadius: 5, marginBottom: 10, marginLeft: 25}}
                onPress={() => {
                  setPetModal(false);
                  setShowPet(null);
                  setIsEditingName(false);
                }}>
                  <Text>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{backgroundColor: 'green', padding: 10, borderRadius: 5, marginBottom: 10, marginRight: 25}} 
                onPress={() => {
                  if (isEditingName) {
                    handleSaveName();
                  } else {
                    handlePetSelect(showPet.id);
                    setPetModal(false);
                    setShowPet(null);
                    setIsEditingName(false);
                  }
                }}>
                  <Text>{isEditingName ? 'Save' : 'Select'}</Text>
                </TouchableOpacity>
                </View>
              {/* </View> */}
              </View>
              
            </View>
          </View>
      </Modal>
    )}
    
    </>
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