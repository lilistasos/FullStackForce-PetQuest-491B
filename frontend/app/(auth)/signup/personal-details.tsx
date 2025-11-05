import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleCreateAccount = () =>{
    if (!email) {
      Alert.alert("Error", "Email is missing, go back and ensure email was submitted.")
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !password.trim() || !confirmPassword.trim() || !dob.trim()){
      Alert.alert("Error", "Please fill in every field.")
      return;
    }
    if (password !== confirmPassword){
      Alert.alert("Error", "Passwords do not match, ensure that passwords match.")
      return;
    }  
    if (password.length < 8) {
      Alert.alert("Error", "Passwords must be at least 8 characters.")
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
    if (date.getMonth() + 1 !== month || date.getDate() !== day || date.getFullYear() !== year) {
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
      params: {email, role: "individual", firstName, lastName, password, dob},
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal Details</Text>

      <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />

      <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Text style={styles.toggleText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Date of Birth (MM/DD/YYYY)"
        value={dob}
        onChangeText={setDob}
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
  passwordContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#aaa", borderRadius: 10, width: "90%", marginBottom: 15, paddingHorizontal: 10,},
  passwordInput: { flex: 1, paddingVertical: 10,},
  toggleText: { color: "#52AFDD", fontWeight: "600", marginLeft: 10,},
});
