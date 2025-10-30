import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [username, setUsername] = useState(user?.name || '');
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [profileImage, setProfileImage] = useState(require('@/assets/images/icon.png'));
  const [imageChanged, setImageChanged] = useState(false);
  
  // Check if any changes have been made
  const hasChanges = username !== (user?.name || '') || firstName !== (user?.name?.split(' ')[0] || '') || imageChanged;

  const handleSaveProfile = () => {
    // TODO: Implement save profile functionality
    Alert.alert("Success", "Profile updated successfully!", [
      {
        text: "OK",
        onPress: () => router.back()
      }
    ]);
  };

  const handleEditPhoto = async () => {
    try {
      // Request permission to access the camera roll
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required to change your profile photo.");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        setProfileImage({ uri: result.assets[0].uri });
        setImageChanged(true);
      } else {
        Alert.alert("Error", "Failed to select an image. Please try again.");
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", `Failed to pick image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
      
      <View style={styles.content}>
        {/* Profile Photo Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={profileImage} 
              style={styles.profileImage}
              defaultSource={require('@/assets/images/icon.png')}
            />
          </View>
          <TouchableOpacity onPress={handleEditPhoto}>
            <Text style={[styles.editPhotoText, { color: colors.primary }]}>Edit Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Username Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.text }]}>Username</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border || '#ccc' }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={colors.textSecondary || '#999'}
            />
          </View>
        </View>

        {/* First Name Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border || '#ccc' }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor={colors.textSecondary || '#999'}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            { 
              backgroundColor: hasChanges ? colors.primary : colors.textSecondary,
              opacity: hasChanges ? 1 : 0.6
            }
          ]}
          onPress={handleSaveProfile}
          disabled={!hasChanges}
        >
          <Text style={[styles.saveButtonText, { color: 'white' }]}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  profileImageContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  editPhotoText: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputSection: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    fontSize: 18,
  },
  saveButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
