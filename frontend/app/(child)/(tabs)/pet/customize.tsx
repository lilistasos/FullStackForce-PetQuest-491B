import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/lib/api";

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

interface ActivityItem {
  id: string | number;
  message: string;
  createdAt: string; 
}

export default function CustomizeScreen() {
  const { selectedPet, selectedAccessories, setSelectedAccessories } = usePet();
  const { colors } = useTheme();
  const combinedImages: Record<string, any> = {
  "capdragon": require("@/assets/images/capdragon.png"),
  "top-hatdragon": require("@/assets/images/top-hatdragon.png"),
  "nonedragon": require("@/assets/images/pdragon.png"),
};
  const [selectedCategory, setSelectedCategory] =
    useState<keyof AccessoriesData>("hats");
  const [visibleRows, setVisibleRows] = useState(2);
  const [userAccessories, setUserAccessories] = useState<AccessoriesData>({
    hats: [{ id: "none", name: "None", icon: "∅" }],
    accessories: [{ id: "none", name: "None", icon: "∅" }],
  });

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [savingHat, setSavingHat] = useState(false);
  const [combinedImage, setCombinedImage] = useState<string>("");

  const petId = selectedPet?.id; 

  const HAT_ENDPOINT = petId ? `/pets/${petId}/hat` : null;
  const ACTIVITY_ENDPOINT = petId ? `/pets/${petId}/activity` : null;
  const ACCESSORIES_ENDPOINT = "/me/accessories"; 

  const loadUserAccessories = async (): Promise<AccessoriesData> => {
    try {
      const raw = await api.get<any[]>(ACCESSORIES_ENDPOINT);

      const hats: AccessoryItem[] = [
        { id: "none", name: "None", icon: "∅" },
        ...raw
          .filter((a: { slot: string; }) => a.slot === "HAT")
          .map((a: { id: any; name: any; }) => ({
            id: String(a.id),
            name: a.name,
            icon: "",
          })),
      ];

      const accessories: AccessoryItem[] = [
        { id: "none", name: "None", icon: "∅" },
        ...raw
          .filter((a: { slot: string; }) => a.slot !== "HAT")
          .map((a: { id: any; name: any; }) => ({
            id: String(a.id),
            name: a.name,
            icon: "",
          })),
      ];

      return { hats, accessories };
    } catch (err) {
      console.warn("Falling back to local accessories:", err);
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
        ],
      };
    }
  };

  const loadActivity = async () => {
    if (!ACTIVITY_ENDPOINT) return;
    try {
      const rows = await api.get<ActivityItem[]>(ACTIVITY_ENDPOINT);
      setActivity(rows);
    } catch (err) {
      console.warn("Could not load pet activity", err);
    }
  };

  useEffect(() => {
    loadUserAccessories().then(setUserAccessories);
  }, []);

  useEffect(() => {
    //loadActivity();
  }, [petId]);

  // ------------------- Hat equip / unequip -------------------
  const handleAccessorySelect = async (item: AccessoryItem) => {
    const currentlySelected = selectedAccessories[selectedCategory];
    const isSame = currentlySelected === item.id;

    // For hats, tapping the same hat again should "take it off"
    const newId = isSame ? "none" : item.id;
    setSelectedAccessories({
      ...selectedAccessories,
      [selectedCategory]: newId,
    });

    // For non-hat category, no server call needed
    if (selectedCategory !== "hats" || !HAT_ENDPOINT || !petId) return;

    // Map "none" -> null so backend can unequip
    const hatIdPayload =
      newId === "none" ? null : newId; 
    try {
      setSavingHat(true);
      console.log(`@/assets/images/${item.id.toLowerCase()}${selectedPet.name.toLowerCase()}.png`);
      setCombinedImage((`${newId.toLowerCase()}${selectedPet.name.toLowerCase()}`));
      // const updatedPet = await api.put<{ hatId: string | null; name: string }>(
      //   HAT_ENDPOINT,
      //   { hatId: hatIdPayload }
      // );

      const message =
        hatIdPayload === null
          ? "Removed hat"
          : `Equipped a new hat`;

      const nowIso = new Date().toISOString();
      setActivity((prev) => [
        {
          id: nowIso,
          message,
          createdAt: nowIso,
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error(err);
      setSelectedAccessories({
        ...selectedAccessories,
        [selectedCategory]: currentlySelected,
      });
      console.log("ahhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh")
      alert(err?.message ?? "Could not update hat on server.");
    } finally {
      setSavingHat(false);
    }
  };

  const renderAccessoryItem = ({
    item,
    index,
    key,
  }: {
    item: AccessoryItem;
    index: number;
    key: string | number;
  }) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.accessoryItem,
        {
          backgroundColor: colors.background,
          borderColor: colors.primary,
        },
        item.isEmpty && [
          styles.emptyItem,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ],
        selectedAccessories[selectedCategory] === item.id && {
          borderWidth: 4,
          borderColor: colors.primary,
        },
      ]}
      disabled={item.isEmpty || savingHat}
      onPress={() => handleAccessorySelect(item)}
    >
      {!item.isEmpty &&
        (item.id === "cap" ? (
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
        ))}
    </TouchableOpacity>
  );

  const getVisibleItems = () => {
    const items = userAccessories[selectedCategory];
    const totalSlots = visibleRows * 3;
    const visibleItems = items.slice(0, totalSlots);

    const emptySlots = Math.max(0, totalSlots - visibleItems.length);
    const emptyBoxes = Array(emptySlots)
      .fill(null)
      .map((_, index) => ({
        id: `empty-${index}`,
        name: "",
        icon: "",
        isEmpty: true,
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.imageContainer}>
        <Image
          source={combinedImages[combinedImage]}
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
            selectedCategory === "hats" && [
              styles.selectedCategory,
              { backgroundColor: colors.primary },
            ],
          ]}
          onPress={() => setSelectedCategory("hats")}
        >
          <Text
            style={[
              styles.categoryText,
              { color: colors.text },
              selectedCategory === "hats" && [
                styles.selectedCategoryText,
                { color: colors.text },
              ],
            ]}
          >
            Hats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.categoryButton,
            { backgroundColor: colors.surface },
            selectedCategory === "accessories" && [
              styles.selectedCategory,
              { backgroundColor: colors.primary },
            ],
          ]}
          onPress={() => setSelectedCategory("accessories")}
        >
          <Text
            style={[
              styles.categoryText,
              { color: colors.text },
              selectedCategory === "accessories" && [
                styles.selectedCategoryText,
                { color: colors.text },
              ],
            ]}
          >
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
            onPress={loadMoreItems}
          >
            <Text style={[styles.loadMoreText, { color: colors.text }]}>
              Load More
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Simple activity / comments section */}
      <View style={styles.activityContainer}>
        <Text style={styles.activityTitle}>Hat Activity</Text>
        {activity.length === 0 ? (
          <Text style={styles.activityEmpty}>
            No hat activity yet. Try equipping a hat!
          </Text>
        ) : (
          activity.slice(0, 10).map((row) => (
            <View key={row.id} style={styles.activityRow}>
              <Text style={styles.activityBullet}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityMessage}>{row.message}</Text>
                <Text style={styles.activityTime}>
                  {new Date(row.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
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
  selectedCategory: {},
  categoryText: {
    fontFamily: "monospace",
    fontSize: 18,
  },
  selectedCategoryText: {
    fontWeight: "bold",
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  emptyItem: {},
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
  activityContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: "#fff",
  },
  activityEmpty: {
    fontSize: 14,
    color: "#aaa",
  },
  activityRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  activityBullet: {
    marginRight: 6,
    marginTop: 2,
    color: "#888",
  },
  activityMessage: {
    fontSize: 14,
    color: "#eee",
  },
  activityTime: {
    fontSize: 11,
    color: "#888",
  },
});
