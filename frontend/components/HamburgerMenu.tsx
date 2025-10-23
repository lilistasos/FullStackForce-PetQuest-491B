import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
  backgroundColor?: string;
  children?: React.ReactNode;
  children?: React.ReactNode;
}

export default function HamburgerMenu({ visible, onClose, backgroundColor = '#52AFDD', children }: HamburgerMenuProps) {
export default function HamburgerMenu({ visible, onClose, backgroundColor = '#52AFDD', children }: HamburgerMenuProps) {
  const router = useRouter();
  const { user } = useAuth();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const contentAnim = React.useRef(new Animated.Value(0)).current;
  const contentAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = React.useState(false);

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
  }, [visible, slideAnim, contentAnim]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You'll need to log in again to access your account.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            onClose();
            setTimeout(() => {
              router.replace('/(auth)/signup' as any);
            }, 300);
          }
        }
      ]
    );
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

  const handleSettings = () => {
    onClose();
    // TODO: Navigate to settings page when it's created
    console.log('Navigate to settings page');
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
        <View style={styles.header}>
          <Text style={styles.headerText}>PetQuest</Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.profileImage}
              defaultSource={require('@/assets/images/icon.png')}
            />
          </View>
          <Text style={styles.profileName}>
            {user?.name || 'User'}
          </Text>
        </View>

        <View style={styles.menuItems}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleAchievements}
          >
            <IconSymbol name="trophy.fill" size={24} color="#000" style={styles.menuIcon} />
            <Text style={styles.menuText}>Achievements</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleSettings}
          >
            <IconSymbol name="gearshape.fill" size={24} color="#000" style={styles.menuIcon} />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleHelp}
          >
            <IconSymbol name="questionmark.circle.fill" size={24} color="#000" style={styles.menuIcon} />
            <Text style={styles.menuText}>Help Center</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleFeedback}
          >
            <IconSymbol name="bubble.left.and.bubble.right.fill" size={24} color="#000" style={styles.menuIcon} />
            <Text style={styles.menuText}>Feedback</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main content that slides */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
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
    backgroundColor: '#fff',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
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

