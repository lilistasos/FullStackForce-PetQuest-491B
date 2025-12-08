import React, { useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export default function PetScreen() {
  const router = useRouter();
  const { selectedPet, updatePetName } = usePet();
  const { colors } = useTheme();
  const { token } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [newPetName, setNewPetName] = useState(selectedPet.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditName = async () => {
    if (!newPetName.trim()) {
      return;
    }

    if (newPetName === selectedPet.name) {
      setModalVisible(false);
      return;
    }

    setIsLoading(true);
    const success = await updatePetName(selectedPet.id, newPetName, token || '');
    setIsLoading(false);
    
    if (success) {
      setModalVisible(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="pencil-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.petName, { color: colors.text }]}>{selectedPet.name}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image source={selectedPet.image} style={styles.petImage} resizeMode="contain" />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/(child)/(tabs)/pet/customize")}
        >
          <Ionicons name="color-palette-outline" size={24} color={colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Customize</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/(child)/(tabs)/pet/shop")}
        >
          <Ionicons name="cart-outline" size={24} color={colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Shop</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/(child)/(tabs)/pet/collection")}
        >
          <Ionicons name="pricetags-outline" size={24} color={colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Collection</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Edit Name Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setNewPetName(selectedPet.name);
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Pet Name</Text>
            
            <TextInput
              style={[styles.input, { 
                color: colors.text, 
                borderColor: colors.border,
                backgroundColor: colors.background 
              }]}
              value={newPetName}
              onChangeText={setNewPetName}
              placeholder="Enter new pet name"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              maxLength={20}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setNewPetName(selectedPet.name);
                  setModalVisible(false);
                }}
                disabled={isLoading}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleEditName}
                disabled={isLoading || !newPetName.trim()}
              >
                <Text style={styles.modalButtonText}>
                  {isLoading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    width: "100%",
    paddingTop: 20,
    alignItems: "center",
    position: "relative",
  },
  editButton: {
    position: "absolute",
    right: 20,
    top: 20,
    padding: 8,
    borderRadius: 20,
  },
  petName: {
    fontSize: 34,
    fontWeight: "bold",
    fontFamily: "monospace",
    marginTop: 20,
    textAlign: "center",
    marginBottom: 0.05,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  petImage: {
    width: 300,
    height: 300,
  },
  buttonContainer: {
    width: "90%",
    alignItems: "center",
    marginBottom: 40,
  },
  button: {
    width: "100%",
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 12,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});