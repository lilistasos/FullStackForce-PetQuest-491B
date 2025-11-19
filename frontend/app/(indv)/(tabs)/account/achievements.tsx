import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAchievements } from '@/contexts/AchievementContext';

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const { achievements } = useAchievements();
  
  // Achievements are now provided by AchievementContext

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
                { color: achievement.achieved ? colors.primary : colors.textSecondary }
              ]}>
                {achievement.achieved ? 'Achieved!' : achievement.progress !== undefined && achievement.target !== undefined 
                  ? `${achievement.progress}/${achievement.target}` 
                  : 'Not Achieved'}
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


