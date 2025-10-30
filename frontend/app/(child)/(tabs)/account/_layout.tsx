import { Stack } from "expo-router";

export default function AccountLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="account-details" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="parental-controls" />
      <Stack.Screen name="contact" />
    </Stack>
  );
}

