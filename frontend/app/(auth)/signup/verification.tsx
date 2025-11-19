import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { getApiUrl } from '@/utils/api';

export default function VerificationScreen() {
    const router = useRouter();
    const { email, role, password, familyCode, firstName, lastName, dob } = useLocalSearchParams();
    console.log("Verification screen params:", email, role, password, familyCode, firstName, lastName);
    const [code, setCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [generatedCode, setGeneratedCode] = useState("");
    const API_URL = `${getApiUrl()}/api/auth`;

    const handleSendCode = async () => {
        try {
            const response = await fetch(`${API_URL}/send-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

    const data = await response.json();

    if (response.ok) {
      setIsCodeSent(true);
      Alert.alert("Success", data.message);
    } else {
      Alert.alert("Error", data.error || "Failed to send verification code.");
    }
  } catch (err) {
    console.error("Send code error:", err);
    Alert.alert("Error", "Network error while sending code.");
  }
};

    const handleVerification = async () => {
        try {
            const verifyResponse = await fetch(`${API_URL}/verify-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
                Alert.alert("Error", verifyData.error || "Invalid verification code.");
                return;
            }

            const formattedDob =
                typeof dob === "string" && dob.includes("/")
                    ? dob.split("/").reverse().join("-")
                    : dob || null;

            const registerBody: any = {
                email,
                password,
                firstName,
                lastName,
                role,
            };

            if (formattedDob) {
                registerBody.dateOfBirth = formattedDob;
            }

            const familyCodeValue = Array.isArray(familyCode) ? familyCode[0] : familyCode;

            if (familyCodeValue && familyCodeValue !== "") {
                registerBody.familyCode = familyCodeValue.toUpperCase();
            }

            // Register the user
            const registerResponse = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registerBody),
            });

            const registerData = await registerResponse.json();

            if (registerResponse.ok) {
                Alert.alert("Success", "Account created successfully!");
                if (role === "parent") router.replace("/(parent)/(tabs)/calendar");
                else if (role === "child") router.replace("/(child)/(tabs)/pet");
                else router.replace("/(indv)/(tabs)/calendar");
            } else {
                Alert.alert("Error", registerData.error || "Failed to create account.");
            }
        } catch (err) {
            console.error("Verification error:", err);
            Alert.alert("Error", "Network error during verification.");
        }
    };

    return (
    <View style={styles.container}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>We’ve sent a verification code to:</Text>
        <Text style={styles.email}>{email}</Text>

        <TextInput
            style={styles.input}
            placeholder="Enter Verification Code"
            keyboardType="numeric"
            value={code}
            onChangeText={setCode}
        />

        <TouchableOpacity 
            style={[
                styles.button, 
                isCodeSent && styles.buttonDisabled
            ]} 
            onPress={handleSendCode}
            disabled={isCodeSent}
        >
            <Text style={[
                styles.buttonText,
                isCodeSent && styles.buttonTextDisabled
            ]}>
                {isCodeSent ? "Code Sent" : "Send Code"}
            </Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[
                styles.button, 
                styles.verifyButton,
                (!isCodeSent || code.trim() === "") && styles.buttonDisabled
            ]} 
            onPress={handleVerification}
            disabled={!isCodeSent || code.trim() === ""}
        >
            <Text style={[
                styles.buttonText,
                (!isCodeSent || code.trim() === "") && styles.buttonTextDisabled
            ]}>
                Verify
            </Text>
        </TouchableOpacity>

    <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>Back</Text>
    </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
    title: { fontSize: 28, fontWeight: "bold", marginBottom: 10 },
    subtitle: { fontSize: 16, textAlign: "center" },
    email: { fontSize: 16, fontWeight: "600", color: "#52AFDD", marginBottom: 20 },
    input: { borderWidth: 1, borderColor: "#aaa", borderRadius: 10, padding: 10, width: "90%", textAlign: "center" },
    button: { backgroundColor: "#52AFDD", padding: 12, borderRadius: 10, width: "90%", alignItems: "center", marginTop:20 },
    verifyButton: {backgroundColor:"#4CAF50", padding: 12},
    buttonDisabled: {backgroundColor: "#cccccc",},
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    buttonTextDisabled: {color: "#666666"},
    back: { marginTop: 20, color: "#555" },
});






