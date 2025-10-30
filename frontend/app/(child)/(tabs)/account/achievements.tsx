import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  achieved: boolean;
}

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Complete a Task',
      icon: 'checkmark-circle',
      achieved: true,
    },
    {
      id: '2',
      title: 'Complete 10 Tasks',
      icon: 'checkmark-done',
      achieved: true,
    },
    {
      id: '3',
      title: 'Complete 100 Tasks',
      icon: 'trophy',
      achieved: false,
    },
    {
      id: '4',
      title: '7 Day Streak',
      icon: 'flame',
      achieved: true,
    },
    {
      id: '5',
      title: '100 Day Streak',
      icon: 'flame',
      achieved: false,
    },
    {
      id: '6',
      title: 'Buy a Pet',
      icon: 'pawprint',
      achieved: true,
    },
    {
      id: '7',
      title: 'Buy an Accessory',
      icon: 'gift',
      achieved: false,
    },
    {
      id: '8',
      title: 'Collect 5 Pets',
      icon: 'library',
      achieved: false,
    },
    {
      id: '9',
      title: 'Earn 1000 Coins',
      icon: 'logo-bitcoin',
      achieved: true,
    },
    {
      id: '10',
      title: 'Master Pet Care',
      icon: 'heart',
      achieved: false,
    },
  ]);

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Achievements</Text>
        
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
    marginBottom: 40,
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

