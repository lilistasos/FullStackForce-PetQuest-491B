import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
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

const lightColors = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#000000',
  textSecondary: '#6C757D',
  border: 'rgba(0, 0, 0, 0.1)',
  primary: '#52AFDD',
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
  primary: '#52AFDD',
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

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
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

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
