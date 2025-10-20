import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { usePet } from "@/contexts/PetContext";

interface AccessoryItem {
  id: string;
  name: string;
  icon: string;
  isEmpty?: boolean;
}

interface AccessoriesData {
  hats: AccessoryItem[];
  accessories: AccessoryItem[];
}

export default function CustomizeScreen() {
  const router = useRouter();
  const { selectedPet, selectedAccessories, setSelectedAccessories } = usePet();
  const [selectedCategory, setSelectedCategory] = useState<keyof AccessoriesData>("hats");
  const [visibleRows, setVisibleRows] = useState(2);
  const [userAccessories, setUserAccessories] = useState<AccessoriesData>({
    hats: [{ id: "none", name: "None", icon: "∅" }],
    accessories: [{ id: "none", name: "None", icon: "∅" }]
  });

  const loadUserAccessories = async () => {
    return {
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
  };

  React.useEffect(() => {
    loadUserAccessories().then(setUserAccessories);
  }, []);

  const handleAccessorySelect = (item: AccessoryItem) => {
    setSelectedAccessories({
      ...selectedAccessories,
      [selectedCategory]: item.id
    });
  };

  const renderAccessoryItem = ({ item, index }: { item: AccessoryItem; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.accessoryItem, 
        item.isEmpty && styles.emptyItem,
        selectedAccessories[selectedCategory] === item.id && styles.selectedAccessoryItem
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
          style={[styles.categoryButton, selectedCategory === "hats" && styles.selectedCategory]}
          onPress={() => setSelectedCategory("hats")}>
          <Text style={[styles.categoryText, selectedCategory === "hats" && styles.selectedCategoryText]}>
            Hats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.categoryButton, selectedCategory === "accessories" && styles.selectedCategory]}
          onPress={() => setSelectedCategory("accessories")}>
          <Text style={[styles.categoryText, selectedCategory === "accessories" && styles.selectedCategoryText]}>
            Accessories
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {getVisibleItems().map((item, index) => (
            renderAccessoryItem({ item, index })
          ))}
        </View>
        
        {userAccessories[selectedCategory].length > visibleRows * 3 && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreItems}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  selectedCategory: {
    backgroundColor: "#52AFDD",
  },
  categoryText: {
    fontFamily: "monospace",
    fontSize: 18,
    color: "#000",
  },
  selectedCategoryText: {
    color: "#000",
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
    backgroundColor: "#FFFFFF",
    marginBottom: 15,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#52AFDD",
  },
  selectedAccessoryItem: {
    borderWidth: 4,
    borderColor: "#52AFDD",
  },
  emptyItem: {
    backgroundColor: "#F8F8F8",
    borderColor: "#E0E0E0",
  },
  accessoryIcon: {
    fontSize: 40,
  },
  accessoryImage: {
    width: 80,
    height: 80,
  },
  loadMoreButton: {
    backgroundColor: "#52AFDD",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  loadMoreText: {
    fontFamily: "monospace",
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
  },
});