import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile page when it's created
    console.log('Navigate to edit profile page');
  };

  const handleSettings = () => {
    // TODO: Navigate to settings page when it's created
    console.log('Navigate to settings page');
  };

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeaderContainer}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.profileImage}
              defaultSource={require('@/assets/images/icon.png')}
            />
          </View>
          <Text style={styles.profileName}>
            {user?.name || 'User'}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleEditProfile}
        >
          <Ionicons name="pencil-outline" size={20} color="#52AFDD" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={handleSettings}
        >
          <Ionicons name="settings-outline" size={20} color="#52AFDD" style={styles.settingsIcon} />
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    color: '#000',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#52AFDD',
    width: '80%',
    marginBottom: 30,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#52AFDD',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#52AFDD',
    width: '80%',
    marginBottom: 20,
  },
  settingsIcon: {
    marginRight: 8,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#52AFDD',
  },
});
