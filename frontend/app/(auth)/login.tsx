import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Modal, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";

import { getApiUrl } from '@/utils/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
      
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        setMessage("Server error: Invalid response");
        setLoading(false);
        return;
      }

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
        
        setLoading(false);
        
        // Show daily reward popup if awarded (only for children)
        if (data.dailyRewardAwarded && data.user.role === 'child') {
          setShowDailyReward(true);
          // Animate popup
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();
          
          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              setShowDailyReward(false);
              navigateAfterReward(data.user?.role);
            });
          }, 3000);
        } else {
          // Navigate immediately if no reward
          navigateAfterReward(data.user?.role);
        }
      }
    } catch (err: any) {
      console.error("Login error:", err.message || err);
      setMessage(err.message || "Unable to connect to the server. Make sure the backend is running on port 4000.");
      setLoading(false);
    }
  };

  const navigateAfterReward = (role?: string) => {
    setMessage("Login successful!");
    
    // Navigate based on user role
    if (role === 'parent') {
      router.replace("/(parent)/(tabs)/calendar");
    } else if (role === 'child') {
      router.replace("/(child)/(tabs)/calendar");
    } else {
      router.replace("/(indv)/(tabs)/calendar");
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

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.showButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.showButtonText}>
            {showPassword ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      </View>

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

      {/* Daily Reward Popup */}
      <Modal
        visible={showDailyReward}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowDailyReward(false);
            navigateAfterReward('child');
          });
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              setShowDailyReward(false);
              navigateAfterReward('child');
            });
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.rewardPopup,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.rewardIconContainer}>
                <Ionicons name="gift" size={64} color="#FFD700" />
              </View>
              <Text style={styles.rewardTitle}>Daily Login Reward! 🎉</Text>
              <Text style={styles.rewardMessage}>
                You've earned <Text style={styles.rewardPoints}>5 points</Text> for logging in today!
              </Text>
              <View style={styles.rewardStars}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Ionicons name="star" size={32} color="#FFD700" />
                <Ionicons name="star" size={24} color="#FFD700" />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  passwordContainer: { flexDirection: "row", alignItems: "center", width: "90%", marginBottom: 15},
  showButton: { position: "absolute", right: 15},
  showButtonText: {color: "#52AFDD", fontWeight: "bold"},
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  rewardPopup: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "80%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  rewardIconContainer: {
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  rewardMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  rewardPoints: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#52AFDD",
  },
  rewardStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
