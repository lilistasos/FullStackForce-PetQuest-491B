import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Alert,
  Platform,
  RefreshControl 
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the centralized API URL helper
import { getApiUrl } from '@/utils/api';

const WEEK_START_KEY = '@petquest:weekStart';

// Helper functions
const getContrastColor = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.4 ? '#000000' : '#FFFFFF';
};

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Interfaces
interface ChildTask {
  id: string;
  childName: string;
  childId: string;
  taskName: string;
  description: string;
  time: string;
  points: number;
  completed: boolean;
  category: string;
  date: string;
}

type SortOption = 'time' | 'child' | 'type';

// Added API service function directly in the file
const fetchChildrenTasks = async (token: string): Promise<ChildTask[]> => {
  const API_URL = getApiUrl();
  
  try {
    // Use the existing /api/tasks endpoint which returns tasks based on user role
    const response = await fetch(`${API_URL}/api/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const tasks = await response.json();
    
      // Transform backend format to match ChildTask interface expected by parent calendar
      // Filter to show only events (type === 'event')
      const transformedTasks: ChildTask[] = tasks
        .filter((task: any) => task.type === 'event') // Only show events on calendar
        .map((task: any) => {
          // Convert dueDate to YYYY-MM-DD format
          let dateStr = '';
          if (task.dueDate) {
            // Handle both date strings and Date objects
            const date = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate;
            if (!isNaN(date.getTime())) {
              dateStr = date.toISOString().split('T')[0]; // Extract YYYY-MM-DD
            } else if (typeof task.dueDate === 'string' && task.dueDate.match(/^\d{4}-\d{2}-\d{2}/)) {
              // Already in YYYY-MM-DD format
              dateStr = task.dueDate.split('T')[0].split(' ')[0];
            }
          }
          
          return {
            id: task.id.toString(),
            childName: task.assignedToName || 'Unknown Child',
            childId: task.assignedToUserId?.toString() || '',
            taskName: task.text || '',
            description: task.description || '',
            time: 'All Day', // Backend doesn't have time, using default
            points: task.points || 0,
            completed: task.completed || false,
            category: task.category || 'Other',
            date: dateStr,
          };
        });
    
    return transformedTasks;
  } catch (error) {
    console.error('Error fetching children tasks:', error);
    throw error;
  }
};

export default function ParentCalendarScreen() {
  const { colors, isDarkMode } = useTheme();
  const { user, token } = useAuth();
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
  const [firstDay, setFirstDay] = useState<0 | 1>(1);
  
  // Replaced mock data with empty state for real data
  const [childrenTasks, setChildrenTasks] = useState<{ [date: string]: ChildTask[] }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values for month transitions
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Helper function to convert time string to minutes since midnight for proper sorting
  const timeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    
    return totalMinutes;
  };

  // Function to load tasks from database API
  const loadChildrenTasks = async (isRefresh = false) => {
    if (!token || user?.role !== 'parent') {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch real data from database instead of using mock data
      const tasks = await fetchChildrenTasks(token);
      
      // Group tasks by date
      const tasksByDate: { [date: string]: ChildTask[] } = {};
      
      tasks.forEach(task => {
        // Only include tasks with valid dates
        if (task.date && task.date.match(/^\d{4}-\d{2}-\d{2}/)) {
          // Normalize date to YYYY-MM-DD format
          const normalizedDate = task.date.split('T')[0].split(' ')[0];
          if (!tasksByDate[normalizedDate]) {
            tasksByDate[normalizedDate] = [];
          }
          tasksByDate[normalizedDate].push(task);
        }
      });
      
      setChildrenTasks(tasksByDate);
    } catch (error) {
      console.error('Error loading children tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load real data on mount and when screen comes into focus
  useEffect(() => {
    loadChildrenTasks();
  }, [token, user]);

  useFocusEffect(
    React.useCallback(() => {
      loadChildrenTasks();
    }, [token, user])
  );

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
    slideAnim.setValue(0);
  }, [user]);

  // Get tasks for selected date
  const selectedDateTasks = childrenTasks[selectedDate] || [];

  // Sort tasks based on selected option
  const sortedTasks = useMemo(() => {
    const tasks = [...selectedDateTasks];
    
    if (sortBy === 'child') {
      return tasks.sort((a, b) => {
        if (a.childName !== b.childName) {
          return a.childName.localeCompare(b.childName);
        }
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
    } else if (sortBy === 'type') {
      return tasks.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
    } else {
      return tasks.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    }
  }, [selectedDateTasks, sortBy]);

  // Get marked dates (dates with tasks)
  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Use real task dates from database
    Object.keys(childrenTasks).forEach(date => {
      marked[date] = {
        marked: true,
        dotColor: colors.primary,
      };
    });
    
    if (todayString !== selectedDate) {
      marked[todayString] = {
        ...marked[todayString],
        customStyles: {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: colors.primary,
            fontWeight: 'normal',
          },
        },
      };
    }
    
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: colors.primary,
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
        },
      },
    };
    
    return marked;
  }, [childrenTasks, selectedDate, colors.primary, buttonTextColor]);

  // Calendar navigation functions
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
    
    if (newMonthString === currentMonth) return;
    
    setIsAnimating(true);
    
    Animated.timing(slideAnim, {
      toValue: directionNum * -400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentMonth(newMonthString);
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

  const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Simplified child color function since we don't have mock children data with thier colors
  const getChildColor = (childId: string) => {
    // Generate consistent color based on childId
    const colors = ['#52AFDD', '#00C851', '#FFBB33', '#FF4444', '#AA66CC', '#FF8800'];
    const index = childId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const renderTaskItem = ({ item }: { item: ChildTask }) => {
    const childColor = getChildColor(item.childId);
    
    return (
      <View style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.taskHeader}>
          <View style={[styles.childBadge, { backgroundColor: childColor }]}>
            <Text style={[styles.childBadgeText, { color: 'white' }]}>{item.childName}</Text>
          </View>
          <Text style={[styles.taskTime, { color: colors.textSecondary }]}>{item.time}</Text>
        </View>
        <View style={styles.taskNameRow}>
          <Text style={[styles.taskName, { color: colors.text }]}>
            {item.taskName}
          </Text>
          {item.completed && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.completeIcon} />
          )}
        </View>
        <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>{item.description}</Text>
        <View style={styles.taskFooter}>
          <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>{item.category}</Text>
          <Text style={[styles.taskPoints, { color: colors.primary }]}>{item.points} pts</Text>
        </View>
      </View>
    );
  };

  // Calendar theme configuration
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
    textDayFontSize: 14,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 12,
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
        // Added refresh control for pulling to refresh data
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadChildrenTasks(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Calendar Section */}
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
                  if (isAnimating) return;
                  
                  const monthDate = new Date(month.dateString);
                  const currentDate = new Date(currentMonth);
                  const isSameMonth = monthDate.getMonth() === currentDate.getMonth() && 
                                     monthDate.getFullYear() === currentDate.getFullYear();
                  
                  if (isSameMonth) return;
                  
                  const direction = monthDate > currentDate ? 1 : -1;
                  setIsAnimating(true);
                  
                  Animated.timing(slideAnim, {
                    toValue: direction * -400,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => {
                    setCurrentMonth(month.dateString);
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
            <Text style={[styles.sortLabel, { color: colors.text }]}>Sort by:</Text>
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
                  backgroundColor: sortBy === 'child' ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSortBy('child')}
            >
              <Ionicons
                name="people-outline"
                size={18}
                color={sortBy === 'child' ? buttonTextColor : colors.text}
              />
              <Text
                style={[
                  styles.sortButtonText,
                  { color: sortBy === 'child' ? buttonTextColor : colors.text },
                ]}
              >
                Child
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
          </View>

          {/* Selected Date */}
          <Text style={[styles.selectedDateText, { color: colors.text }]}>
            {(() => {
              const [year, month, day] = selectedDate.split('-').map(Number);
              const date = new Date(year, month - 1, day);
              const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
              const monthName = date.toLocaleDateString('en-US', { month: 'long' });
              const ordinalSuffix = getOrdinalSuffix(day);
              return `${weekday}, ${monthName} ${day}${ordinalSuffix}:`;
            })()}
          </Text>

          {/* CHANGED: Tasks List with real data loading states */}
          {loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="refresh-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Loading tasks...
              </Text>
            </View>
          ) : sortedTasks.length > 0 ? (
            <View style={styles.tasksList}>
              {sortedTasks.map((item) => (
                <View key={item.id}>
                  {renderTaskItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No tasks for this date
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    marginBottom: 8,
  },
  childBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  childBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  taskTime: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  taskNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginRight: 8,
  },
  completeIcon: {
    marginLeft: 0,
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
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'monospace',
    marginTop: 12,
  },
});