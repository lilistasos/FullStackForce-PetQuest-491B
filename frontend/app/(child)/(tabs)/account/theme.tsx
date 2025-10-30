import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

const primaryColors: Record<string, string> = {
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

export default function ThemeScreen() {
  const router = useRouter();
  const { colors, isDarkMode, toggleDarkMode, primaryColor, setPrimaryColor } = useTheme();

  const handleSelectLight = () => {
    if (isDarkMode) {
      toggleDarkMode();
    }
  };

  const handleSelectDark = () => {
    if (!isDarkMode) {
      toggleDarkMode();
    }
  };

  const colorOptions: Array<{ key: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'brown' | 'turquoise' | 'navy' | 'teal' | 'magenta'; label: string }> = [
    { key: 'red', label: 'Red' },
    { key: 'orange', label: 'Orange' },
    { key: 'yellow', label: 'Yellow' },
    { key: 'green', label: 'Green' },
    { key: 'blue', label: 'Blue' },
    { key: 'purple', label: 'Purple' },
    { key: 'pink', label: 'Pink' },
    { key: 'brown', label: 'Brown' },
    { key: 'turquoise', label: 'Turquoise' },
    { key: 'navy', label: 'Navy' },
    { key: 'teal', label: 'Teal' },
    { key: 'magenta', label: 'Magenta' },
  ];

  const handleSelectColor = (color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'brown' | 'turquoise' | 'navy' | 'teal' | 'magenta') => {
    setPrimaryColor(color);
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
        <View style={styles.themeOptionsContainer}>
          {/* Light Mode Option */}
          <TouchableOpacity 
            style={[styles.themeOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleSelectLight}
          >
            <View style={[styles.themePreview, { backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }]}>
              <View style={[styles.previewBar, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={styles.themeOptionLabel}>Light Mode</Text>
            <View style={styles.radioContainer}>
              {!isDarkMode ? (
                <View style={styles.radioSelected}>
                  <View style={styles.radioInner} />
                </View>
              ) : (
                <View style={styles.radioUnselected} />
              )}
            </View>
          </TouchableOpacity>

          {/* Dark Mode Option */}
          <TouchableOpacity 
            style={[styles.themeOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleSelectDark}
          >
            <View style={[styles.themePreview, { backgroundColor: '#1A1A1A', borderColor: '#E5E5E5' }]}>
              <View style={[styles.previewBar, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={styles.themeOptionLabel}>Dark Mode</Text>
            <View style={styles.radioContainer}>
              {isDarkMode ? (
                <View style={styles.radioSelected}>
                  <View style={styles.radioInner} />
                </View>
              ) : (
                <View style={styles.radioUnselected} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Color Picker Section */}
        <View style={styles.colorSection}>
          <Text style={[styles.colorSectionTitle, { color: colors.text }]}>Accent Color</Text>
          <View style={styles.colorOptionsContainer}>
            {colorOptions.map((color) => (
              <TouchableOpacity
                key={color.key}
                style={styles.colorOption}
                onPress={() => handleSelectColor(color.key)}
              >
                <View 
                  style={[
                    styles.colorCircle, 
                    { backgroundColor: primaryColors[color.key] },
                    primaryColor === color.key && styles.colorCircleSelected
                  ]}
                />
                {primaryColor === color.key && (
                  <Ionicons name="checkmark" size={20} color={colors.text} style={styles.checkmark} />
                )}
              </TouchableOpacity>
            ))}
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
  themeOptionsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  themePreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewBar: {
    height: 8,
    width: '100%',
  },
  themeOptionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  radioContainer: {
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  radioUnselected: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
  },
  colorSection: {
    marginTop: 40,
  },
  colorSectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  colorOption: {
    width: '18%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircle: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#000000',
  },
  checkmark: {
    position: 'absolute',
  },
});

