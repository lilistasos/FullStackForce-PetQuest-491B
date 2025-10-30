import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

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
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
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
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const contentAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = React.useState(false);
  
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
    // TODO: Navigate to achievements page when it's created
    console.log('Navigate to achievements page');
  };

  const handleHelp = () => {
    onClose();
    // TODO: Navigate to help page when it's created
    console.log('Navigate to help page');
  };

  const handleDarkModeToggle = (value: boolean) => {
    if (value !== isDarkMode) {
      toggleDarkMode();
    }
  };

  const handleFeedback = () => {
    onClose();
    // TODO: Navigate to feedback page when it's created
    console.log('Navigate to feedback page');
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
            onPress={handleFeedback}
          >
            <IconSymbol name="bubble.left.and.bubble.right.fill" size={24} color={hamburgerTextColor} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: hamburgerTextColor }]}>Feedback</Text>
          </TouchableOpacity>

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
});

