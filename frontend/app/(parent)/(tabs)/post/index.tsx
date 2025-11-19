// Parent chooses which child to create a task for

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from '@/contexts/ThemeContext'; // Add this import

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return __DEV__ ? "http://10.0.2.2:4000" : "http://10.0.2.2:4000";
  } else if (Platform.OS === 'ios') {
    return __DEV__ ? "http://localhost:4000" : "http://localhost:4000";
  } else {
    return "http://localhost:4000";
  }
};

const ParentSelectChildScreen = () => {
  type ChildAccount = {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const selectedChildData = children.find(child => child.id === selectedChild);

  const { token } = useAuth();
  const { colors, isDarkMode } = useTheme(); // Add this hook
  
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const cardSize = (screenWidth - 60) / 2; // 2 cards per row with padding

  // Fetch children from backend
  useEffect(() => {
    const loadChildren = async () => {
      const api = getApiUrl();
      try {
        const res = await fetch(`${api}/api/parent/children`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setChildren(data);
      } catch (err) {
        console.log("Error fetching children:", err);
      }
    };
    loadChildren();
  }, []);

  // Create styles using the theme
  const styles = createStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>
        {selectedChild 
          ? `Create a task for ${selectedChildData?.firstName} ${selectedChildData?.lastName}` 
          : "Select a child to create a task"
        }
      </Text>

      <FlatList
        data={children}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.childCard,
              { width: cardSize, height: cardSize },
              selectedChild === item.id && styles.selectedChild,
            ]}
            onPress={() => setSelectedChild(item.id)}
          >
            <View style={styles.cardContent}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={require('@/assets/images/defaultpp.jpg')}
                  style={styles.profileImage}
                  defaultSource={require('@/assets/images/defaultpp.jpg')}
                />
              </View>
              <Text style={styles.childName}>
                {item.firstName} {item.lastName}
              </Text>
            </View>

            {selectedChild === item.id && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {selectedChild && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() =>
            router.push({
              pathname: "/(parent)/(tabs)/post/parentcreatetaskscreen",
              params: { childId: selectedChild },
            })
          }
        >
          <Text style={styles.nextArrow}>→</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default ParentSelectChildScreen;

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: colors.primary,
    marginBottom: 30,
  },
  row: {
    justifyContent: "space-between",
  },
  childCard: {
    backgroundColor: isDarkMode ? colors.surface : colors.primary + "20",
    borderRadius: 16,
    marginBottom: 15,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedChild: {
    borderColor: colors.primary,
    backgroundColor: isDarkMode ? colors.primary + "40" : colors.primary + "30",
  },
  cardContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  childName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    textAlign: "center",
  },
  checkmarkContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  nextButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  nextArrow: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
});