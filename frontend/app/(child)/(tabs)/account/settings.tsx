import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleNavigate = (route: string) => {
    if (route === 'account') {
      router.push('/(child)/(tabs)/account/account-details');
    } else if (route === 'theme') {
      router.push('/(child)/(tabs)/account/theme');
    } else if (route === 'parental-controls') {
      router.push('/(child)/(tabs)/account/parental-controls');
    } else if (route === 'contact') {
      router.push('/(child)/(tabs)/account/contact');
    } else if (route === 'help-center') {
      router.push('/(child)/(tabs)/account/help-center');
    } else {
      // TODO: Navigate to other pages when created
      console.log(`Navigate to ${route}`);
    }
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
        {/* General Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>General</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleNavigate('account')}
          >
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>Account</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleNavigate('theme')}
          >
            <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>Theme</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Parent-Child Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Parent-Child Settings</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleNavigate('parental-controls')}
          >
            <Ionicons name="timer-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>Screen Time</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* About / Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About / Support</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleNavigate('help-center')}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>Help Center</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleNavigate('contact')}
          >
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>Contact</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleNavigate('feedback')}
          >
            <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingText, { color: colors.text }]}>Feedback</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
          </TouchableOpacity>
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
  section: {
    marginTop: 24,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  settingText: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    textAlign: 'center',
  },
});

