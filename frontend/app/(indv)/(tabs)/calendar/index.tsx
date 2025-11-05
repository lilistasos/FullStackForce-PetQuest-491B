import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEEK_START_KEY = '@petquest:weekStart';

// Function to calculate luminance and determine text color
const getContrastColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.4 ? '#000000' : '#FFFFFF';
};

// Helper function to get ordinal suffix (st, nd, rd, th)
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

interface TaskItem {
  id: string;
  name: string;
  description?: string;
  time: string;
  points: number;
  complete: boolean;
  category?: string;
}

type SortOption = 'time' | 'type' | 'points';

export default function IndvCalendarScreen() {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const buttonTextColor = getContrastColor(colors.primary);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [firstDay, setFirstDay] = useState<0 | 1>(1); // 0 = Sunday, 1 = Monday
  const [modal, setModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null);
  
  // Animation values for month transitions
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Format month and year for display
  const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Navigate to previous/next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (isAnimating) return;
    
    const current = new Date(currentMonth);
    const newDate = new Date(current);
    if (direction === 'prev') {
      newDate.setMonth(current.getMonth() - 1);
    } else {
      newDate.setMonth(current.getMonth() + 1);
    }
    
    const newMonthString = newDate.toISOString().split('T')[0];
    const directionNum = direction === 'next' ? 1 : -1;
    
    // Check if it's actually a different month
    if (newMonthString === currentMonth) return;
    
    setIsAnimating(true);
    
    // Animate out
    Animated.timing(slideAnim, {
      toValue: directionNum * -400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // Update month immediately before animating in
      setCurrentMonth(newMonthString);
      
      // Reset position and animate in
      slideAnim.setValue(directionNum * 400);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    });
  };
  
  // Load week start preference from AsyncStorage
  const loadWeekStartPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(WEEK_START_KEY);
      if (saved !== null) {
        setFirstDay(parseInt(saved) as 0 | 1);
      }
    } catch (error) {
      console.error('Error loading week start preference:', error);
    }
  };

  // Load on mount and when screen comes into focus (after returning from preferences)
  useEffect(() => {
    loadWeekStartPreference();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadWeekStartPreference();
    }, [])
  );

  // Reset to current day and time sort when component mounts (user logs in)
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setSelectedDate(todayStr);
    setCurrentMonth(todayStr);
    setSortBy('time');
    slideAnim.setValue(0); // Reset animation
  }, [user]); // Reset when user changes (login/logout)
  
  // Mock tasks data - In real app, this would come from API
  const [tasks, setTasks] = useState<{ [date: string]: TaskItem[] }>({
    [selectedDate]: [
      {
        id: '1',
        name: 'Morning Exercise',
        description: '30 minutes of cardio',
        time: '07:00 AM',
        points: 20,
        complete: false,
        category: 'Health',
      },
      {
        id: '2',
        name: 'Team Meeting',
        description: 'Weekly sync with team',
        time: '10:00 AM',
        points: 15,
        complete: false,
        category: 'Work',
      },
      {
        id: '3',
        name: 'Lunch Break',
        description: 'Take a break and eat',
        time: '12:30 PM',
        points: 10,
        complete: true,
        category: 'Personal',
      },
      {
        id: '4',
        name: 'Project Review',
        description: 'Review project progress',
        time: '02:00 PM',
        points: 25,
        complete: false,
        category: 'Work',
      },
    ],
  });

  // Helper function to convert time string to minutes since midnight for proper sorting
  const timeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60; // Add 12 hours for PM
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60; // Subtract 12 hours for 12 AM
    }
    
    return totalMinutes;
  };

  // Get tasks for selected date
  const selectedDateTasks = tasks[selectedDate] || [];
  
  // Sort tasks based on selected option
  const sortedTasks = useMemo(() => {
    const taskList = [...selectedDateTasks];
    
    if (sortBy === 'type') {
      return taskList.sort((a, b) => {
        const categoryA = a.category || 'Event';
        const categoryB = b.category || 'Event';
        if (categoryA !== categoryB) {
          return categoryA.localeCompare(categoryB);
        }
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
    } else if (sortBy === 'points') {
      return taskList.sort((a, b) => b.points - a.points);
    } else {
      // Sort by time (default)
      return taskList.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    }
  }, [selectedDateTasks, sortBy]);

  // Get marked dates (dates with tasks)
  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};
    
    // Get today's date string
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    Object.keys(tasks).forEach(date => {
      if (tasks[date].length > 0) {
        marked[date] = {
          marked: true,
          dotColor: colors.primary,
        };
      }
    });
    
    // Style today's date with theme color (if not selected)
    if (todayString !== selectedDate) {
      marked[todayString] = {
        ...marked[todayString],
        customStyles: {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: colors.primary,
            fontWeight: 'bold',
          },
        },
      };
    }
    
    // Style selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      marked: false, // Hide the dot when selected
      customStyles: {
        container: {
          backgroundColor: colors.primary,
          borderRadius: 16,
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
        },
        text: {
          color: buttonTextColor,
          fontWeight: 'bold',
        },
      },
    };
    
    return marked;
  }, [tasks, selectedDate, colors.primary, buttonTextColor]);

  // Toggle task completion
  const toggleComplete = (date: string, taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [date]: prev[date].map(task =>
        task.id === taskId ? { ...task, complete: !task.complete } : task
      ),
    }));
  };

  // Render task item (similar to child calendar style)
  const renderTaskItem = (item: TaskItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          setSelectedItem(item);
          setModal(true);
        }}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskNameRow}>
            <Text style={[styles.taskName, { color: colors.text }]}>
              {item.name}
            </Text>
            {item.complete && (
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.completeIcon} />
            )}
          </View>
          <Text style={[styles.taskTime, { color: colors.textSecondary }]}>{item.time}</Text>
        </View>
        {item.description && (
          <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>{item.description}</Text>
        )}
        <View style={styles.taskFooter}>
          <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>
            {item.category || 'Event'}
          </Text>
          <Text style={[styles.taskPoints, { color: colors.primary }]}>{item.points} pts</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Calendar theme that adapts to dark/light mode
  const disabledDayColor = isDarkMode ? '#666666' : '#CCCCCC';
  const calendarBg = colors.background;
  const calendarTheme = {
    backgroundColor: calendarBg,
    calendarBackground: calendarBg,
    textSectionTitleColor: colors.text,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: buttonTextColor,
    todayTextColor: colors.primary,
    todayBackgroundColor: 'transparent',
    dayTextColor: colors.text,
    textDisabledColor: disabledDayColor,
    disabledDayTextColor: disabledDayColor,
    dotColor: colors.primary,
    selectedDotColor: buttonTextColor,
    arrowColor: colors.primary,
    monthTextColor: colors.text,
    indicatorColor: colors.primary,
    textDayFontFamily: 'monospace',
    textMonthFontFamily: 'monospace',
    textDayHeaderFontFamily: 'monospace',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 12,
    // Make selected day circular
    'stylesheet.day.basic': {
      base: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: calendarBg,
      },
      today: {
        backgroundColor: calendarBg,
      },
      selected: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    'stylesheet.day.single': {
      base: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: calendarBg,
      },
      today: {
        backgroundColor: calendarBg,
      },
      selected: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        width: 32,
        height: 32,
      },
    },
    'stylesheet.calendar.header': {
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 10,
        paddingBottom: 0,
        backgroundColor: calendarBg,
        marginBottom: 0,
      },
      monthText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        fontFamily: 'monospace',
        margin: 0,
        padding: 0,
      },
      dayHeader: {
        marginTop: 0,
        marginBottom: 8,
        width: 32,
        textAlign: 'center',
        fontSize: 13,
        color: colors.text,
        fontFamily: 'monospace',
        fontWeight: '600',
      },
      week: {
        marginTop: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: calendarBg,
      },
    },
    'stylesheet.calendar.main': {
      container: {
        backgroundColor: calendarBg,
        paddingTop: 0,
        marginTop: 0,
      },
      weekContainer: {
        backgroundColor: calendarBg,
      },
      monthView: {
        backgroundColor: calendarBg,
        paddingTop: 0,
        marginTop: 0,
      },
      dayContainer: {
        backgroundColor: calendarBg,
      },
      today: {
        backgroundColor: calendarBg,
      },
    },
    'stylesheet.calendar.list': {
      calendarList: {
        backgroundColor: calendarBg,
      },
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <View style={[styles.calendarContainer, { backgroundColor: colors.background }]}>
          {/* Static Header */}
          <View style={[styles.calendarHeader, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              onPress={() => navigateMonth('prev')}
              style={styles.calendarHeaderButton}
              disabled={isAnimating}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.calendarHeaderText, { color: colors.text }]}>
              {formatMonthYear(currentMonth)}
            </Text>
            <TouchableOpacity
              onPress={() => navigateMonth('next')}
              style={styles.calendarHeaderButton}
              disabled={isAnimating}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* Animated Calendar Grid */}
          <View style={[styles.calendarWrapper, { backgroundColor: colors.background, overflow: 'hidden' }]}>
            <Animated.View
              style={[
                styles.calendarAnimatedWrapper,
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <Calendar
                key={`calendar-${isDarkMode ? 'dark' : 'light'}-${colors.primary}-${firstDay}-${currentMonth}`}
                current={currentMonth}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                onMonthChange={(month) => {
                  // Only process if not animating and month is actually different
                  if (isAnimating) return;
                  
                  const monthDate = new Date(month.dateString);
                  const currentDate = new Date(currentMonth);
                  const isSameMonth = monthDate.getMonth() === currentDate.getMonth() && 
                                     monthDate.getFullYear() === currentDate.getFullYear();
                  
                  if (isSameMonth) return;
                  
                  const direction = monthDate > currentDate ? 1 : -1;
                  setIsAnimating(true);
                  
                  // Animate out
                  Animated.timing(slideAnim, {
                    toValue: direction * -400,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => {
                    // Update month immediately before animating in
                    setCurrentMonth(month.dateString);
                    
                    // Reset position and animate in
                    slideAnim.setValue(direction * 400);
                    Animated.timing(slideAnim, {
                      toValue: 0,
                      duration: 250,
                      useNativeDriver: true,
                    }).start(() => {
                      setIsAnimating(false);
                    });
                  });
                }}
                markedDates={markedDates}
                theme={calendarTheme}
                style={[styles.calendar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}
                hideExtraDays={false}
                disableMonthChange={false}
                enableSwipeMonths={true}
                firstDay={firstDay}
                hideArrows={true}
                renderHeader={() => null}
              />
            </Animated.View>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={[styles.tasksDivider, { borderTopColor: colors.border }]} />
        <View style={[styles.tasksSection, { backgroundColor: colors.background }]}>
          {/* Sort Buttons */}
          <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: colors.text }]}>Sort:</Text>
          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: sortBy === 'time' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSortBy('time')}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={sortBy === 'time' ? buttonTextColor : colors.text}
            />
            <Text
              style={[
                styles.sortButtonText,
                { color: sortBy === 'time' ? buttonTextColor : colors.text },
              ]}
            >
              Time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: sortBy === 'type' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSortBy('type')}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={sortBy === 'type' ? buttonTextColor : colors.text}
            />
            <Text
              style={[
                styles.sortButtonText,
                { color: sortBy === 'type' ? buttonTextColor : colors.text },
              ]}
            >
              Type
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: sortBy === 'points' ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSortBy('points')}
          >
            <Ionicons
              name="star-outline"
              size={18}
              color={sortBy === 'points' ? buttonTextColor : colors.text}
            />
            <Text
              style={[
                styles.sortButtonText,
                { color: sortBy === 'points' ? buttonTextColor : colors.text },
              ]}
            >
              Points
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Date */}
        <Text style={[styles.selectedDateText, { color: colors.text }]}>
          {(() => {
            // Parse date string properly to avoid timezone issues
            const [year, month, day] = selectedDate.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
            const monthName = date.toLocaleDateString('en-US', { month: 'long' });
            const ordinalSuffix = getOrdinalSuffix(day);
            return `${weekday}, ${monthName} ${day}${ordinalSuffix}:`;
          })()}
        </Text>

        {/* Tasks List */}
        {sortedTasks.length > 0 ? (
          <View style={styles.tasksList}>
            {sortedTasks.map((item) => renderTaskItem(item))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No events for this date
            </Text>
          </View>
        )}
        </View>
      </ScrollView>

      {/* Task Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modal}
        onRequestClose={() => setModal(!modal)}
      >
        {selectedItem && (
          <View style={styles.modalView}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedItem.name}
                </Text>
                {selectedItem.complete && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </View>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                Description: {selectedItem.description || 'No description'}
              </Text>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                Time: {selectedItem.time}
              </Text>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                Points: {selectedItem.points}
              </Text>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.textSecondary }]}
                  onPress={() => setModal(!modal)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.completeButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    Alert.alert(
                      'Task Completed',
                      `You have earned ${selectedItem.points} points!`
                    );
                    toggleComplete(selectedDate, selectedItem.id);
                    setModal(!modal);
                  }}
                >
                  <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                    {selectedItem.complete ? 'Mark Incomplete' : 'Complete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  calendarContainer: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 0,
  },
  calendarHeaderButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  calendarWrapper: {
    overflow: 'hidden',
  },
  calendarAnimatedWrapper: {
    width: '100%',
  },
  calendar: {
    borderBottomWidth: 0,
    marginTop: 0,
    paddingTop: 0,
  },
  tasksDivider: {
    borderTopWidth: 1,
    marginTop: 0,
    marginBottom: 0,
    width: '100%',
  },
  tasksSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  tasksList: {
    paddingBottom: 20,
  },
  taskCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
    flex: 1,
  },
  completeIcon: {
    marginLeft: 4,
  },
  taskTime: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCategory: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  taskPoints: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'monospace',
    marginTop: 16,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    flex: 1,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  completeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#FFFFFF',
  },
});
