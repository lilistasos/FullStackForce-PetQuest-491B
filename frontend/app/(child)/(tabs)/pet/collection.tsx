import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal } from "react-native";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";

interface CollectionItem {
  id: string;
  name: string;
  icon: string;
  selected?: boolean;
  owned: boolean;
  level: number;
}

export default function CollectionScreen() {
  const { selectedPet, setSelectedPet } = usePet();
  const { colors } = useTheme();
  const [showPet, setShowPet] = useState<CollectionItem | null>(null);
  const [ petModal, setPetModal ] = useState(false);

  const collectionItems: CollectionItem[] = [
    { id: "dragon", name: "Dragon", icon: "", owned: true, level: 8 },
    { id: "cat", name: "Cat", icon: "", owned: true, level: 5 },
    { id: "bird", name: "Bird", icon: "", owned: false, level: 0 },
    { id: "dog", name: "Dog", icon: "", owned: false, level: 0 },
    { id: "rabbit", name: "Rabbit", icon: "", owned: false, level: 0 },
    { id: "hamster", name: "Hamster", icon: "", owned: false, level: 0 },
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

  const handleShowPet = (item : CollectionItem) => {
    setShowPet(item);
    setPetModal(true);
  }

  const renderCollectionItem = (item: CollectionItem) => (
    //<View>
    <TouchableOpacity 
      key={item.id} 
      style={styles.itemContainer}
      // onPress={() => handlePetSelect(item.id)}
      onPress={() => handleShowPet(item)}
      disabled={!item.owned}
      activeOpacity={item.owned ? 0.7 : 1}
    >
      <View style={[
        styles.itemBox,
        { backgroundColor: item.owned ? colors.background : colors.surface, borderColor: colors.primary },
        selectedPet.id === item.id && item.owned && { borderWidth: 4, borderColor: colors.primary },
        !item.owned && { borderColor: colors.border }
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
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
        ) : (
          // Empty box for unowned pets - no text
          null
        )}
      </View>
    </TouchableOpacity>
    // {showPet && (
    //   <Modal
    //     visible={petModal}
    //     transparent={true}
    //     animationType="fade"
    //     onRequestClose={() => {
    //       setPetModal(false);
    //       setShowPet(null);
    //     }}>
    //       <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    //         <View style={{backgroundColor: 'gray', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center'}}>
    //           <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
    //             <Image
    //               source={getPetImage(showPet.id)}
    //               style={{width: 150, height: 150}}
    //               resizeMode='contain'
    //             />
    //             <View style={{flex: 1, alignItems: 'center', marginTop: 10}}>
    //             <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: 'black'}}>
    //               {showPet.name}
    //             </Text>
    //             {showPet.owned ? (
    //               <Text style={{fontSize: 16, marginBottom: 20}}>
    //                 Level: {showPet.level}
    //               </Text> ) : (
    //               <Text style={{fontSize: 16, marginBottom: 20, color: 'red'}}>
    //                 You do not own this pet yet.
    //               </Text>
    //               )
    //             }
    //             <TouchableOpacity style={{backgroundColor: 'green', padding: 10, borderRadius: 5, marginBottom: 10}} 
    //             onPress={() => {handlePetSelect(showPet.id); setPetModal(false); setShowPet(null);}}>
    //               <Text>Select</Text>
    //             </TouchableOpacity>
    //           </View>
    //           </View>
              
    //         </View>
    //       </View>
    //   </Modal>
    // )}
    // </View>

  );

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
        }}>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <View style={{backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center'}}>
              <View style={{flexDirection: 'column', justifyContent: 'space-between', width: '100%', alignItems: "center"}}>
                <Image
                  source={getPetImage(showPet.id)}
                  style={{width: 150, height: 150}}
                  resizeMode='contain'
                />
                {/* <View style={{flex: 1, alignItems: 'center', marginTop: 10}}> */}
                <Text style={{fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: 'black'}}>
                  {showPet.name}
                </Text>
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
                onPress={() => {setPetModal(false); setShowPet(null)}}>
                  <Text>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{backgroundColor: 'green', padding: 10, borderRadius: 5, marginBottom: 10, marginRight: 25}} 
                onPress={() => {handlePetSelect(showPet.id); setPetModal(false); setShowPet(null);}}>
                  <Text>Select</Text>
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