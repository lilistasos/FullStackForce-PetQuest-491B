import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// Get API URL based on platform
const getApiUrl = () => {
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2, physical device needs your computer's IP
    return __DEV__ ? "http://10.0.2.2:4000" : "http://10.0.2.2:4000";
  } else if (Platform.OS === 'ios') {
    // iOS simulator uses localhost
    return __DEV__ ? "http://localhost:4000" : "http://localhost:4000";
  } else {
    // Web
    return "http://localhost:4000";
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setMessage("");
    setLoading(true);

    if (!email || !password) {
      setMessage("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = getApiUrl();
      console.log("Attempting login to:", apiUrl);
      
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", res.status);
      
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        setMessage("Server error: Invalid response");
        setLoading(false);
        return;
      }
      
      console.log("Response data:", data);

      if (!res.ok) {
        setMessage(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Save the token and user data using the auth context
      if (data.token && data.user) {
        // Map backend role to frontend role format
        const role = data.user.role === 'individual' ? 'indv' : data.user.role;
        
        const userData = {
          id: data.user.id,
          email: data.user.email,
          role: role as 'child' | 'parent' | 'indv',
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          name: data.user.firstName && data.user.lastName 
            ? `${data.user.firstName} ${data.user.lastName}` 
            : data.user.email,
          dateOfBirth: data.user.dateOfBirth,
          familyCode: data.user.familyCode,
        };
        
        // Save credentials using the auth context
        await login(data.token, userData);
        console.log("✅ Credentials saved successfully");
      }

      setMessage("Login successful!");
      
      // Navigate based on user role
      if (data.user?.role === 'parent') {
        router.replace("/(parent)/(tabs)/calendar");
      } else if (data.user?.role === 'child') {
        router.replace("/(child)/(tabs)/calendar");
      } else {
        router.replace("/(indv)/(tabs)/calendar");
      }
    } catch (err: any) {
      console.log("Error:", err);
      setMessage(err.message || "Unable to connect to the server. Make sure the backend is running on port 4000.");
      setLoading(false);
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

      {message ? (
        <Text style={[styles.message, message.includes("successful") ? styles.successMessage : styles.errorMessage]}>
          {message}
        </Text>
      ) : null}

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 18, marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#aaa", borderRadius: 10, padding: 10, width: "90%", marginBottom: 15 },
  button: { backgroundColor: "#52AFDD", padding: 12, borderRadius: 10, width: "90%", alignItems: "center", marginTop: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  message: { 
    width: "90%", 
    padding: 10, 
    borderRadius: 5, 
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
  },
  errorMessage: { backgroundColor: "#fee", color: "#c00" },
  successMessage: { backgroundColor: "#efe", color: "#0a0" },
  createAccount: { marginTop: 20, color: "#000", fontSize: 14 },
  forgotPassword: {marginTop: 20, color: "#000", fontSize: 14},
  back: { marginTop: 10, color: "#555" },
});
