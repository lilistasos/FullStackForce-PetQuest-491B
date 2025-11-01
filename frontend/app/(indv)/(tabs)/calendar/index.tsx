import { View, Text, Image, StyleSheet } from "react-native";
import CalendarView from "@/components/CalendarView";
import {usePet} from "@/contexts/PetContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function CalendarScreen() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const { selectedPet } = usePet();
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Image source={selectedPet.image} style={styles.petImage} resizeMode="contain" />
        <Text style={[styles.dateText, { color: colors.text }]}>{today}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <CalendarView /> 
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  petImage: {
    width: 75,
    height: 75,
  },
  dateText: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: 'monospace',
  },
});
