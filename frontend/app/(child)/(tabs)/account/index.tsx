import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationCenter from '@/components/NotificationCenter'; // ✅ open center as a modal


export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, isDarkMode } = useTheme();


  const [showFamilyCodeModal, setShowFamilyCodeModal] = useState(false);
  const [familyCode, setFamilyCode] = useState('');


  // ✅ state to control the notifications modal
  const [notifOpen, setNotifOpen] = useState(false);


  const handleEditProfile = () => {
    router.push('/(child)/(tabs)/account/edit-profile');
  };


  const handleNotifications = () => {
    // ❌ was pushing a route that didn’t open anything on web
    // router.push('/(child)/(tabs)/account/notifications');
    // ✅ open the Notification Center modal instead
    setNotifOpen(true);
  };


  const handleSettings = () => {
    setShowFamilyCodeModal(true);
  };


  const handleFamilyCodeSubmit = () => {
    if (familyCode.length === 8) {
      setShowFamilyCodeModal(false);
      setFamilyCode('');
      router.push('/(child)/(tabs)/account/settings');
    } else {
      Alert.alert('Invalid Code', 'Please enter an 8-digit family code.');
    }
  };


  const handleFamilyCodeCancel = () => {
    setShowFamilyCodeModal(false);
    setFamilyCode('');
  };


  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      "Are you sure you want to sign out? You'll need to log in again to access your account.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
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
                  : require('@/assets/images/defaultpp.jpg')
              }
              style={styles.profileImage}
              defaultSource={require('@/assets/images/defaultpp.jpg')}
            />
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user?.firstName || 'User'}
          </Text>
        </View>


        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleEditProfile}
        >
          <Ionicons name="pencil-outline" size={24} color={colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Edit Profile</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
        </TouchableOpacity>


        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleNotifications}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.primary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Notifications</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
        </TouchableOpacity>


        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleSettings}
        >
          <Ionicons name="settings-outline" size={24} color={colors.primary} style={styles.settingsIcon} />
          <Text style={[styles.settingsText, { color: colors.text }]}>Settings</Text>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
        </TouchableOpacity>


        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: isDarkMode ? '#2a1a1a' : '#fff5f5', borderColor: '#ff4444' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff4444" style={styles.logoutIcon} />
          <Text style={[styles.logoutText, { color: '#ff4444' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>


      {/* Family Code Modal */}
      <Modal
        visible={showFamilyCodeModal}
        transparent
        animationType="fade"
        onRequestClose={handleFamilyCodeCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Family Code</Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Please enter your 8-digit family code to access settings.
            </Text>
            <TextInput
              style={[
                styles.familyCodeInput,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
              ]}
              value={familyCode}
              onChangeText={setFamilyCode}
              keyboardType="numeric"
              maxLength={8}
              autoFocus
              placeholder="12345678"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#f0f0f0' }]}
                onPress={handleFamilyCodeCancel}
              >
                <Text style={[styles.modalButtonText, { color: '#000000' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleFamilyCodeSubmit}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* ✅ Notification Center Modal */}
      <NotificationCenter visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  profileSection: { paddingTop: 40, paddingHorizontal: 20, alignItems: 'center' },
  profileHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-start',
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
  profileImage: { width: 140, height: 140, borderRadius: 70 },
  profileName: { fontSize: 32, fontWeight: 'bold' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    width: '90%',
    marginVertical: 24,
  },
  buttonIcon: { marginRight: 8 },
  buttonText: { fontSize: 20, fontWeight: 'bold', flex: 1, marginLeft: 12, textAlign: 'center' },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    width: '90%',
    marginVertical: 24,
  },
  settingsIcon: { marginRight: 8 },
  settingsText: { fontSize: 20, fontWeight: 'bold', flex: 1, marginLeft: 12, textAlign: 'center' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    width: '90%',
    marginVertical: 24,
  },
  logoutIcon: { marginRight: 8 },
  logoutText: { fontSize: 20, fontWeight: 'bold', flex: 1, marginLeft: 12, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 12, padding: 24, width: '80%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  modalDescription: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  familyCodeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: 'bold' },
});


