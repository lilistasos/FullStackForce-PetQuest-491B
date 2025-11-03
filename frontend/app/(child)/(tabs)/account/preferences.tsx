import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEEK_START_KEY = '@petquest:weekStart';

export default function PreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [weekStart, setWeekStart] = useState<0 | 1>(1); // 0 = Sunday, 1 = Monday

  useEffect(() => {
    // Load saved preference
    const loadPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(WEEK_START_KEY);
        if (saved !== null) {
          setWeekStart(parseInt(saved) as 0 | 1);
        }
      } catch (error) {
        console.error('Error loading week start preference:', error);
      }
    };
    loadPreference();
  }, []);

  const handleToggleWeekStart = async (value: boolean) => {
    const newValue: 0 | 1 = value ? 0 : 1; // true = Sunday (0), false = Monday (1)
    setWeekStart(newValue);
    try {
      await AsyncStorage.setItem(WEEK_START_KEY, newValue.toString());
    } catch (error) {
      console.error('Error saving week start preference:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                Week Starts on Sunday
              </Text>
              <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                {weekStart === 0 
                  ? 'Calendar week starts on Sunday' 
                  : 'Calendar week starts on Monday'}
              </Text>
            </View>
            <Switch
              value={weekStart === 0}
              onValueChange={handleToggleWeekStart}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={weekStart === 0 ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
  sectionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
});

