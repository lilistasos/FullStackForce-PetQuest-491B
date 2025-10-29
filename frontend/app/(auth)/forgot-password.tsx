import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const router = useRouter();
    const [message, setMessage] = useState("");


    const handleResetPassword = async () => {
        if (!email) {
            setMessage("Enter your email address.");
            return;
        }

        try {
            // Changed endpoint to new route
            const res = await fetch("http://10.0.2.2:4000/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Failed to send reset code.");
                return;
            }

            // Backend logs reset code to console for testing
            setMessage("Password reset code sent (check console).");
            Alert.alert("Success", "A reset code has been sent to your email (check console).");

            // Navigate to reset password screen with email
            router.push({
                pathname: "/(auth)/reset-password",
                params: { email },
            });
        } catch (err) {
            console.error("Error sending reset code:", err);
            setMessage("Unable to connect to the server.");
        }
    };

    return (
    <View style={styles.container}>
        <Text style={styles.title}>Forgot Your Password?</Text>
        <Text style={styles.subtitle}>No Problem! Enter your email and we'll send you a password reset link</Text>

        <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>Back to Login</Text>
        </TouchableOpacity>

    </View>
);
    //TODO: Replace this part with API call for password reset once made
    //Alert.alert("Password Reset", "A reset link has been sent to ${email}.");
    //router.back()
};


const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
    title: { fontSize: 32, fontWeight: "bold", marginBottom: 10 },
    subtitle: { fontSize: 16, marginBottom: 20, textAlign:"center", color:"#444"},
    input: { borderWidth: 1, borderColor: "#aaa", borderRadius: 10, padding: 10, width: "90%", marginBottom: 15 },
    button: { backgroundColor: "#52AFDD", padding: 12, borderRadius: 10, width: "90%", alignItems: "center", marginTop: 10 },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    back: { marginTop: 10, color: "#555" },
});