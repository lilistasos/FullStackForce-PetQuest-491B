import { View, Text, Image } from "react-native";
import CalendarView from "@/components/CalendarView";
import {usePet} from "@/contexts/PetContext";

export default function CalendarScreen() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const { selectedPet } = usePet();
  
  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 10, backgroundColor: "#fff", borderBottomWidth: 1, flexDirection: "row", alignItems: "center" }}>
        <Image source={selectedPet.image} style={{width: 75, height: 75}} resizeMode="contain" />
        <Text style={{ fontSize: 22, fontWeight: "bold", fontFamily: 'monospace' }}>{today}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <CalendarView /> 
      </View>
    </View>
  );
}
