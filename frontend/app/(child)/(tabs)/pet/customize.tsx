import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, FlatList, Platform } from "react-native";
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

interface AccessoryItem {
  id: string;
  name: string;
  icon: string;
  isEmpty?: boolean;
  backendId?: number;
}

interface AccessoriesData {
  hats: AccessoryItem[];
  accessories: AccessoryItem[];
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

type CategoryKey = keyof AccessoriesData;

const petKeyFromName = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-");

const getPetImage = (petKey: string) => {
  switch (petKey) {
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
      return require("@/assets/images/green-dragon.png");
  }
};

export default function CustomizeScreen() {
  const { selectedPet, selectedAccessories, setSelectedAccessories } = usePet();
  const { colors } = useTheme();
  const { token } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<keyof AccessoriesData>("hats");
  const [visibleRows, setVisibleRows] = useState(2);
  const [userAccessories, setUserAccessories] = useState<AccessoriesData>({
    hats: [{ id: "none", name: "None", icon: "∅" }],
    accessories: [{ id: "none", name: "None", icon: "∅" }]
  });

  const loadUserAccessories = async () => {
    const staticData: AccessoriesData = {
      hats: [
        { id: "none", name: "None", icon: "∅" },
        { id: "cap", name: "Baseball Cap", icon: "" },
        { id: "top-hat", name: "Top Hat", icon: "" },
      ],
      accessories: [
        { id: "none", name: "None", icon: "∅" },
        { id: "glasses", name: "Sunglasses", icon: "" },
        { id: "football", name: "Football", icon: "" },
      ]
    };

    if (!token) return staticData;

    try {
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/pets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.log("Failed to fetch pets for accessories:", await res.text());
        return staticData;
      }

      const pets: BackendPet[] = await res.json();
      if (!pets.length) return staticData;

      const current =
        pets.find(
          (p) =>
            petKeyFromName(p.name) === selectedPet.id || p.isVisible === true
        ) || pets[0];

      const unlocked = current.accessories.filter((a) => a.isUnlocked);

      const hats: AccessoryItem[] = [
        { id: "none", name: "None", icon: "∅" },
      ];
      const accessories: AccessoryItem[] = [
        { id: "none", name: "None", icon: "∅" },
      ];

      unlocked.forEach((a) => {
        const lower = a.name.toLowerCase();
        let item: AccessoryItem;

        if (lower.includes("cap") || lower.includes("hat")) {
          if (lower.includes("baseball")) {
            item = {
              id: "cap",
              name: a.name,
              icon: "",
              backendId: a.id,
            };
          } else if (lower.includes("top")) {
            item = {
              id: "top-hat",
              name: a.name,
              icon: "",
              backendId: a.id,
            };
          } else {
            item = {
              id: `hat-${a.id}`,
              name: a.name,
              icon: "",
              backendId: a.id,
            };
          }
          hats.push(item);
        } else {
          if (lower.includes("glass")) {
            item = {
              id: "glasses",
              name: a.name,
              icon: "",
              backendId: a.id,
            };
          } else if (lower.includes("football")) {
            item = {
              id: "football",
              name: a.name,
              icon: "",
              backendId: a.id,
            };
          } else {
            item = {
              id: `acc-${a.id}`,
              name: a.name,
              icon: "",
              backendId: a.id,
            };
          }
          accessories.push(item);
        }
      });

      return { hats, accessories };
    } catch (err) {
      console.log("Error loading accessories:", err);
      return staticData;
    }
  };

  React.useEffect(() => {
    loadUserAccessories().then(setUserAccessories);
  }, [token, selectedPet.id]);

