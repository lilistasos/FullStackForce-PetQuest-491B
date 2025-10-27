import { Stack } from "expo-router";

export default function AccountLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}

