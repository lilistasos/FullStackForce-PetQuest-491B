import { Stack } from "expo-router";

export default function AccountLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="account-details" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="help-center" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="preferences" />
    </Stack>
  );
}

