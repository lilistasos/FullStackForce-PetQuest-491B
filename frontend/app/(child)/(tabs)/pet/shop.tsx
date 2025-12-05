import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Platform } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useAchievements } from "@/contexts/AchievementContext";
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from "@/hooks/useAuth";
import { getApiUrl } from '@/utils/api';

interface ShopItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  owned: boolean;
  backendId?: number;
  type: "pet" | "accessory";
}

interface ShopData {
  pets: ShopItem[];
  customization: ShopItem[];
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

interface UserMe {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "parent" | "child" | "individual";
  familyCode?: string;
  dateOfBirth?: string;
  createdAt: string;
  points: number;
}

type ShopTab = keyof ShopData;

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

const mapAccessoryIdFromName = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("cap") || lower.includes("hat")) {
    if (lower.includes("baseball")) return "cap";
    if (lower.includes("top")) return "top-hat";
    return `hat-${lower.replace(/\s+/g, "-")}`;
  }
  if (lower.includes("glass")) return "glasses";
  if (lower.includes("football")) return "football";
  return `acc-${lower.replace(/\s+/g, "-")}`;
};

export default function ShopScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();

  const [selectedTab, setSelectedTab] = useState<ShopTab>("pets");
  const [userCoins, setUserCoins] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToBuy, setItemToBuy] = useState<ShopItem | null>(null);
  const [shopItems, setShopItems] = useState<ShopData>({
    pets: [],
    customization: [],
  });

  useEffect(() => {
    if (!token) return;

    const loadShop = async () => {
      try {
        const API_BASE = getApiUrl();
        const [meRes, petsRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/pets`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (meRes.ok) {
          const me: UserMe = await meRes.json();
          setUserCoins(me.points ?? 0);
        } else {
          console.log("Failed to fetch /api/users/me:", await meRes.text());
        }

        if (petsRes.ok) {
          const backendPets: BackendPet[] = await petsRes.json();

          const pets: ShopItem[] = backendPets.map((p) => {
            const key = petKeyFromName(p.name);
            return {
              id: key, // "dragon", "cat", etc.
              name: p.name,
              icon: key,
              price: p.cost ?? 0,
              owned: p.isUnlocked,
              backendId: p.id,
              type: "pet",
            };
          });

          const customization: ShopItem[] = backendPets.flatMap((p) =>
            p.accessories.map((a) => ({
              id: mapAccessoryIdFromName(a.name),
              name: a.name,
              icon: "",
              price: a.cost ?? 0,
              owned: a.isUnlocked,
              backendId: a.id,
              type: "accessory",
            }))
          );

          setShopItems({ pets, customization });
        } else {
          console.log("Failed to fetch /api/pets:", await petsRes.text());
        }
      } catch (err) {
        console.log("Error loading shop data:", err);
      }
    };

    loadShop();
  }, [token]);

  const handlePurchaseClick = (item: ShopItem) => {
    if (item.owned || userCoins < item.price) return;
    setItemToBuy(item);
    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    if (!itemToBuy || !token || !itemToBuy.backendId) {
      setShowConfirmModal(false);
      setItemToBuy(null);
      return;
    }

    // Double-check in case UI got out of sync
    if (userCoins < itemToBuy.price || itemToBuy.owned) {
      setShowConfirmModal(false);
      setItemToBuy(null);
      return;
    }

    try {
      const API_BASE = getApiUrl();
      const res = await fetch(`${API_BASE}/api/shop/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: itemToBuy.type,       // "pet" | "accessory"
          id: itemToBuy.backendId,    // DB ID
        }),
      });

      if (!res.ok) {
        console.log("Purchase failed:", await res.text());
        setShowConfirmModal(false);
        setItemToBuy(null);
        return;
      }

      const data = await res.json(); // { success: true, points }
      setUserCoins(data.points);     // update coins from backend

      // Now update local owned state like before
      setShopItems((prevItems) => {
        const updatedItems: ShopData = {
          pets: [...prevItems.pets],
          customization: [...prevItems.customization],
        };

        const currentTab = itemToBuy.type === "pet" ? "pets" : "customization";
        const idx = updatedItems[currentTab].findIndex(
          (i) => i.id === itemToBuy.id
        );

        if (idx !== -1) {
          updatedItems[currentTab][idx] = {
            ...updatedItems[currentTab][idx],
            owned: true,
          };
        }

        return updatedItems;
      });
    } catch (err) {
      console.log("Error during purchase:", err);
    } finally {
      setShowConfirmModal(false);
      setItemToBuy(null);
    }
  };

  const cancelPurchase = () => {
    setShowConfirmModal(false);
    setItemToBuy(null);
  };

  const renderShopItem = (item: ShopItem) => {
    const isPet =
      item.id === "dragon" ||
      item.id === "cat" ||
      item.id === "dog" ||
      item.id === "lion" ||
      item.id === "unicorn";

    let content;

    if (item.id === "top-hat") {
      content = (
        <>
          <Image
            source={require("@/assets/images/tophat.png")}
            style={styles.itemImage}
            resizeMode="contain"
          />
          <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
        </>
      );
    } else if (item.id === "glasses") {
      content = (
        <>
          <Image
            source={require("@/assets/images/sunglasses.png")}
            style={styles.itemImage}
            resizeMode="contain"
          />
          <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
        </>
      );
    } else if (item.id === "cap") {
      content = (
        <>
          <Image
            source={require("@/assets/images/bbhat.png")}
            style={styles.itemImage}
            resizeMode="contain"
          />
          <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
        </>
      );
    } else if (item.id === "football") {
      content = (
        <>
          <Image
            source={require("@/assets/images/football.png")}
            style={styles.itemImage}
            resizeMode="contain"
          />
          <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
        </>
      );
    } else if (isPet) {
      const imgSource = getPetImage(item.id);
      content = (
        <>
          <Image
            source={imgSource}
            style={styles.itemImage}
            resizeMode="contain"
          />
          <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
        </>
      );
    } else {
      content = (
        <>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
        </>
      );
    }

    return (
      <View key={item.id} style={styles.itemContainer}>
        <View
          style={[
            styles.itemBox,
            { borderColor: colors.primary, backgroundColor: colors.background },
          ]}
        >
          {content}
        </View>
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.owned
              ? { backgroundColor: colors.surface }
              : { backgroundColor: "#90EE90" },
            !item.owned && userCoins < item.price && { backgroundColor: "#FFCCCC" },
          ]}
          onPress={() => handlePurchaseClick(item)}
          disabled={item.owned || (!item.owned && userCoins < item.price)}
        >
          <Text
            style={[
              styles.buttonText,
              item.owned ? { color: colors.textSecondary } : { color: "#000" },
              !item.owned && userCoins < item.price && { color: "#999" },
            ]}
          >
            {item.owned ? "OWN" : "BUY"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.dateText, { color: colors.text }]}>
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }).replace(/(\d+)/, (match) => {
            const day = parseInt(match);
            const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                          day === 2 || day === 22 ? 'nd' :
                          day === 3 || day === 23 ? 'rd' : 'th';
            return day + suffix;
          })}
        </Text>
        <View style={styles.coinsContainer}>
          <Text style={[styles.coinsText, { color: colors.text }]}>{userCoins}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            { backgroundColor: selectedTab === "pets" ? colors.primary : colors.surface },
          ]}
          onPress={() => setSelectedTab("pets")}>
          <Text style={[
            styles.tabText, 
            { color: selectedTab === "pets" ? '#FFFFFF' : colors.text }
          ]}>
            Pet
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            { backgroundColor: selectedTab === "customization" ? colors.primary : colors.surface },
          ]}
          onPress={() => setSelectedTab("customization")}>
          <Text style={[
            styles.tabText, 
            { color: selectedTab === "customization" ? '#FFFFFF' : colors.text }
          ]}>
            Costumes
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {shopItems[selectedTab].map(renderShopItem)}
        </View>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelPurchase}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            {/* X button in top right */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={cancelPurchase}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name="xmark" 
                size={24} 
                color={colors.text} 
                weight="medium"
              />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Purchase</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              Are you sure you would like to buy?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#FFCCCC' }]}
                onPress={cancelPurchase}
              >
                <Text style={{ color: '#000', fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' }}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#90EE90' }]}
                onPress={confirmPurchase}
              >
                <Text style={{ color: '#000', fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' }}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: "100%",
    paddingTop: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontFamily: "monospace",
    fontSize: 18,
    fontWeight: "bold",
  },
  coinsContainer: {
    backgroundColor: "#FFD700",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  coinsText: {
    fontFamily: "monospace",
    fontSize: 16,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  selectedTab: {
  },
  tabText: {
    fontFamily: "monospace",
    fontSize: 18,
  },
  selectedTabText: {
    fontWeight: "bold",
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
    marginBottom: 8,
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
    marginBottom: 4,
    textAlign: "center",
  },
  itemPrice: {
    fontFamily: "monospace",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  itemIcon: {
    fontSize: 40,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 4,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 300,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  modalTitle: {
    fontFamily: "monospace",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  modalMessage: {
    fontFamily: "monospace",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
});