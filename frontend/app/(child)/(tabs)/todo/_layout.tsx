import { Stack } from "expo-router";

export default function TodoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="task-history" />
    </Stack>
  );
}

