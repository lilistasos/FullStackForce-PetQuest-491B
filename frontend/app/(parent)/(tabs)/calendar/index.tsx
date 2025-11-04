import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
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
}

type SortOption = 'time' | 'child' | 'type';

export default function ParentCalendarScreen() {
  const { colors, isDarkMode } = useTheme();
  
  const { user } = useAuth();
  const buttonTextColor = getContrastColor(colors.primary);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [firstDay, setFirstDay] = useState<0 | 1>(1); // 0 = Sunday, 1 = Monday
  
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
    setSortBy('time');
  }, [user]); // Reset when user changes (login/logout)
  
  // Mock children data - In real app, this would come from API based on familyCode
  const mockChildren = [
    { id: 'child1', name: 'Emma', color: '#52AFDD' },
    { id: 'child2', name: 'Liam', color: '#00C851' },
    { id: 'child3', name: 'Sophia', color: '#FFBB33' },
  ];

  // Mock tasks data for children - In real app, this would come from API
  const [childrenTasks, setChildrenTasks] = useState<{ [date: string]: ChildTask[] }>({
    [selectedDate]: [
      {
        id: '1',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Math Homework',
        description: 'Complete pages 45-50',
        time: '09:00 AM',
        points: 15,
        completed: false,
        category: 'School',
      },
      {
        id: '2',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Soccer Practice',
        description: 'Team practice at field',
        time: '02:00 PM',
        points: 10,
        completed: false,
        category: 'Practice',
      },
      {
        id: '3',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Reading',
        description: 'Read chapter 3',
        time: '04:00 PM',
        points: 12,
        completed: true,
        category: 'School',
      },
      {
        id: '4',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Practice Piano',
        description: 'Practice for 30 minutes',
        time: '03:30 PM',
        points: 20,
        completed: false,
        category: 'Practice',
      },
      {
        id: '5',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Science Project',
        description: 'Work on volcano project',
        time: '10:00 AM',
        points: 25,
        completed: false,
        category: 'School',
      },
    ],
    '2025-10-21': [
      {
        id: '6',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Art Class',
        description: 'Attend art class',
        time: '01:00 PM',
        points: 15,
        completed: false,
        category: 'School',
      },
      {
        id: '7',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Soccer Game',
        description: 'Championship game',
        time: '05:00 PM',
        points: 20,
        completed: false,
        category: 'Game',
      },
    ],
    '2025-10-22': [
      {
        id: '8',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Math Tutoring',
        description: 'Tutoring session with Ms. Johnson',
        time: '06:00 PM',
        points: 5,
        completed: false,
        category: 'Tutoring',
      },
    ],
    '2025-11-01': [
      {
        id: '9',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Soccer Practice',
        description: 'Team practice at Riverside Field',
        time: '04:00 PM',
        points: 15,
        completed: false,
        category: 'Practice',
      },
      {
        id: '10',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Piano Recital',
        description: 'Spring recital performance',
        time: '06:30 PM',
        points: 30,
        completed: false,
        category: 'School',
      },
    ],
    '2025-11-02': [
      {
        id: '11',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Basketball Game',
        description: 'Home game vs. Eagles',
        time: '05:00 PM',
        points: 25,
        completed: false,
        category: 'Game',
      },
      {
        id: '12',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Science Fair',
        description: 'School science fair presentation',
        time: '02:00 PM',
        points: 40,
        completed: false,
        category: 'School',
      },
      {
        id: '13',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Dance Practice',
        description: 'Ballet practice at studio',
        time: '03:30 PM',
        points: 20,
        completed: false,
        category: 'Practice',
      },
    ],
    '2025-11-03': [
      {
        id: '14',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Swimming Practice',
        description: 'Evening swim practice',
        time: '05:30 PM',
        points: 15,
        completed: false,
        category: 'Practice',
      },
      {
        id: '15',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Math Tutoring',
        description: 'Algebra tutoring session',
        time: '04:00 PM',
        points: 10,
        completed: false,
        category: 'Tutoring',
      },
    ],
    '2025-11-04': [
      {
        id: '16',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Soccer Game',
        description: 'Away game at Central Park',
        time: '04:30 PM',
        points: 30,
        completed: false,
        category: 'Game',
      },
      {
        id: '17',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'School Assembly',
        description: 'Monthly school assembly',
        time: '09:00 AM',
        points: 5,
        completed: false,
        category: 'School',
      },
      {
        id: '18',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Chess Club',
        description: 'Weekly chess club meeting',
        time: '03:00 PM',
        points: 15,
        completed: false,
        category: 'School',
      },
    ],
    '2025-11-05': [
      {
        id: '19',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Basketball Practice',
        description: 'Morning practice session',
        time: '10:00 AM',
        points: 20,
        completed: true,
        category: 'Practice',
      },
      {
        id: '20',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Tennis Match',
        description: 'Tournament match',
        time: '02:00 PM',
        points: 35,
        completed: true,
        category: 'Game',
      },
      {
        id: '21',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Piano Practice',
        description: 'Practice for upcoming recital',
        time: '03:00 PM',
        points: 20,
        completed: false,
        category: 'Practice',
      },
      {
        id: '21a',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Swimming Practice',
        description: 'Afternoon swim session',
        time: '04:30 PM',
        points: 15,
        completed: false,
        category: 'Practice',
      },
      {
        id: '21b',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Math Tutoring',
        description: 'Algebra tutoring session',
        time: '05:00 PM',
        points: 10,
        completed: false,
        category: 'Tutoring',
      },
      {
        id: '21c',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Soccer Game',
        description: 'Away game vs. Panthers',
        time: '06:00 PM',
        points: 30,
        completed: false,
        category: 'Game',
      },
      {
        id: '21d',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Science Fair',
        description: 'Project presentation',
        time: '07:30 PM',
        points: 40,
        completed: false,
        category: 'School',
      },
    ],
    '2025-11-06': [
      {
        id: '22',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Soccer Practice',
        description: 'Team practice session',
        time: '05:00 PM',
        points: 15,
        completed: false,
        category: 'Practice',
      },
      {
        id: '23',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Basketball Practice',
        description: 'Team practice at gym',
        time: '04:30 PM',
        points: 20,
        completed: false,
        category: 'Practice',
      },
      {
        id: '24',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Art Class',
        description: 'After school art program',
        time: '03:00 PM',
        points: 15,
        completed: false,
        category: 'School',
      },
    ],
    '2025-11-07': [
      {
        id: '25',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Dance Recital',
        description: 'Annual dance recital',
        time: '06:00 PM',
        points: 40,
        completed: false,
        category: 'School',
      },
      {
        id: '26',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Science Tutoring',
        description: 'Chemistry tutoring with Mr. Smith',
        time: '05:00 PM',
        points: 10,
        completed: false,
        category: 'Tutoring',
      },
      {
        id: '27',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Baseball Game',
        description: 'Home game vs. Tigers',
        time: '04:00 PM',
        points: 30,
        completed: false,
        category: 'Game',
      },
    ],
    '2025-11-08': [
      {
        id: '28',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Swimming Meet',
        description: 'Regional swimming competition',
        time: '09:00 AM',
        points: 50,
        completed: false,
        category: 'Game',
      },
      {
        id: '29',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Piano Practice',
        description: 'Weekly practice session',
        time: '04:30 PM',
        points: 20,
        completed: false,
        category: 'Practice',
      },
      {
        id: '30',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'History Tutoring',
        description: 'World history tutoring',
        time: '03:00 PM',
        points: 10,
        completed: false,
        category: 'Tutoring',
      },
      {
        id: '31',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Field Trip',
        description: 'Museum field trip',
        time: '10:00 AM',
        points: 25,
        completed: false,
        category: 'School',
      },
    ],
    '2025-11-09': [
      {
        id: '32',
        childName: 'Sophia',
        childId: 'child3',
        taskName: 'Soccer Game',
        description: 'Championship game',
        time: '05:30 PM',
        points: 45,
        completed: false,
        category: 'Game',
      },
      {
        id: '33',
        childName: 'Liam',
        childId: 'child2',
        taskName: 'Basketball Game',
        description: 'Playoff game',
        time: '06:00 PM',
        points: 40,
        completed: false,
        category: 'Game',
      },
      {
        id: '34',
        childName: 'Emma',
        childId: 'child1',
        taskName: 'Music Concert',
        description: 'School band concert',
        time: '07:00 PM',
        points: 30,
        completed: false,
        category: 'School',
      },
    ],
  });

  // Get current month name (for the calendar header month display)
  const currentMonthName = new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
  const selectedDateTasks = childrenTasks[selectedDate] || [];

  // Sort tasks based on selected option
  const sortedTasks = useMemo(() => {
    const tasks = [...selectedDateTasks];
    
    if (sortBy === 'child') {
      return tasks.sort((a, b) => {
        if (a.childName !== b.childName) {
          return a.childName.localeCompare(b.childName);
        }
        // If same child, sort by time
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
    } else if (sortBy === 'type') {
      return tasks.sort((a, b) => {
        // First sort by category
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        // If same category, sort by time
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
    } else {
      // Sort by time (default)
      return tasks.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    }
  }, [selectedDateTasks, sortBy]);

  // Get marked dates (dates with tasks)
  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};
    
    // Get today's date string
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    Object.keys(childrenTasks).forEach(date => {
      marked[date] = {
        marked: true,
        dotColor: colors.primary,
      };
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
            fontWeight: 'normal',
          },
        },
      };
    }
    
    // Style selected date
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

  const formatTime = (timeString: string) => {
    // Convert "09:00 AM" or "14:00" format to display format
    return timeString;
  };

  const getChildColor = (childId: string) => {
    const child = mockChildren.find(c => c.id === childId);
    return child?.color || colors.primary;
  };

  const renderTaskItem = ({ item }: { item: ChildTask }) => {
    const childColor = getChildColor(item.childId);
    
    return (
      <View style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.taskHeader}>
          <View style={[styles.childBadge, { backgroundColor: childColor }]}>
            <Text style={[styles.childBadgeText, { color: 'white' }]}>{item.childName}</Text>
          </View>
          <Text style={[styles.taskTime, { color: colors.textSecondary }]}>{formatTime(item.time)}</Text>
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

  // Calendar theme that adapts to dark/light mode
  const disabledDayColor = isDarkMode ? '#666666' : '#CCCCCC';
  // Use colors.background for calendar to match the app theme
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
          <View style={[styles.calendarWrapper, { backgroundColor: colors.background }]}>
            <Calendar
              key={`calendar-${isDarkMode ? 'dark' : 'light'}-${colors.primary}-${firstDay}`}
              current={selectedDate}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={calendarTheme}
              style={[styles.calendar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}
              hideExtraDays={false}
              disableMonthChange={false}
              enableSwipeMonths={true}
              firstDay={firstDay}
        />
          </View>
        </View>

        {/* Tasks Section */}
        <View style={[styles.tasksSection, { backgroundColor: colors.background }]}>
          <View style={[styles.tasksDivider, { borderTopColor: colors.border }]} />
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
            // Parse date string properly to avoid timezone issues
            const [year, month, day] = selectedDate.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            });
          })()}
        </Text>

        {/* Tasks List */}
        {sortedTasks.length > 0 ? (
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
  calendarWrapper: {
    overflow: 'hidden',
  },
  calendar: {
    borderBottomWidth: 0,
    marginTop: 0,
    paddingTop: 0,
  },
  tasksSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tasksDivider: {
    borderTopWidth: 1,
    marginTop: 0,
    marginBottom: 16,
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
