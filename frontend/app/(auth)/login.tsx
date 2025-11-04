import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth"; // ✅ import the auth hook

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth(); // ✅ access login() from context

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter both email and password");
      return;
    }

    try {
      const res = await fetch("http://10.0.2.2:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (!res.ok) {
        setMessage(data.error || "Login failed");
        return;
      }

      // ✅ Save token + user in global auth and SecureStore
      await login(data.token, data.user);

      setMessage("Login successful!");
      router.replace("/(indv)/(tabs)/calendar"); // redirect after login
    } catch (err) {
      console.log("Error:", err);
      setMessage("Unable to connect to the server");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Log in to your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
        <Text style={styles.createAccount}>Don’t have an account? Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>Back</Text>
      </TouchableOpacity>

      {message ? <Text style={{ color: "red", marginTop: 10 }}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 18, marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#aaa", borderRadius: 10, padding: 10, width: "90%", marginBottom: 15 },
  button: { backgroundColor: "#52AFDD", padding: 12, borderRadius: 10, width: "90%", alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  createAccount: { marginTop: 20, color: "#000", fontSize: 14 },
  forgotPassword: { marginTop: 20, color: "#000", fontSize: 14 },
  back: { marginTop: 10, color: "#555" },
});
