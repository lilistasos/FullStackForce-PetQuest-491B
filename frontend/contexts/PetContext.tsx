import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Pet {
  id: string;
  name: string;
  image: any;
}

interface PetContextType {
  selectedPet: Pet;
  setSelectedPet: (pet: Pet) => void;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export const PetProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPet, setSelectedPet] = useState<Pet>({
    id: "dragon",
    name: "Dragon",
    image: require("@/assets/images/pdragon.png")
  });

  return (
    <PetContext.Provider value={{ selectedPet, setSelectedPet }}>
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
