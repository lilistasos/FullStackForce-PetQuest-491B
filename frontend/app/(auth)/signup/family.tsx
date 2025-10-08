import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function FamilyTypeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Account</Text>

      <Text style={styles.subtitle}>Choose your role and Enter your Email to Continue</Text>

      <View style={styles.options}>
        <TouchableOpacity onPress={() => router.push("/(auth)/signup/parent-details")}>
          <Text style={styles.option}> Parent</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/signup/child-details")}>
          <Text style={styles.option}> Child</Text>
        </TouchableOpacity>
      </View>

      <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
    
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
  input: { borderWidth: 1, borderColor: "#aaa", borderRadius: 10, padding: 10, width: "90%", marginBottom: 20 },
  options: { flexDirection: "row", gap: 30 },
  option: { fontSize: 16, textAlign: "center", borderWidth: 1, padding: 10, borderRadius: 50, width: 100, marginBottom: 20 },
  back: { marginTop: 30, color: "#555" },
});
