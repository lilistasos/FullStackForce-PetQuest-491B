import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  updatePetName: (petId: string, newName: string) => void; // Added function
}

const PetContext = createContext<PetContextType | undefined>(undefined);

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

  // New function to update pet name
  const updatePetName = (petId: string, newName: string) => {
    if (selectedPet.id === petId) {
      setSelectedPet(prev => ({
        ...prev,
        name: newName
      }));
    }
    // Note: Might want to store multiple pets in state if there are have more than one and update the correct pet based on ID
  };

  return (
    <PetContext.Provider value={{ 
      selectedPet, 
      setSelectedPet: handleSetSelectedPet, 
      selectedAccessories, 
      setSelectedAccessories,
      resetAccessories,
      updatePetName // Added to context
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