import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  achieved: boolean;
}

export default function AchievementsScreen() {
  const { colors } = useTheme();
  
  const [achievements, setAchievements] = useState<Achievement[]>([
    // Streak Achievements (6)
    {
      id: '1',
      title: '1 Day Streak',
      icon: 'flame',
      achieved: true,
    },
    {
      id: '2',
      title: '1 Week Streak',
      icon: 'flame',
      achieved: true,
    },
    {
      id: '3',
      title: '1 Month Streak',
      icon: 'flame',
      achieved: false,
    },
    {
      id: '4',
      title: '3 Month Streak',
      icon: 'flame',
      achieved: false,
    },
    {
      id: '5',
      title: '6 Month Streak',
      icon: 'flame',
      achieved: false,
    },
    {
      id: '6',
      title: '1 Year Streak',
      icon: 'flame',
      achieved: false,
    },
    // Task Achievements (4)
    {
      id: '7',
      title: 'Complete 1 Task',
      icon: 'checkmark-circle',
      achieved: true,
    },
    {
      id: '8',
      title: 'Complete 10 Tasks',
      icon: 'checkmark-done',
      achieved: true,
    },
    {
      id: '9',
      title: 'Complete 50 Tasks',
      icon: 'trophy',
      achieved: false,
    },
    {
      id: '10',
      title: 'Complete 100 Tasks',
      icon: 'medal',
      achieved: false,
    },
    // Pet Achievements (4)
    {
      id: '11',
      title: 'Buy Your First Pet',
      icon: 'paw',
      achieved: true,
    },
    {
      id: '12',
      title: 'Collect 5 Pets',
      icon: 'library',
      achieved: false,
    },
    {
      id: '13',
      title: 'Buy 5 Accessories',
      icon: 'gift',
      achieved: false,
    },
    {
      id: '14',
      title: 'Customize Pet 10 Times',
      icon: 'color-palette',
      achieved: false,
    },
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {achievements.map((achievement) => (
            <View 
              key={achievement.id} 
              style={[
                styles.achievementCard, 
                { 
                  backgroundColor: achievement.achieved ? colors.background : colors.surface,
                  borderColor: colors.border 
                }
              ]}
            >
              <Ionicons 
                name={achievement.icon as any} 
                size={48} 
                color={achievement.achieved ? colors.primary : colors.textSecondary} 
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>
                {achievement.title}
              </Text>
              <Text style={[
                styles.achievementStatus, 
                { color: achievement.achieved ? colors.success : colors.textSecondary }
              ]}>
                {achievement.achieved ? 'Achieved!' : 'Not Achieved'}
              </Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  achievementCard: {
    width: '48%',
    aspectRatio: 0.9,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementStatus: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});


