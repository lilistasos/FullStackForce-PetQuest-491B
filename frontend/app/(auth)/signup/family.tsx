import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function FamilyTypeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Account</Text>

      <Text style={styles.subtitle}>Choose your role</Text>

      <View style={styles.options}>
        <TouchableOpacity onPress={() => router.push("/(auth)/signup/family-details")}>
          <Text style={styles.option}> Parent</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/signup/family-details")}>
          <Text style={styles.option}> Child</Text>
        </TouchableOpacity>
      </View>
    
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 20 },
  options: { flexDirection: "row", gap: 30 },
  option: { fontSize: 16, textAlign: "center", borderWidth: 1, padding: 10, borderRadius: 50, width: 100 },
  back: { marginTop: 30, color: "#555" },
});
