import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, FlatList } from "react-native";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { selectedPet, selectedAccessories, setSelectedAccessories } = usePet();
  const { colors } = useTheme();
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
    // backgroundColor will be set dynamically
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