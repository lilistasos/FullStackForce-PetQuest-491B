import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiUrl } from '@/utils/api';

export default function AccountDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setShowDeleteModal(true);
          }
        }
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText === 'DELETE') {
      setShowDeleteModal(false);
      setDeleteConfirmText('');

      if (!user) {
        Alert.alert("Error", "You must be logged in to delete your account.");
        return;
      }

      try {
        const token = await SecureStore.getItemAsync("token");

        if (!token) {
          Alert.alert("Error", "No authentication token found.");
          return;
        }

        const API_BASE_URL = getApiUrl();

        const endpoint = `${API_BASE_URL}/api/account/delete-account`;
        console.log("🪪 Deleting account at:", endpoint);

        const response = await fetch(endpoint, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          await SecureStore.deleteItemAsync("token");
          await SecureStore.deleteItemAsync("user");
          Alert.alert("Account Deleted", "Your account has been permanently deleted.", [
            { text: "OK", onPress: () => router.replace("/(auth)/signup") }
          ]);
        } else {
          const errorData = await response.json();
          Alert.alert("Error", errorData.error || "Failed to delete account.");
        }
      } catch (err) {
        console.error("❌ Error deleting account:", err);
        Alert.alert("Error", "An unexpected error occurred while deleting the account.");
      }
    } else {
      Alert.alert("Invalid Confirmation", "You must type 'DELETE' exactly to confirm.");
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
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
        <View style={styles.detailsContainer}>
          {/* Email */}
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <View style={styles.detailLeft}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Email:</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={[styles.detailValue, { color: colors.text }]}>{user?.email || 'N/A'}</Text>
            </View>
          </View>

          {/* Password */}
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <View style={styles.detailLeft}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Password:</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {passwordVisible ? 'password123' : '**********'}
              </Text>
              <TouchableOpacity 
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={passwordVisible ? 'eye-outline' : 'eye-off-outline'} 
                  size={24} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date of Birth */}
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <View style={styles.detailLeft}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Date of Birth:</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-US', { 
                  month: '2-digit', 
                  day: '2-digit', 
                  year: 'numeric' 
                }) : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Family Code */}
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <View style={styles.detailLeft}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Family Code:</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {user?.familyCode || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Language */}
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <View style={styles.detailLeft}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Language:</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={[styles.detailValue, { color: colors.text }]}>English</Text>
            </View>
          </View>
        </View>

        {/* Delete Account Button */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Final Confirmation</Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              This will permanently delete your account and all data. Type 'DELETE' to confirm.
            </Text>
            <TextInput
              style={[styles.deleteConfirmInput, { 
                borderColor: colors.border, 
                color: colors.text,
                backgroundColor: colors.surface 
              }]}
              value={deleteConfirmText}
              onChangeText={(text) => setDeleteConfirmText(text.toUpperCase())}
              autoFocus={true}
              placeholder="DELETE"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonFirst, { backgroundColor: '#f0f0f0' }]}
                onPress={handleCancelDelete}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonLast, { backgroundColor: '#d9534f' }]}
                onPress={handleConfirmDelete}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Confirm Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  detailsContainer: {
    marginTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  detailLeft: {
    flex: 0.4,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailRight: {
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'monospace',
  },
  eyeButton: {
    marginLeft: 8,
    padding: 4,
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 14,
    padding: 0,
    width: '80%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  modalDescription: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  deleteConfirmInput: {
    borderWidth: 0.5,
    borderRadius: 6,
    padding: 12,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 20,
    marginHorizontal: 16,
  },
  modalButtons: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.15)',
    flexDirection: 'row',
    height: 44,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonFirst: {
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(0, 0, 0, 0.15)',
  },
  modalButtonLast: {
    borderRightWidth: 0,
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

