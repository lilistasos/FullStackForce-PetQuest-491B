import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signup/index" />
      <Stack.Screen name="signup/personal" />
      <Stack.Screen name="signup/personal-details" />
      <Stack.Screen name="signup/family" />
      <Stack.Screen name="signup/family-details" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
