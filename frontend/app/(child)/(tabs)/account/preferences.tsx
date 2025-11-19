import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEEK_START_KEY = '@petquest:weekStart';
const TODO_CATEGORIES_KEY = '@petquest:todoCategories';

export type TodoCategory = 'Homework' | 'Chores' | 'Work' | 'Extra';

export interface TodoCategoryPreferences {
  Homework: boolean;
  Chores: boolean;
  Work: boolean;
  Extra: boolean;
}

const defaultCategoryPreferences: TodoCategoryPreferences = {
  Homework: true,
  Chores: true,
  Work: true,
  Extra: true,
};

export default function PreferencesScreen() {
  const { colors } = useTheme();
  
  const [weekStart, setWeekStart] = useState<0 | 1>(1); // 0 = Sunday, 1 = Monday
  const [categoryPreferences, setCategoryPreferences] = useState<TodoCategoryPreferences>(defaultCategoryPreferences);

  useEffect(() => {
    // Load saved preferences
    const loadPreferences = async () => {
      try {
        const savedWeekStart = await AsyncStorage.getItem(WEEK_START_KEY);
        if (savedWeekStart !== null) {
          setWeekStart(parseInt(savedWeekStart) as 0 | 1);
        }
        
        const savedCategories = await AsyncStorage.getItem(TODO_CATEGORIES_KEY);
        if (savedCategories !== null) {
          const parsed = JSON.parse(savedCategories);
          setCategoryPreferences({ ...defaultCategoryPreferences, ...parsed });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadPreferences();
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

  const handleToggleCategory = async (category: TodoCategory, value: boolean) => {
    const updated = { ...categoryPreferences, [category]: value };
    setCategoryPreferences(updated);
    try {
      await AsyncStorage.setItem(TODO_CATEGORIES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving category preferences:', error);
    }
  };

  const todoCategories: { key: TodoCategory; label: string; description: string }[] = [
    { key: 'Homework', label: 'Homework', description: 'Show homework tasks in your todo list' },
    { key: 'Chores', label: 'Chores', description: 'Show chore tasks in your todo list' },
    { key: 'Work', label: 'Work', description: 'Show work tasks in your todo list' },
    { key: 'Extra', label: 'Extra', description: 'Show extra tasks in your todo list' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Preferences */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Calendar</Text>
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

        {/* Todo List Categories */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Todo List Categories</Text>
          {todoCategories.map((category) => (
            <View key={category.key} style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                  {category.label}
                </Text>
                <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                  {category.description}
                </Text>
              </View>
              <Switch
                value={categoryPreferences[category.key]}
                onValueChange={(value) => handleToggleCategory(category.key, value)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={categoryPreferences[category.key] ? '#ffffff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          ))}
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
  sectionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
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
