import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function SignupScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PetQuest</Text>
      <Text style={styles.subtitle}>Create an account</Text>

      <Text style={styles.prompt}>Select one of the following accounts to create</Text>

      <View style={styles.options}>
        <TouchableOpacity onPress={() => router.push("/(auth)/signup/personal")}>
          <Text style={styles.option}>Personal</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/signup/family")}>
          <Text style={styles.option}>Family</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push("/(auth)/login")}>   
        <Text style={styles.login}>Have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 18, marginBottom: 24 },
  prompt: { fontSize: 14, marginBottom: 20 },
  options: { flexDirection: "row", gap: 30 },
  option: { fontSize: 16, textAlign: "center", borderWidth: 1, padding: 10, borderRadius: 50, width: 100 },
  login: { marginTop: 30, fontSize: 14, color: "black" },
});
