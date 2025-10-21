import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";

export default function ChildDetailsScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");
  const [familyCode, setFamilyCode] = useState("");

  const handleCreateAccount = () =>{
    if (!email) {
      Alert.alert("Error", "Email is missing, go back and ensure email was submitted.")
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !password.trim() || !confirmPassword.trim() || !dob.trim()){
      Alert.alert("Error", "Please fill in Non Optional fields.")
      return;
    }
    if (password !== confirmPassword){
      Alert.alert("Error", "Passwords do not match, ensure that passwords match.")
      return;
    }  
    if (password.length < 6) {
      Alert.alert("Error", "Passwords must be at least 6 characters.")
      return;
    }

    // Date Checking
    const dobRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d\d$/;
    
    if (!dobRegex.test(dob)){
      Alert.alert("Error", "Date of Birth must be in MM/DD/YYYY Format.")
      return;
    }

    const [month, day, year] = dob.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getMonth() + 1 !== month|| date.getDate() !== day || date.getFullYear() !== year) {
      Alert.alert("Error", "Date of Birth must be a valid date.");
      return;
    }
    
    const today = new Date();
    if (date > today){
      Alert.alert("Error", "Date of Birth cannot be in the future.");
      return;
    }
      
    // If No Errors, Proceed
    router.push({
      pathname: "/(auth)/signup/verification",
      params: {email, role: "child"},
    });
}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Child Account Details</Text>

      <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />

      <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Date of Birth (MM/DD/YYYY)"
        value={dob}
        onChangeText={setDob}
      />

      <TextInput
        style={styles.input}
        placeholder="Family Code (Optional)"
        value={familyCode}
        onChangeText={setFamilyCode}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreateAccount}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#aaa", borderRadius: 10, padding: 10, width: "90%", marginBottom: 15 },
  button: { backgroundColor: "#52AFDD", padding: 12, borderRadius: 10, width: "90%", alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  back: { marginTop: 20, color: "#555" },
});
