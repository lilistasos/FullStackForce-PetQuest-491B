import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";

export default function VerificationScreen(){
    const router = useRouter();
    const {email, role} = useLocalSearchParams<{ email: string; role: string }>();
    const [code, setCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);

    const handleSendCode = async () => {
        if (!email) {
        Alert.alert("Error", "No email found. Please go back and enter your details again.");
        return;
        }

        try {
            //Simulating Sending Code Here (Replace with the necessary API calls later)
            console.log(`Sending verification code to ${email}`);
            setIsCodeSent(true);
            Alert.alert("A verification code has been sent to ${email}.")
        }
        catch{
            Alert.alert("Error", "Failed to send a verification code, Please try again.")
        }
    };

    const handleVerification = async () => {
        if (code.trim() === "") {
            Alert.alert("Error", "Please enter the verification code.");
            return;
        }
    try{
        //Simulating a successful input, Replace with necessary API calls later
        console.log('Verifying code ${code} for ${email}');

        //Simulating verification success
        if(code === "123456"){
            Alert.alert("Success", "Email successfully verified!");
            if (role === "individual") {
                router.replace("/(indv)/(tabs)/calendar");
            }
            if (role === "parent") {
                router.replace("/(parent)/(tabs)/calendar");
            }
            if (role === "child") {
                router.replace("/(child)/(tabs)/calendar");
            }
            }
        else{
            Alert.alert("Error", "Invalid verification code. Please Try Again.")
        }
    }
    catch{
        Alert.alert("Error", "Verfication Failed, Please wait a moment and try again.")
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






