import { View, Text } from "react-native";
import CalendarView from "@/components/CalendarView";


export default function CalendarScreen() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  
  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 10, backgroundColor: "#fff", borderBottomWidth: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>{today}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <CalendarView /> 
      </View>
    </View>
  );
}