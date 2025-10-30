import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PrimaryColorKey = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'brown' | 'turquoise' | 'navy' | 'teal' | 'magenta';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  primaryColor: PrimaryColorKey;
  setPrimaryColor: (color: PrimaryColorKey) => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    secondary: string;
    error: string;
    success: string;
  };
}

const primaryColors: Record<PrimaryColorKey, string> = {
  red: '#FF4444',
  orange: '#FF8800',
  yellow: '#FFBB33',
  green: '#00C851',
  blue: '#52AFDD',
  purple: '#AA66CC',
  pink: '#FF69B4',
  brown: '#A0522D',
  turquoise: '#40E0D0',
  navy: '#1E3A8A',
  teal: '#008080',
  magenta: '#FF00FF',
};

const lightColors = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#000000',
  textSecondary: '#6C757D',
  border: 'rgba(0, 0, 0, 0.1)',
  secondary: '#6C757D',
  error: '#d9534f',
  success: '#5CB85C',
};

const darkColors = {
  background: '#1A1A1A',
  surface: '#2D2D2D',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: 'rgba(255, 255, 255, 0.1)',
  secondary: '#B0B0B0',
  error: '#FF6B6B',
  success: '#4ECDC4',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColorKey>('blue');

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        }
        
        const savedPrimaryColor = await AsyncStorage.getItem('primaryColor');
        if (savedPrimaryColor && ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'turquoise', 'navy', 'teal', 'magenta'].includes(savedPrimaryColor)) {
          setPrimaryColorState(savedPrimaryColor as PrimaryColorKey);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const setPrimaryColor = async (color: PrimaryColorKey) => {
    setPrimaryColorState(color);
    try {
      await AsyncStorage.setItem('primaryColor', color);
    } catch (error) {
      console.log('Error saving primary color:', error);
    }
  };

  const baseColors = isDarkMode ? darkColors : lightColors;
  const colors = {
    ...baseColors,
    primary: primaryColors[primaryColor],
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, primaryColor, setPrimaryColor, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
