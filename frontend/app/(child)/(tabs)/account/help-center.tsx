import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    faq: true,
  });

  const sections: FAQSection[] = [
    {
      title: 'FAQ',
      items: [
        {
          question: 'How Does Pet Health Work?',
          answer: 'Pet health is correlated to the usage of the app. Using the app or completing created tasks improves the health of your pet.'
        },
        {
          question: 'Why Use This App?',
          answer: 'This app aims to provide a fun and interactive experience to adults and kids of all ages. Whether you\'re just beginning to learn about time management or a seasoned pro, this app aims to help you in daily life.'
        }
      ]
    },
    {
      title: 'Task',
      items: [
        {
          question: 'How do I create a task?',
          answer: 'Navigate to the To-Do tab and tap the "+" button to create a new task. Fill in the task details and save.'
        },
        {
          question: 'Can I edit or delete tasks?',
          answer: 'Yes, you can edit or delete tasks by tapping on them and selecting the appropriate option.'
        }
      ]
    },
    {
      title: 'Pet',
      items: [
        {
          question: 'How do I customize my pet?',
          answer: 'Tap on your pet from the main Pet page, then select "Customize" to access hats, accessories, and other customization options.'
        },
        {
          question: 'Where can I buy new pets?',
          answer: 'Visit the Shop from the Pet page to browse and purchase new pets with coins you earn by completing tasks.'
        }
      ]
    },
    {
      title: 'To Do List',
      items: [
        {
          question: 'How do tasks affect my pet?',
          answer: 'Completing tasks improves your pet\'s health and helps you earn coins to unlock new content in the shop.'
        },
        {
          question: 'Can I set recurring tasks?',
          answer: 'Currently, tasks are created individually. We\'re working on adding recurring task features in future updates.'
        }
      ]
    },
    {
      title: 'Privacy',
      items: [
        {
          question: 'Is my data secure?',
          answer: 'Yes, we take privacy seriously. Your personal information is encrypted and stored securely.'
        },
        {
          question: 'Who can see my data?',
          answer: 'Only you and authorized family members with the family code can access your account data.'
        }
      ]
    },
    {
      title: 'In App Purchases',
      items: [
        {
          question: 'Are there in-app purchases?',
          answer: 'Currently, the app is free. All items can be purchased using coins earned by completing tasks.'
        },
        {
          question: 'Will premium features be added?',
          answer: 'We\'re exploring premium features for future updates while keeping the core experience free.'
        }
      ]
    },
    {
      title: 'Legal',
      items: [
        {
          question: 'What are the terms of service?',
          answer: 'Please review our Terms of Service for complete information about using the app.'
        },
        {
          question: 'How do I report an issue?',
          answer: 'You can report issues by navigating to Settings > Contact and reaching out to our support team.'
        }
      ]
    }
  ];

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} style={[styles.section, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                { 
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border
                }
              ]}
              onPress={() => toggleSection(section.title)}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              <Ionicons
                name={openSections[section.title] ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>

            {openSections[section.title] && (
              <View style={styles.sectionContent}>
                {section.items.map((item, index) => (
                  <View key={index} style={styles.faqItem}>
                    <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
                    <Text style={[styles.answer, { color: colors.textSecondary }]}>{item.answer}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            For any further questions, please refer to the{' '}
            <Text 
              style={[styles.contactLink, { color: colors.primary }]}
              onPress={() => router.push('/(child)/(tabs)/account/contact')}
            >
              Contact
            </Text>
            {' '}page.
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  sectionContent: {
    padding: 16,
  },
  faqItem: {
    marginBottom: 20,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  answer: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  contactLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

