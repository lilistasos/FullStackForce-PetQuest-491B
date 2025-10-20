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

  return (
    <PetContext.Provider value={{ 
      selectedPet, 
      setSelectedPet: handleSetSelectedPet, 
      selectedAccessories, 
      setSelectedAccessories,
      resetAccessories
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
