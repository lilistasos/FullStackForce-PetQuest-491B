import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';

interface Pet {
  id: string;
  name: string;
  image: any;
}

interface PetAccessories {
  hats: string;
  accessories: string;
}

interface PetContextType {
  selectedPet: Pet;
  setSelectedPet: (pet: Pet) => void;
  selectedAccessories: PetAccessories;
  setSelectedAccessories: (accessories: PetAccessories) => void;
  resetAccessories: () => void;
  updatePetName: (petId: string, newName: string, token: string) => Promise<boolean>;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

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

export const PetProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPet, setSelectedPet] = useState<Pet>({
    id: "dragon",
    name: "Dragon",
    image: require("@/assets/images/pdragon.png")
  });

  const [selectedAccessories, setSelectedAccessories] = useState<PetAccessories>({
    hats: "none",
    accessories: "none"
  });

  const resetAccessories = () => {
    setSelectedAccessories({
      hats: "none",
      accessories: "none"
    });
  };

  const handleSetSelectedPet = (pet: Pet) => {
    // Only reset accessories if the pet actually changed
    if (selectedPet.id !== pet.id) {
      resetAccessories();
    }
    setSelectedPet(pet);
  };

  // Function to update pet name in backend and local state
  const updatePetName = async (petId: string, newName: string, token: string): Promise<boolean> => {
    if (!petId || !newName.trim() || !token) {
      Alert.alert("Error", "Invalid input or missing authentication");
      return false;
    }

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/pets/${petId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update pet name');
      }

      // Update local state if successful
      if (selectedPet.id === petId) {
        setSelectedPet(prev => ({ ...prev, name: newName.trim() }));
      }

      Alert.alert("Success", "Pet name updated successfully!");
      return true;
    } catch (error: any) {
      console.error('Error updating pet name:', error);
      Alert.alert("Error", error.message || "Failed to update pet name");
      return false;
    }
  };

  return (
    <PetContext.Provider value={{ 
      selectedPet, 
      setSelectedPet: handleSetSelectedPet, 
      selectedAccessories, 
      setSelectedAccessories,
      resetAccessories,
      updatePetName
    }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePet = () => {
  const context = useContext(PetContext);
  if (context === undefined) {
    throw new Error('usePet must be used within a PetProvider');
  }
  return context;
};

// Also export the getApiUrl helper for use elsewhere if needed
export { getApiUrl };