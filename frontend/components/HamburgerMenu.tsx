import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
  backgroundColor?: string;
}

export default function HamburgerMenu({ visible, onClose, backgroundColor = '#52AFDD' }: HamburgerMenuProps) {
  const router = useRouter();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.setValue(-DRAWER_WIDTH);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, slideAnim]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const handleSignOut = () => {
    onClose();
    setTimeout(() => {
      router.replace('/(auth)/signup' as any);
    }, 300);
  };

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
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
            <Text style={styles.headerText}>Menu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleNavigate('/(child)/(tabs)/pet')}
            >
              <IconSymbol name="pawprint.fill" size={24} color="#000" style={styles.menuIcon} />
              <Text style={styles.menuText}>Pet</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleNavigate('/(child)/(tabs)/calendar')}
            >
              <IconSymbol name="calendar" size={24} color="#000" style={styles.menuIcon} />
              <Text style={styles.menuText}>Calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleNavigate('/(child)/(tabs)/todo')}
            >
              <IconSymbol name="list.bullet" size={24} color="#000" style={styles.menuIcon} />
              <Text style={styles.menuText}>To-Do</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleNavigate('/(child)/(tabs)/account')}
            >
              <IconSymbol name="person.fill" size={24} color="#000" style={styles.menuIcon} />
              <Text style={styles.menuText}>Account</Text>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
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
    justifyContent: 'space-between',
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
    color: '#000',
  },
  closeButton: {
    padding: 5,
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
    color: '#000',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9534f',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

