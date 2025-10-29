import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const handleEditProfile = () => {
    router.push('/(child)/(tabs)/account/edit-profile');
  };

  const handleNotifications = () => {
    router.push('/(child)/(tabs)/account/notifications');
  };

  const handleSettings = () => {
    // TODO: Navigate to settings page when it's created
    console.log('Navigate to settings page');
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You'll need to log in again to access your account.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeaderContainer}>
          <View style={styles.profileImageContainer}>
            <Image 
              key={user?.profileImageUri || 'default'}
              source={
                user?.profileImageUri 
                  ? { uri: user.profileImageUri } 
                  : require('@/assets/images/icon.png')
              }
              style={styles.profileImage}
              defaultSource={require('@/assets/images/icon.png')}
            />
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user?.name || 'User'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, { borderColor: colors.primary }]}
          onPress={handleEditProfile}
        >
          <Ionicons name="pencil-outline" size={20} color={colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.primary }]}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { borderColor: colors.primary }]}
          onPress={handleNotifications}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.primary }]}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingsButton, { borderColor: colors.primary }]}
          onPress={handleSettings}
        >
          <Ionicons name="settings-outline" size={20} color={colors.primary} style={styles.settingsIcon} />
          <Text style={[styles.settingsText, { color: colors.primary }]}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: '#ff4444' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff4444" style={styles.logoutIcon} />
          <Text style={[styles.logoutText, { color: '#ff4444' }]}>Sign Out</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center', // Keep for centering buttons
  },
  profileHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', // Take full width to align to start
    justifyContent: 'flex-start', // Align content to the left
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  profileName: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    width: '90%',
    marginVertical: 24,
    position: 'relative',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    width: '90%',
    marginVertical: 24,
    position: 'relative',
  },
  settingsIcon: {
    marginRight: 8,
  },
  settingsText: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    width: '90%',
    marginVertical: 24,
    position: 'relative',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
});
