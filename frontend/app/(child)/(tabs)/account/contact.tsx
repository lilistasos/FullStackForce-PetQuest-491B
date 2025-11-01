import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ContactScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleEmailPress = () => {
    Linking.openURL('mailto:anastasios.lilis@gmail.com');
  };

  const handleGitHubPress = () => {
    Linking.openURL('https://github.com/lilistasos/FullStackForce-PetQuest-491B');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}>
          <IconSymbol 
            name="chevron.left" 
            size={24} 
            color={colors.text} 
            weight="medium"
          />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={48} color={colors.primary} />
          
          <Text style={[styles.title, { color: colors.text }]}>Contact Information</Text>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            This is a current alpha version of our app called PetQuest. Our team is made up of students at the California State University, Long Beach. If you have any questions, comments, or concerns please feel free to contact us at {' '}
            <Text 
              style={[styles.link, { color: colors.primary }]}
              onPress={handleEmailPress}
            >
              anastasios.lilis@gmail.com
            </Text>
            {' '}or refer to our {' '}
            <Text 
              style={[styles.link, { color: colors.primary }]}
              onPress={handleGitHubPress}
            >
              GitHub repository
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: "100%",
    paddingTop: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});

