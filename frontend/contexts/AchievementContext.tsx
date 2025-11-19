import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_KEY = '@petquest:achievements';
const STREAK_KEY = '@petquest:streak';
const LAST_COMPLETION_DATE_KEY = '@petquest:lastCompletionDate';
const PURCHASES_KEY = '@petquest:purchases';
const CUSTOMIZATIONS_KEY = '@petquest:customizations';

export interface AchievementData {
  // Streak achievements
  streakDays: number;
  lastCompletionDate: string | null;
  
  // Task achievements
  totalTasksCompleted: number;
  
  // Pet achievements
  petsOwned: number;
  accessoriesBought: number;
  customizationsCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  achieved: boolean;
  progress?: number;
  target?: number;
}

interface AchievementContextType {
  achievements: Achievement[];
  achievementData: AchievementData;
  checkAchievements: () => void;
  recordTaskCompletion: () => void;
  recordPurchase: (type: 'pet' | 'accessory') => void;
  recordCustomization: () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

const defaultAchievementData: AchievementData = {
  streakDays: 0,
  lastCompletionDate: null,
  totalTasksCompleted: 0,
  petsOwned: 1, // Default pet
  accessoriesBought: 0,
  customizationsCount: 0,
};

export const AchievementProvider = ({ children }: { children: ReactNode }) => {
  const [achievementData, setAchievementData] = useState<AchievementData>(defaultAchievementData);

  // Load achievement data from AsyncStorage
  useEffect(() => {
    const loadAchievementData = async () => {
      try {
        const [savedData, savedStreak, savedLastDate, savedPurchases, savedCustomizations] = await Promise.all([
          AsyncStorage.getItem(ACHIEVEMENTS_KEY),
          AsyncStorage.getItem(STREAK_KEY),
          AsyncStorage.getItem(LAST_COMPLETION_DATE_KEY),
          AsyncStorage.getItem(PURCHASES_KEY),
          AsyncStorage.getItem(CUSTOMIZATIONS_KEY),
        ]);

        const data: AchievementData = { ...defaultAchievementData };
        
        if (savedStreak) {
          data.streakDays = parseInt(savedStreak) || 0;
        }
        
        if (savedLastDate) {
          data.lastCompletionDate = savedLastDate;
        }

        if (savedPurchases) {
          const purchases = JSON.parse(savedPurchases);
          data.petsOwned = purchases.pets || 1;
          data.accessoriesBought = purchases.accessories || 0;
        }

        if (savedCustomizations) {
          data.customizationsCount = parseInt(savedCustomizations) || 0;
        }

        if (savedData) {
          const parsed = JSON.parse(savedData);
          data.totalTasksCompleted = parsed.totalTasksCompleted || 0;
        }

        setAchievementData(data);
      } catch (error) {
        console.error('Error loading achievement data:', error);
      }
    };
    loadAchievementData();
  }, []);

  // Note: Task completion tracking is now done via recordTaskCompletion() calls
  // from the todo screens when tasks are marked complete

  // Check and update streak
  const updateStreak = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = achievementData.lastCompletionDate;
    
    if (!lastDate) {
      // First completion
      await AsyncStorage.setItem(STREAK_KEY, '1');
      await AsyncStorage.setItem(LAST_COMPLETION_DATE_KEY, today);
      setAchievementData(prev => ({ 
        ...prev, 
        streakDays: 1, 
        lastCompletionDate: today 
      }));
      return;
    }

    const lastDateObj = new Date(lastDate);
    const todayObj = new Date(today);
    const daysDiff = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Already completed today, no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      const newStreak = achievementData.streakDays + 1;
      await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());
      await AsyncStorage.setItem(LAST_COMPLETION_DATE_KEY, today);
      setAchievementData(prev => ({ 
        ...prev, 
        streakDays: newStreak, 
        lastCompletionDate: today 
      }));
    } else {
      // Streak broken, reset to 1
      await AsyncStorage.setItem(STREAK_KEY, '1');
      await AsyncStorage.setItem(LAST_COMPLETION_DATE_KEY, today);
      setAchievementData(prev => ({ 
        ...prev, 
        streakDays: 1, 
        lastCompletionDate: today 
      }));
    }
  }, [achievementData.lastCompletionDate, achievementData.streakDays]);

  // Record task completion
  const recordTaskCompletion = useCallback(async () => {
    await updateStreak();
    // Increment total tasks completed
    const newCount = achievementData.totalTasksCompleted + 1;
    setAchievementData(prev => ({ ...prev, totalTasksCompleted: newCount }));
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify({ totalTasksCompleted: newCount }));
    checkAchievements();
  }, [updateStreak, achievementData.totalTasksCompleted]);

  // Record purchase
  const recordPurchase = useCallback(async (type: 'pet' | 'accessory') => {
    try {
      const savedPurchases = await AsyncStorage.getItem(PURCHASES_KEY);
      const purchases = savedPurchases ? JSON.parse(savedPurchases) : { pets: 1, accessories: 0 };
      
      if (type === 'pet') {
        purchases.pets = (purchases.pets || 1) + 1;
      } else {
        purchases.accessories = (purchases.accessories || 0) + 1;
      }
      
      await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
      setAchievementData(prev => ({
        ...prev,
        petsOwned: purchases.pets,
        accessoriesBought: purchases.accessories,
      }));
      checkAchievements();
    } catch (error) {
      console.error('Error recording purchase:', error);
    }
  }, []);

  // Record customization
  const recordCustomization = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(CUSTOMIZATIONS_KEY);
      const count = saved ? parseInt(saved) + 1 : 1;
      await AsyncStorage.setItem(CUSTOMIZATIONS_KEY, count.toString());
      setAchievementData(prev => ({ ...prev, customizationsCount: count }));
      checkAchievements();
    } catch (error) {
      console.error('Error recording customization:', error);
    }
  }, []);

  // Check achievements and update their status
  const checkAchievements = useCallback(() => {
    // This will be called to recalculate achievements
    // The achievements array will be computed based on achievementData
  }, []);

  // Calculate achievements based on current data
  const calculateAchievements = (): Achievement[] => {
    const { streakDays, totalTasksCompleted, petsOwned, accessoriesBought, customizationsCount } = achievementData;

    // Helper function to calculate progress - locks at target when achieved
    const getProgress = (value: number, target: number, achieved: boolean): number => {
      if (achieved) {
        return target; // Lock at target when achieved
      }
      return Math.min(value, target);
    };

    return [
      // Streak Achievements
      {
        id: '1',
        title: '1 Day Streak',
        icon: 'flame',
        achieved: streakDays >= 1,
        progress: getProgress(streakDays, 1, streakDays >= 1),
        target: 1,
      },
      {
        id: '2',
        title: '1 Week Streak',
        icon: 'flame',
        achieved: streakDays >= 7,
        progress: getProgress(streakDays, 7, streakDays >= 7),
        target: 7,
      },
      {
        id: '3',
        title: '1 Month Streak',
        icon: 'flame',
        achieved: streakDays >= 30,
        progress: getProgress(streakDays, 30, streakDays >= 30),
        target: 30,
      },
      {
        id: '4',
        title: '3 Month Streak',
        icon: 'flame',
        achieved: streakDays >= 90,
        progress: getProgress(streakDays, 90, streakDays >= 90),
        target: 90,
      },
      {
        id: '5',
        title: '6 Month Streak',
        icon: 'flame',
        achieved: streakDays >= 180,
        progress: getProgress(streakDays, 180, streakDays >= 180),
        target: 180,
      },
      {
        id: '6',
        title: '1 Year Streak',
        icon: 'flame',
        achieved: streakDays >= 365,
        progress: getProgress(streakDays, 365, streakDays >= 365),
        target: 365,
      },
      // Task Achievements
      {
        id: '7',
        title: 'Complete 1 Task',
        icon: 'checkmark-circle',
        achieved: totalTasksCompleted >= 1,
        progress: getProgress(totalTasksCompleted, 1, totalTasksCompleted >= 1),
        target: 1,
      },
      {
        id: '8',
        title: 'Complete 10 Tasks',
        icon: 'checkmark-done',
        achieved: totalTasksCompleted >= 10,
        progress: getProgress(totalTasksCompleted, 10, totalTasksCompleted >= 10),
        target: 10,
      },
      {
        id: '9',
        title: 'Complete 50 Tasks',
        icon: 'trophy',
        achieved: totalTasksCompleted >= 50,
        progress: getProgress(totalTasksCompleted, 50, totalTasksCompleted >= 50),
        target: 50,
      },
      {
        id: '10',
        title: 'Complete 100 Tasks',
        icon: 'medal',
        achieved: totalTasksCompleted >= 100,
        progress: getProgress(totalTasksCompleted, 100, totalTasksCompleted >= 100),
        target: 100,
      },
      // Pet Achievements
      {
        id: '11',
        title: 'Buy Your First Pet',
        icon: 'paw',
        achieved: petsOwned >= 1,
        progress: getProgress(petsOwned, 1, petsOwned >= 1),
        target: 1,
      },
      {
        id: '12',
        title: 'Collect 5 Pets',
        icon: 'library',
        achieved: petsOwned >= 5,
        progress: getProgress(petsOwned, 5, petsOwned >= 5),
        target: 5,
      },
      {
        id: '13',
        title: 'Buy 5 Accessories',
        icon: 'gift',
        achieved: accessoriesBought >= 5,
        progress: getProgress(accessoriesBought, 5, accessoriesBought >= 5),
        target: 5,
      },
      {
        id: '14',
        title: 'Customize Pet 10 Times',
        icon: 'color-palette',
        achieved: customizationsCount >= 10,
        progress: getProgress(customizationsCount, 10, customizationsCount >= 10),
        target: 10,
      },
    ];
  };

  const achievements = calculateAchievements();

  return (
    <AchievementContext.Provider value={{ 
      achievements, 
      achievementData, 
      checkAchievements, 
      recordTaskCompletion, 
      recordPurchase, 
      recordCustomization 
    }}>
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