  const handleAccessorySelect = (item: AccessoryItem) => {
    // Only track customization if selecting a non-empty accessory (not "none")
    if (item.id !== "none" && selectedAccessories[selectedCategory] !== item.id) {
      recordCustomization();
    }
    setSelectedAccessories({
      ...selectedAccessories,
      [selectedCategory]: item.id
    });

    if (item.backendId && token && !item.isEmpty) {
      const API_URL = getApiUrl();
      fetch(`${API_URL}/api/pet-accessories/${item.backendId}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVisible: true }),
      }).catch((err) => console.log("Error updating accessory visibility:", err));
    }
  };


  const renderAccessoryItem = ({ item, index, key }: { item: AccessoryItem; index: number; key: string | number }) => (
    <TouchableOpacity 
      key={key}
      style={[
        styles.accessoryItem, 
        { backgroundColor: colors.background, borderColor: colors.primary },
        item.isEmpty && [styles.emptyItem, { backgroundColor: colors.surface, borderColor: colors.border }],
        selectedAccessories[selectedCategory] === item.id && { borderWidth: 4, borderColor: colors.primary }
      ]}
      disabled={item.isEmpty}
      onPress={() => handleAccessorySelect(item)}>
      {!item.isEmpty && (
        item.id === "cap" ? (
          <Image 
            source={require("@/assets/images/bbhat.png")} 
            style={styles.accessoryImage}
            resizeMode="contain"
          />
        ) : item.id === "top-hat" ? (
          <Image 
            source={require("@/assets/images/tophat.png")} 
            style={styles.accessoryImage}
            resizeMode="contain"
          />
        ) : item.id === "glasses" ? (
          <Image 
            source={require("@/assets/images/sunglasses.png")} 
            style={styles.accessoryImage}
            resizeMode="contain"
          />
        ) : item.id === "football" ? (
          <Image 
            source={require("@/assets/images/football.png")} 
            style={styles.accessoryImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.accessoryIcon}>{item.icon}</Text>
        )
      )}
    </TouchableOpacity>
  );

  const getVisibleItems = () => {
    const items = userAccessories[selectedCategory];
    const totalSlots = visibleRows * 3;
    const visibleItems = items.slice(0, totalSlots);
    
    const emptySlots = Math.max(0, totalSlots - visibleItems.length);
    const emptyBoxes = Array(emptySlots).fill(null).map((_, index) => ({
      id: `empty-${index}`,
      name: "",
      icon: "",
      isEmpty: true
    }));
    
    return [...visibleItems, ...emptyBoxes];
  };

  const loadMoreItems = () => {
    const totalItems = userAccessories[selectedCategory].length;
    const maxRows = Math.ceil(totalItems / 3);
    if (visibleRows < maxRows) {
      setVisibleRows(visibleRows + 1);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.imageContainer}>
        <Image 
          source={selectedPet.image} 
          style={styles.petImage} 
          resizeMode="contain"
          blurRadius={0}
        />
      </View>

      <View style={styles.categoryContainer}>
        <TouchableOpacity 
          style={[
            styles.categoryButton, 
            { backgroundColor: colors.surface },
            selectedCategory === "hats" && [styles.selectedCategory, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setSelectedCategory("hats")}>
          <Text style={[
            styles.categoryText, 
            { color: colors.text },
            selectedCategory === "hats" && [styles.selectedCategoryText, { color: colors.text }]
          ]}>
            Hats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.categoryButton, 
            { backgroundColor: colors.surface },
            selectedCategory === "accessories" && [styles.selectedCategory, { backgroundColor: colors.primary }]
          ]}
          onPress={() => setSelectedCategory("accessories")}>
          <Text style={[
            styles.categoryText, 
            { color: colors.text },
            selectedCategory === "accessories" && [styles.selectedCategoryText, { color: colors.text }]
          ]}>
            Accessories
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {getVisibleItems().map((item, index) => 
            renderAccessoryItem({ item, index, key: item.id || index })
          )}
        </View>
        
        {userAccessories[selectedCategory].length > visibleRows * 3 && (
          <TouchableOpacity 
            style={[styles.loadMoreButton, { backgroundColor: colors.primary }]} 
            onPress={loadMoreItems}>
            <Text style={[styles.loadMoreText, { color: colors.text }]}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  petImage: {
    width: 300,
    height: 300,
    transform: [{ scale: 1 }],
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 20,
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  selectedCategory: {
    // Background color will be set dynamically
  },
  categoryText: {
    fontFamily: "monospace",
    fontSize: 18,
  },
  selectedCategoryText: {
    fontWeight: "bold",
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  accessoryItem: {
    width: "30%",
    height: 110,
    marginBottom: 15,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  emptyItem: {
  },
  accessoryIcon: {
    fontSize: 40,
  },
  accessoryImage: {
    width: 80,
    height: 80,
  },
  loadMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  loadMoreText: {
    fontFamily: "monospace",
    fontSize: 16,
    fontWeight: "bold",
  },
});