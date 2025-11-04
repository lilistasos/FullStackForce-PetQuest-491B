import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

// Function to calculate luminance and determine text color
const getContrastColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.4 ? '#000000' : '#FFFFFF';
};

const BASIC_FEATURES = [
  'Basic pet customization',
  'Task management',
  'Calendar integration',
  'Standard support',
];

const PRO_FEATURES = [
  'All basic features',
  'Premium pet accessories',
  'Advanced task analytics',
  'Priority support',
  'Exclusive themes',
  'Early access to new features',
];

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const buttonTextColor = getContrastColor(colors.primary);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');

  const handleSubscribe = () => {
    // TODO: Implement subscription functionality
    console.log('Subscribe to Pro');
  };

  const handlePlanSelect = (plan: 'basic' | 'pro') => {
    setSelectedPlan(plan);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Plan */}
        <TouchableOpacity
          onPress={() => handlePlanSelect('basic')}
          style={[
            styles.planCard,
            {
              backgroundColor: colors.surface,
              borderColor: selectedPlan === 'basic' ? colors.primary : colors.border,
              borderWidth: selectedPlan === 'basic' ? 3 : 1,
            }
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.planContent}>
            <View style={styles.planLeft}>
              <Text style={[styles.planTitle, { color: colors.text }]}>Basic</Text>
              <View style={styles.featuresContainer}>
                {BASIC_FEATURES.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.planRight}>
              <Text style={[styles.priceText, { color: colors.text }]}>Free</Text>
            </View>
          </View>
          {selectedPlan === 'basic' && (
            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: colors.textSecondary }]}
              disabled
            >
              <Text style={[styles.subscribeButtonText, { color: colors.background }]}>Current Plan</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Pro Plan */}
        <TouchableOpacity
          onPress={() => handlePlanSelect('pro')}
          style={[
            styles.planCard,
            styles.proCard,
            {
              backgroundColor: colors.surface,
              borderColor: selectedPlan === 'pro' ? colors.primary : colors.border,
              borderWidth: selectedPlan === 'pro' ? 3 : 1,
            }
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.planContent}>
            <View style={styles.planLeft}>
              <Text style={[styles.planTitle, { color: colors.text }]}>Pro</Text>
              <View style={styles.featuresContainer}>
                {PRO_FEATURES.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.planRight}>
              <Text style={[styles.priceText, { color: colors.text }]}>$10</Text>
              <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/Month</Text>
            </View>
          </View>
          {selectedPlan === 'pro' && (
            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
              onPress={handleSubscribe}
            >
              <Text style={[styles.subscribeButtonText, { color: buttonTextColor }]}>Subscribe</Text>
            </TouchableOpacity>
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
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  planCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    position: 'relative',
  },
  proCard: {
    borderWidth: 1,
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planLeft: {
    flex: 1,
    paddingRight: 16,
  },
  planRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pricePeriod: {
    fontSize: 14,
    marginTop: 4,
  },
  subscribeButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

