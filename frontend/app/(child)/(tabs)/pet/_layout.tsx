import { Stack } from "expo-router";

export default function PetLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="customize" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="collection" />
    </Stack>
  );
}
