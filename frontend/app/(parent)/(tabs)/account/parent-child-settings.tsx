import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ParentChildSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [dailyLimit, setDailyLimit] = useState(120); // Minutes

  const handleDecreaseTime = () => {
    if (dailyLimit > 30) {
      setDailyLimit(dailyLimit - 30);
    }
  };

  const handleIncreaseTime = () => {
    if (dailyLimit < 480) {
      setDailyLimit(dailyLimit + 30);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes === 999) {
      return 'No limit';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) {
      return `${mins} min`;
    }
    return `${hours} hr${mins > 0 ? ` ${mins} min` : ''}`;
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
        {/* App Usage Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={28} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>App Usage</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Set the maximum amount of time your child can use the app each day.
          </Text>

          <View style={[styles.timeSelectorContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.timeButton, { borderColor: colors.border }]}
              onPress={handleDecreaseTime}
            >
              <Ionicons name="remove-circle-outline" size={32} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.timeDisplay}>
              <Text style={[styles.timeValue, { color: colors.text }]}>{formatTime(dailyLimit)}</Text>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Daily Limit</Text>
            </View>

            <TouchableOpacity 
              style={[styles.timeButton, { borderColor: colors.border }]}
              onPress={handleIncreaseTime}
            >
              <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.timeOptions}>
            {[30, 60, 90, 120, 180, 999].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.timeOption,
                  { 
                    backgroundColor: dailyLimit === minutes ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setDailyLimit(minutes)}
              >
                <Text 
                  style={[
                    styles.timeOptionText,
                    { color: dailyLimit === minutes ? '#FFFFFF' : colors.text }
                  ]}
                >
                  {formatTime(minutes)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            The app will automatically lock when the daily limit is reached. Usage time resets at midnight.
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
    marginTop: 32,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  timeSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  timeButton: {
    padding: 8,
    borderRadius: 8,
  },
  timeDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeOption: {
    width: '30%',
    height: 80,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  infoBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
});

