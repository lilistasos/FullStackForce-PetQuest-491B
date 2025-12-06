import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { getApiUrl } from '@/utils/api';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function ChildOptionsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { token } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingChild, setAddingChild] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state for adding child
  const [newChildEmail, setNewChildEmail] = useState('');
  const [newChildPassword, setNewChildPassword] = useState('');
  const [newChildFirstName, setNewChildFirstName] = useState('');
  const [newChildLastName, setNewChildLastName] = useState('');
  const [newChildDateOfBirth, setNewChildDateOfBirth] = useState('');

  const fetchChildren = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/users/children`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }

      const data = await response.json();
      setChildren(data);
    } catch (error) {
      console.error('Error fetching children:', error);
      Alert.alert('Error', 'Failed to load children');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchChildren();
    }, [fetchChildren])
  );

  const handleAddChild = async () => {
    if (!newChildEmail.trim() || !newChildPassword.trim() || !newChildFirstName.trim() || !newChildLastName.trim() || !newChildDateOfBirth.trim()) {
      Alert.alert('Error', 'Please fill in all fields including date of birth');
      return;
    }

    if (newChildPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    // Validate date of birth format and that it's in the past
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const trimmedDob = newChildDateOfBirth.trim();
    if (!dateRegex.test(trimmedDob)) {
      Alert.alert('Error', 'Date of birth must be in YYYY-MM-DD format (e.g., 2010-05-15)');
      return;
    }
    
    const dobDate = new Date(trimmedDob);
    if (isNaN(dobDate.getTime())) {
      Alert.alert('Error', 'Invalid date format');
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dobDate.setHours(0, 0, 0, 0);
    if (dobDate >= today) {
      Alert.alert('Error', 'Date of birth must be in the past');
      return;
    }

    try {
      setAddingChild(true);
      const API_URL = getApiUrl();
      const requestBody = {
        email: newChildEmail.trim(),
        password: newChildPassword,
        firstName: newChildFirstName.trim(),
        lastName: newChildLastName.trim(),
        dateOfBirth: trimmedDob, // Already in YYYY-MM-DD format
      };
      console.log('Adding child with data:', { ...requestBody, password: '***' });
      const response = await fetch(`${API_URL}/api/users/add-child`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add child');
      }

      // Reset form
      setNewChildEmail('');
      setNewChildPassword('');
      setNewChildFirstName('');
      setNewChildLastName('');
      setNewChildDateOfBirth('');
      setShowAddModal(false);

      // Refresh children list
      await fetchChildren();

      Alert.alert('Success', 'Child added successfully');
    } catch (error: any) {
      console.error('Error adding child:', error);
      Alert.alert('Error', error.message || 'Failed to add child');
    } finally {
      setAddingChild(false);
    }
  };

  const handleDeleteChild = (child: Child) => {
    Alert.alert(
      'Delete Child',
      `Are you sure you want to remove ${child.firstName} ${child.lastName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(child.id);
              const API_URL = getApiUrl();
              const response = await fetch(`${API_URL}/api/users/remove-child/${child.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to remove child');
              }

              // Refresh children list
              await fetchChildren();

              Alert.alert('Success', 'Child removed successfully');
            } catch (error: any) {
              console.error('Error deleting child:', error);
              Alert.alert('Error', error.message || 'Failed to remove child');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const buttonTextColor = colors.primary === '#0077B6' ? '#FFFFFF' : '#000000';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Child Options</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage children in your family
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : children.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No children added yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Tap the button below to add your first child
            </Text>
          </View>
        ) : (
          <View style={styles.childrenList}>
            {children.map((child) => (
              <View
                key={child.id}
                style={[styles.childCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.childInfo}>
                  <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
                  <View style={styles.childDetails}>
                    <Text style={[styles.childName, { color: colors.text }]}>
                      {child.firstName} {child.lastName}
                    </Text>
                    <Text style={[styles.childEmail, { color: colors.textSecondary }]}>
                      {child.email}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteChild(child)}
                  disabled={deletingId === child.id}
                  style={[styles.deleteButton, { backgroundColor: '#FF4444' }]}
                >
                  {deletingId === child.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={buttonTextColor} />
          <Text style={[styles.addButtonText, { color: buttonTextColor }]}>Add Child</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Child Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Child</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>First Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Enter first name"
                  placeholderTextColor={colors.textSecondary}
                  value={newChildFirstName}
                  onChangeText={setNewChildFirstName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Last Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Enter last name"
                  placeholderTextColor={colors.textSecondary}
                  value={newChildLastName}
                  onChangeText={setNewChildLastName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Enter email"
                  placeholderTextColor={colors.textSecondary}
                  value={newChildEmail}
                  onChangeText={setNewChildEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Enter password (min 8 characters)"
                  placeholderTextColor={colors.textSecondary}
                  value={newChildPassword}
                  onChangeText={setNewChildPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Date of Birth</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="YYYY-MM-DD (e.g., 2010-05-15)"
                  placeholderTextColor={colors.textSecondary}
                  value={newChildDateOfBirth}
                  onChangeText={setNewChildDateOfBirth}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddChild}
                disabled={addingChild}
              >
                {addingChild ? (
                  <ActivityIndicator size="small" color={buttonTextColor} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: buttonTextColor }]}>Add</Text>
                )}
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
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  childrenList: {
    marginBottom: 20,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childDetails: {
    marginLeft: 12,
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  childEmail: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor set inline
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
