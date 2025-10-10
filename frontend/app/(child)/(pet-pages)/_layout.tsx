import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';

export default function PetPagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#52AFDD", 
        },
        headerTintColor: "#000000ff", 
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerTitleAlign: 'center',
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 15 }}
            onPress={() => {
              // TODO
            }}
          >
            <Ionicons name="menu" size={24} color="black" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={() => {
              // TODO
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen 
        name="customize" 
        options={{ headerTitle: "Customize" }} 
      />
      <Stack.Screen 
        name="shop" 
        options={{ headerTitle: "Shop" }} 
      />
      <Stack.Screen 
        name="collection" 
        options={{ headerTitle: "Collection" }} 
      />
    </Stack>
  );
}