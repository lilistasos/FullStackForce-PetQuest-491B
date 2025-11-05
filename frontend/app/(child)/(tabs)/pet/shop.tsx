import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ShopItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  owned: boolean;
}

interface ShopData {
  pets: ShopItem[];
  customization: ShopItem[];
}

export default function ShopScreen() {
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState<keyof ShopData>("pets");
  const [userCoins, setUserCoins] = useState(100);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToBuy, setItemToBuy] = useState<ShopItem | null>(null);
  const [shopItems, setShopItems] = useState<ShopData>({
    pets: [
      { id: "cat", name: "Cat", icon: "", price: 50, owned: true },
      { id: "dog", name: "Dog", icon: "", price: 50, owned: false },
      { id: "lion", name: "Lion", icon: "", price: 75, owned: false },
      { id: "unicorn", name: "Unicorn", icon: "", price: 100, owned: false },
    ],
    customization: [
      { id: "cap", name: "Baseball Cap", icon: "", price: 15, owned: true },
      { id: "top-hat", name: "Top Hat", icon: "", price: 25, owned: false },
      { id: "glasses", name: "Sunglasses", icon: "", price: 20, owned: false },
      { id: "football", name: "Football", icon: "", price: 10, owned: true },
    ]
  });

  const handlePurchaseClick = (item: ShopItem) => {
    if (!item.owned && userCoins >= item.price) {
      setItemToBuy(item);
      setShowConfirmModal(true);
    }
  };

  const confirmPurchase = () => {
    if (itemToBuy) {
      setUserCoins(userCoins - itemToBuy.price);
      
      // Update the item to owned in the shopItems state
      setShopItems(prevItems => {
        const updatedItems = { ...prevItems };
        const currentTab = selectedTab;
        const itemIndex = updatedItems[currentTab].findIndex(item => item.id === itemToBuy.id);
        
        if (itemIndex !== -1) {
          updatedItems[currentTab] = [...updatedItems[currentTab]];
          updatedItems[currentTab][itemIndex] = {
            ...updatedItems[currentTab][itemIndex],
            owned: true
          };
        }
        
        return updatedItems;
      });
      
      setShowConfirmModal(false);
      setItemToBuy(null);
    }
  };

  const cancelPurchase = () => {
    setShowConfirmModal(false);
    setItemToBuy(null);
  };

  const renderShopItem = (item: ShopItem) => (
    <View key={item.id} style={styles.itemContainer}>
      <View style={[styles.itemBox, { borderColor: colors.primary, backgroundColor: colors.background }]}>
        {item.id === "top-hat" ? (
          <>
            <Image 
              source={require("@/assets/images/tophat.png")} 
              style={styles.itemImage}
              resizeMode="contain"
            />
            <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
          </>
        ) : item.id === "glasses" ? (
          <>
            <Image 
              source={require("@/assets/images/sunglasses.png")} 
              style={styles.itemImage}
              resizeMode="contain"
            />
            <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
          </>
        ) : item.id === "cap" ? (
          <>
            <Image 
              source={require("@/assets/images/bbhat.png")} 
              style={styles.itemImage}
              resizeMode="contain"
            />
            <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
          </>
        ) : item.id === "football" ? (
          <>
            <Image 
              source={require("@/assets/images/football.png")} 
              style={styles.itemImage}
              resizeMode="contain"
            />
            <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
          </>
        ) : item.id === "cat" ? (
          <>
            <Image 
              source={require("@/assets/images/cat.png")} 
              style={styles.itemImage}
              resizeMode="contain"
            />
            <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
          </>
        ) : item.id === "dog" ? (
          <>
            <Image 
              source={require("@/assets/images/fbdog.png")} 
              style={styles.itemImage}
              resizeMode="contain"
            />
            <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
          </>
        ) : item.id === "lion" ? (
          <>
            <Image 
              source={require("@/assets/images/lion.png")} 
              style={styles.itemImage}
              resizeMode="contain"
            />
            <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
          </>
        ) : item.id === "unicorn" ? (
          <>
            <Image 
              source={require("@/assets/images/unicorn.png")} 
              style={styles.itemImage}
              resizeMode="contain"
            />
            <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.itemPrice, { color: colors.text }]}>{item.price}</Text>
          </>
        )}
      </View>
      <TouchableOpacity 
        style={[
          styles.actionButton, 
          item.owned ? { backgroundColor: colors.surface } : { backgroundColor: '#90EE90' },
          !item.owned && userCoins < item.price && { backgroundColor: '#FFCCCC' }
        ]}
        onPress={() => handlePurchaseClick(item)}
        disabled={item.owned || (!item.owned && userCoins < item.price)}>
        <Text style={[
          styles.buttonText,
          item.owned ? { color: colors.textSecondary } : { color: '#000' },
          !item.owned && userCoins < item.price && { color: '#999' }
        ]}>
          {item.owned ? "OWN" : "BUY"}
        </Text>
      </TouchableOpacity>
    </View>
  );

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