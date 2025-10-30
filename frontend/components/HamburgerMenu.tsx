import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, primaryColors, type PrimaryColorKey } from '@/contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

// Function to calculate luminance and determine text color
const getContrastColor = (backgroundColor: string): string => {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  // Lower threshold to 0.4 to accommodate bright colors like red, pink, orange, magenta
  return luminance > 0.4 ? '#000000' : '#FFFFFF';
};

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export default function HamburgerMenu({ visible, onClose, backgroundColor = '#52AFDD', children }: HamburgerMenuProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode, colors, primaryColor, setPrimaryColor } = useTheme();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const contentAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = React.useState(false);
  const [colorMenuOpen, setColorMenuOpen] = React.useState(false);
  
  // Get appropriate text color for hamburger menu
  const hamburgerTextColor = getContrastColor(backgroundColor);

  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.setValue(-DRAWER_WIDTH);
      contentAnim.setValue(0);
      
      // Animate both the menu sliding in and content sliding right
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Animate both the menu sliding out and content sliding back
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, slideAnim, contentAnim]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };


  const handleAchievements = () => {
    onClose();
    setTimeout(() => {
      router.push('/(child)/(tabs)/account/achievements' as any);
    }, 300);
  };

  const handleHelp = () => {
    onClose();
    setTimeout(() => {
      router.push('/(child)/(tabs)/account/help-center' as any);
    }, 300);
  };

  const handleDarkModeToggle = (value: boolean) => {
    if (value !== isDarkMode) {
      toggleDarkMode();
    }
  };

  const handleTheme = () => {
    onClose();
    setTimeout(() => {
      router.push('/(child)/(tabs)/account/theme' as any);
    }, 300);
  };

  return (
    <View style={styles.container}>
      {/* Menu drawer - positioned behind content */}
      <Animated.View 
        style={[
          styles.drawer,
          { 
            backgroundColor,
            transform: [{ translateX: slideAnim }],
            width: DRAWER_WIDTH 
          }
        ]}
      >
        <View style={[styles.header, { borderBottomColor: 'rgba(0, 0, 0, 0.15)' }]}>
          <Text style={[styles.headerText, { color: hamburgerTextColor }]}>PetQuest</Text>
        </View>

        {/* User Profile Section */}
        <View style={[styles.profileSection, { borderBottomColor: 'rgba(0, 0, 0, 0.15)' }]}>
          <View style={styles.profileImageContainer}>
            <Image 
              key={user?.profileImageUri || 'default'}
              source={
                user?.profileImageUri 
                  ? { uri: user.profileImageUri } 
                  : require('@/assets/images/defaultpp.jpg')
              }
              style={styles.profileImage}
              defaultSource={require('@/assets/images/defaultpp.jpg')}
            />
          </View>
          <Text style={[styles.profileName, { color: hamburgerTextColor }]}>
            {user?.firstName || user?.name || 'User'}
          </Text>
        </View>

        <View style={styles.menuItems}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleAchievements}
          >
            <IconSymbol name="trophy.fill" size={24} color={hamburgerTextColor} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: hamburgerTextColor }]}>Achievements</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleHelp}
          >
            <IconSymbol name="questionmark.circle.fill" size={24} color={hamburgerTextColor} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: hamburgerTextColor }]}>Help Center</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setColorMenuOpen(!colorMenuOpen)}
          >
            <View style={styles.themeColorButton}>
              <Ionicons name="color-palette-outline" size={24} color={hamburgerTextColor} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: hamburgerTextColor }]}>Theme Color</Text>
              <View style={{ flex: 1 }} />
              <Ionicons 
                name={colorMenuOpen ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={hamburgerTextColor}
              />
            </View>
          </TouchableOpacity>

          {/* Color dropdown within menu */}
          {colorMenuOpen && (
            <View style={styles.colorDropdown}>
              <View style={[styles.colorOptionsContainer, { backgroundColor: colors.surface, borderColor: '#000000' }]}>
                {Object.entries(primaryColors).map(([key, color]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.colorOption}
                    onPress={() => {
                      setPrimaryColor(key as PrimaryColorKey);
                    }}
                  >
                    <View 
                      style={[
                        styles.colorCircle, 
                        { backgroundColor: color },
                        primaryColor === key && styles.colorCircleSelected
                      ]}
                    />
                    {primaryColor === key && (
                      <Ionicons name="checkmark" size={18} color="#000000" style={styles.checkmark} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.darkModeItem}>
            <View style={styles.darkModeLabel}>
              <IconSymbol name="moon.fill" size={24} color={hamburgerTextColor} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: hamburgerTextColor }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#767577', true: hamburgerTextColor === '#FFFFFF' ? '#FFFFFF' : colors.primary }}
              thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

      </Animated.View>

      {/* Main content that slides */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            backgroundColor: colors.background,
            transform: [{ translateX: contentAnim }]
          }
        ]}
      >
        {children}
        {/* Backdrop overlay when menu is open */}
        {visible && (
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={onClose}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 18,
    fontWeight: '500',
  },
  darkModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  darkModeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeColorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  colorDropdown: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  colorOption: {
    width: '21%',
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

