import { View, Text } from "react-native";

export default function CalendarScreen() {
  return (
    <View style={{ flex: 1 }}>
  
      <View style={{ padding: 16, backgroundColor: "#fff", borderBottomWidth: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>Calendar</Text>
      </View>

      {/* Page content */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Calendar Page Content</Text>
      </View>
    </View>
  );
}