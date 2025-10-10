import { Stack } from 'expo-router';

export default function ChildLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(pet-pages)" />
      <Stack.Screen name="(notifications)" />
    </Stack>
  );
}