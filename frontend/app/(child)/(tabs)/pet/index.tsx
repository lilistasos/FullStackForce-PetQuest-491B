import React, { useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput, 
  Alert,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePet } from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth"; // Updated import

// Helper function to get the correct API URL for different platforms
const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return __DEV__ ? "http://10.0.2.2:4000" : "http://10.0.2.2:4000";
  } else if (Platform.OS === 'ios') {
    return __DEV__ ? "http://localhost:4000" : "http://localhost:4000";
  } else {
    return "http://localhost:4000";
  }
};

export default function PetScreen() {
  const router = useRouter();
  const { selectedPet, updatePetName } = usePet();
  const { colors } = useTheme();
  const { token } = useAuth(); // Using useAuth hook
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newPetName, setNewPetName] = useState(selectedPet.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditPress = () => {
    setNewPetName(selectedPet.name);
    setEditModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!newPetName.trim()) {
      Alert.alert("Error", "Pet name cannot be empty");
      return;
    }

    if (newPetName.trim() === selectedPet.name) {
      setEditModalVisible(false);
      return;
    }

    setIsLoading(true);
    try {
      const API_URL = getApiUrl();
      
      // Update pet name in backend
      const response = await fetch(`${API_URL}/api/pets/${selectedPet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPetName.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update pet name');
      }

      const updatedPet = await response.json();
      
      // Update in context
      updatePetName(selectedPet.id, updatedPet.name);
      
      Alert.alert("Success", "Pet name updated successfully!");
      setEditModalVisible(false);
    } catch (error: any) {
      console.error('Error updating pet name:', error);
      Alert.alert("Error", error.message || "Failed to update pet name. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewPetName(selectedPet.name);
    setEditModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={[styles.petName, { color: colors.text }]}>
            {selectedPet.name}
          </Text>
          <TouchableOpacity 
            onPress={handleEditPress}
            style={styles.editButton}
            accessibilityLabel="Edit pet name"
          >
            <Ionicons name="pencil-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
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

      {/* Edit Pet Name Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={handleCancel}
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
              placeholderTextColor={colors.textSecondary || "#999"}
              maxLength={30}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveName}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
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
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 0.05,
  },
  petName: {
    fontSize: 34,
    fontWeight: "bold",
    fontFamily: "monospace",
    textAlign: "center",
    marginRight: 10,
  },
  editButton: {
    padding: 8,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 10,
  },
  saveButton: {
    marginLeft: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});