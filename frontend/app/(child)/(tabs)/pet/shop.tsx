import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Platform, ActivityIndicator } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useAchievements } from "@/contexts/AchievementContext";
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from "@/hooks/useAuth";
import { useFocusEffect } from "expo-router";
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
  const [loading, setLoading] = useState(true);

  const loadShop = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const loadShopData = async () => {
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
        }

        if (petsRes.ok) {
          const backendPets: BackendPet[] = await petsRes.json();

          // If no pets exist, initialize them
          if (backendPets.length === 0) {
            try {
              const initRes = await fetch(`${API_BASE}/api/pets/initialize`, {
                method: "POST",
                headers: { 
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
              });
              
              let initData;
              const responseText = await initRes.text();
              
              if (!initRes.ok) {
                throw new Error(`Initialize failed: ${initRes.status} - ${responseText.substring(0, 100)}`);
              }
              
              try {
                initData = JSON.parse(responseText);
              } catch (parseErr) {
                throw new Error(`Server returned non-JSON response (status ${initRes.status}): ${responseText.substring(0, 200)}`);
              }
              
              if (initRes.ok) {
                // Fetch pets again after initialization
                const newPetsRes = await fetch(`${API_BASE}/api/pets`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                
                if (newPetsRes.ok) {
                  const newBackendPets: BackendPet[] = await newPetsRes.json();
                  
                  // Filter to only show unique pets (by name) - take the first one if duplicates exist
                  const uniquePets = newBackendPets.reduce((acc, p) => {
                    const key = petKeyFromName(p.name);
                    if (!acc.find(existing => petKeyFromName(existing.name) === key)) {
                      acc.push(p);
                    }
                    return acc;
                  }, [] as BackendPet[]);

                  const pets: ShopItem[] = uniquePets.map((p) => {
                    const key = petKeyFromName(p.name);
                    return {
                      id: `pet-${p.id}`, // Use backend ID to ensure uniqueness
                      name: p.name,
                      icon: key,
                      price: p.cost ?? 0,
                      owned: p.isUnlocked,
                      backendId: p.id,
                      type: "pet",
                    };
                  });

                  // Collect all accessories and deduplicate by name
                  const allAccessories = uniquePets.flatMap((p) =>
                    p.accessories.map((a) => ({
                      id: `acc-${a.id}`, // Use backend ID to ensure uniqueness
                      name: a.name,
                      icon: "",
                      price: a.cost ?? 0,
                      owned: a.isUnlocked,
                      backendId: a.id,
                      type: "accessory",
                    }))
                  );
                  
                  // Deduplicate accessories by name, preferring unlocked ones
                  const customization: ShopItem[] = allAccessories.reduce((acc, accessory) => {
                    const existing = acc.find(existing => existing.name.toLowerCase() === accessory.name.toLowerCase());
                    if (!existing) {
                      acc.push(accessory);
                    } else if (accessory.owned && !existing.owned) {
                      // Replace locked accessory with unlocked one if we find a duplicate
                      const index = acc.indexOf(existing);
                      acc[index] = accessory;
                    }
                    return acc;
                  }, [] as ShopItem[]);

                  setShopItems({ pets, customization });
                  return;
                }
              }
            } catch (initErr: any) {
              // Silently handle initialization errors
            }
          }

          // Filter to only show unique pets (by name) - take the first one if duplicates exist
          const uniquePets = backendPets.reduce((acc, p) => {
            const key = petKeyFromName(p.name);
            if (!acc.find(existing => petKeyFromName(existing.name) === key)) {
              acc.push(p);
            }
            return acc;
          }, [] as BackendPet[]);

          const pets: ShopItem[] = uniquePets.map((p) => {
            const key = petKeyFromName(p.name);
            return {
              id: `pet-${p.id}`, // Use backend ID to ensure uniqueness
              name: p.name,
              icon: key,
              price: p.cost ?? 0,
              owned: p.isUnlocked,
              backendId: p.id,
              type: "pet",
            };
          });

          // Collect all accessories and deduplicate by name
          const allAccessories = uniquePets.flatMap((p) =>
            p.accessories.map((a) => ({
              id: `acc-${a.id}`, // Use backend ID to ensure uniqueness
              name: a.name,
              icon: "",
              price: a.cost ?? 0,
              owned: a.isUnlocked,
              backendId: a.id,
              type: "accessory",
            }))
          );
          
          // Deduplicate accessories by name, preferring unlocked ones
          const customization: ShopItem[] = allAccessories.reduce((acc, accessory) => {
            const existing = acc.find(existing => existing.name.toLowerCase() === accessory.name.toLowerCase());
            if (!existing) {
              acc.push(accessory);
            } else if (accessory.owned && !existing.owned) {
              // Replace locked accessory with unlocked one if we find a duplicate
              const index = acc.indexOf(existing);
              acc[index] = accessory;
            }
            return acc;
          }, [] as ShopItem[]);

          setShopItems({ pets, customization });
        }
      } catch (err) {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    };

    await loadShopData();
  }, [token]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  useFocusEffect(
    useCallback(() => {
      loadShop();
    }, [loadShop])
  );

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
        setShowConfirmModal(false);
        setItemToBuy(null);
        return;
      }

      const data = await res.json(); // { success: true, points }
      setUserCoins(data.points);     // update coins from backend

      // Refresh shop data to get updated unlock status from backend
      // This ensures we have the latest state after purchase
      const petsRes = await fetch(`${API_BASE}/api/pets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (petsRes.ok) {
        const backendPets: BackendPet[] = await petsRes.json();
        
        // Filter to only show unique pets (by name) - take the first one if duplicates exist
        const uniquePets = backendPets.reduce((acc, p) => {
          const key = petKeyFromName(p.name);
          if (!acc.find(existing => petKeyFromName(existing.name) === key)) {
            acc.push(p);
          }
          return acc;
        }, [] as BackendPet[]);

        const pets: ShopItem[] = uniquePets.map((p) => {
          const key = petKeyFromName(p.name);
          return {
            id: `pet-${p.id}`, // Use backend ID to ensure uniqueness
            name: p.name,
            icon: key,
            price: p.cost ?? 0,
            owned: p.isUnlocked,
            backendId: p.id,
            type: "pet",
          };
        });

        // Collect all accessories and deduplicate by name
        const allAccessories = uniquePets.flatMap((p) =>
          p.accessories.map((a) => ({
            id: `acc-${a.id}`, // Use backend ID to ensure uniqueness
            name: a.name,
            icon: "",
            price: a.cost ?? 0,
            owned: a.isUnlocked,
            backendId: a.id,
            type: "accessory",
          }))
        );
        
        // Deduplicate accessories by name (keep first occurrence)
        const customization: ShopItem[] = allAccessories.reduce((acc, accessory) => {
          if (!acc.find(existing => existing.name.toLowerCase() === accessory.name.toLowerCase())) {
            acc.push(accessory);
          }
          return acc;
        }, [] as ShopItem[]);

        setShopItems({ pets, customization });
      }
    } catch (err) {
      // Silently handle purchase errors
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
    // Check if it's a pet by checking the icon or name
    const isPet = item.type === "pet" || 
      item.icon === "dragon" ||
      item.icon === "cat" ||
      item.icon === "dog" ||
      item.icon === "lion" ||
      item.icon === "unicorn";

    let content;

    // Check accessories by name (case-insensitive)
    const itemNameLower = item.name.toLowerCase();
    
    if (item.type === "accessory") {
      if (itemNameLower.includes("top hat") || itemNameLower.includes("top-hat")) {
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
      } else if (itemNameLower.includes("sunglasses") || itemNameLower.includes("glass")) {
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
      } else if (itemNameLower.includes("baseball cap") || itemNameLower.includes("cap")) {
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
      } else if (itemNameLower.includes("football")) {
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
      } else {
        // Fallback for other accessories
        content = (
          <>
            <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
          </>
        );
      }
    } else if (isPet) {
      // Use item.icon which contains the pet key (dragon, cat, etc.)
      const imgSource = getPetImage(item.icon);
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading shop...</Text>
          </View>
        ) : shopItems[selectedTab].length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No {selectedTab === "pets" ? "pets" : "accessories"} available yet.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Check back soon!
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {shopItems[selectedTab].map(renderShopItem)}
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: "monospace",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: "monospace",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: "monospace",
    fontSize: 14,
    textAlign: "center",
  },
});