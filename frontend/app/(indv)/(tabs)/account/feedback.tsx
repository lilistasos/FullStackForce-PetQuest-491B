import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

// Function to calculate luminance and determine text color
const getContrastColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.4 ? '#000000' : '#FFFFFF';
};

const FEEDBACK_CATEGORIES = [
  { id: 'general', label: 'General', icon: 'chatbubble-outline' },
  { id: 'bug', label: 'Bug Report', icon: 'bug-outline' },
  { id: 'improvement', label: 'Improvement', icon: 'trending-up-outline' },
  { id: 'feature', label: 'Feature Request', icon: 'bulb-outline' },
];

const MAX_CHARACTERS = 1000;

export default function FeedbackScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const buttonTextColor = getContrastColor(colors.primary);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Empty Feedback', 'Please enter your feedback before submitting.');
      return;
    }

    if (feedbackText.trim().length < 10) {
      Alert.alert('Feedback Too Short', 'Please provide at least 10 characters of feedback.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => {
              setFeedbackText('');
              setSelectedCategory('general');
              router.back();
            }
          }
        ]
      );
    }, 1000);
  };

  const charactersRemaining = MAX_CHARACTERS - feedbackText.length;
  const canSubmit = feedbackText.trim().length >= 10 && !isSubmitting;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Share Your Feedback</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Help us improve PetQuest by sharing your thoughts, reporting bugs, or suggesting features.
          </Text>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
          <View style={styles.categoryContainer}>
            {FEEDBACK_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selectedCategory === category.id ? colors.primary : colors.surface,
                    borderColor: selectedCategory === category.id ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color={selectedCategory === category.id ? buttonTextColor : colors.text}
                />
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: selectedCategory === category.id ? buttonTextColor : colors.text
                    }
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Feedback</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Tell us what's on your mind..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={8}
              maxLength={MAX_CHARACTERS}
              textAlignVertical="top"
            />
          </View>
          <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
            {charactersRemaining} characters remaining
          </Text>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your feedback is valuable to us. Please provide as much detail as possible to help us understand your perspective.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: canSubmit ? colors.primary : colors.textSecondary,
              opacity: canSubmit ? 1 : 0.6,
            }
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <Text style={[styles.submitButtonText, { color: colors.background }]}>Submitting...</Text>
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color={colors.background} />
              <Text style={[styles.submitButtonText, { color: colors.background }]}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    width: '48%',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
  },
  textInput: {
    fontSize: 16,
    minHeight: 180,
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 40,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

