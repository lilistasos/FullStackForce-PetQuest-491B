import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, Dimensions, Platform } from 'react-native';
import { WeekCalendar, CalendarProvider } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePet } from '@/contexts/PetContext';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { getApiUrl } from '@/utils/api';

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

interface TaskItem {
  id: string;
  name: string;
  description?: string;
  time: string;
  points: number;
  complete: boolean;
  category?: string;
  dueDate?: string;
  type?: string; // 'task' or 'event'
}

interface AgendaSection {
  title: string;
  data: TaskItem[];
}

type SortOption = 'time' | 'type' | 'points';

// Helper function to format date as YYYY-MM-DD without timezone issues
const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to normalize a date to the Monday of its week
const getMondayOfWeek = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  return formatDateString(monday);
};

// Helper function to check if a date is in the visible week
const isDateInVisibleWeek = (dateString: string, weekStartDate: string): boolean => {
  const mondayOfWeek = getMondayOfWeek(weekStartDate);
  const [year, month, day] = mondayOfWeek.split('-').map(Number);
  const weekStart = new Date(year, month - 1, day);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const [checkYear, checkMonth, checkDay] = dateString.split('-').map(Number);
  const checkDate = new Date(checkYear, checkMonth - 1, checkDay);
  return checkDate >= weekStart && checkDate <= weekEnd;
};

// Helper function to get the same day of week in a different week
const getSameDayInWeek = (selectedDate: string, weekStartDate: string): string => {
  const [selectedYear, selectedMonth, selectedDay] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(selectedYear, selectedMonth - 1, selectedDay);
  const dayOfWeek = selectedDateObj.getDay();
  const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const mondayOfWeek = getMondayOfWeek(weekStartDate);
  const [weekYear, weekMonth, weekDay] = mondayOfWeek.split('-').map(Number);
  const weekStart = new Date(weekYear, weekMonth - 1, weekDay);
  
  const newDate = new Date(weekStart);
  newDate.setDate(weekStart.getDate() + adjustedDayOfWeek);
  return formatDateString(newDate);
};

// Helper function to convert time string to minutes since midnight for proper sorting
const timeToMinutes = (timeStr: string): number => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  
  return totalMinutes;
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

export default function CalendarScreen() {
  const { colors, isDarkMode } = useTheme();
  const { selectedPet } = usePet();
  const { user, token } = useAuth();
  const buttonTextColor = getContrastColor(colors.primary);

  const now = new Date();
  const initialDate = formatDateString(new Date(now.getTime() - now.getTimezoneOffset() * 60000));
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [visibleWeekDate, setVisibleWeekDate] = useState(initialDate);
  const [firstDay, setFirstDay] = useState<0 | 1>(1); // 0 = Sunday, 1 = Monday
  
  const isSwipingRef = useRef(false);
  
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
  const lastSwipeTimeRef = useRef<number>(0);
  const previousVisibleWeekRef = useRef<string>(initialDate);
  
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [items, setItems] = useState<AgendaSection[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null);

  // Fetch tasks from API
  const fetchTasks = async () => {
    if (!user || !token || user.role !== 'child') return;
    
    try {
      setLoading(true);
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const tasks = await response.json();
      
      // Transform tasks to the format expected by the calendar
      // Filter to show only events (type === 'event')
      const agendaSections: AgendaSection[] = [];
      const tasksByDate: { [key: string]: TaskItem[] } = {};

      console.log('Child Calendar: All tasks received:', tasks.length, tasks.map((t: any) => ({ id: t.id, text: t.text, type: t.type, dueDate: t.dueDate })));
      const eventTasks = tasks.filter((task: any) => {
        // Show events: type === 'event' OR if type is missing but category suggests it's an event
        const isEvent = task.type === 'event' || 
                       (!task.type && ['School', 'Sporting Games', 'Family Gatherings'].includes(task.category));
        if (isEvent) {
          console.log('Child Calendar: Found event:', { id: task.id, text: task.text, type: task.type, dueDate: task.dueDate });
        }
        return isEvent;
      });

      eventTasks
        .forEach((task: any) => {
          // Backend returns 'dueDate', not 'date'
          // Normalize date to YYYY-MM-DD format
          let dateKey = task.dueDate || task.date;
          let timeStr = '';
          
          if (dateKey) {
            // Extract time from dueDate if it's a full datetime (for events)
            // Backend returns PostgreSQL timestamp format: "2025-12-06 00:00:00-08" or ISO: "2025-12-06T00:00:00Z"
            if (task.type === 'event' && typeof dateKey === 'string') {
              // Check if it's a datetime (has space or T separator, not just date)
              const isDateTime = dateKey.includes('T') || (dateKey.includes(' ') && dateKey.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/));
              
              if (isDateTime) {
                // Parse the datetime string (handles both ISO and PostgreSQL formats)
                const dateObj = new Date(dateKey);
                if (!isNaN(dateObj.getTime())) {
                  const hours = dateObj.getHours();
                  const minutes = dateObj.getMinutes();
                  const period = hours >= 12 ? 'PM' : 'AM';
                  const displayHours = hours % 12 || 12;
                  const displayMinutes = minutes.toString().padStart(2, '0');
                  timeStr = `${displayHours}:${displayMinutes} ${period}`;
                }
              }
            }
            
            // Ensure date is in YYYY-MM-DD format
            // Handle both ISO (T separator) and PostgreSQL (space separator) formats
            if (typeof dateKey === 'string') {
              // Extract just the date part (before T or space)
              dateKey = dateKey.split('T')[0].split(' ')[0];
            }
            
            if (dateKey && dateKey.match(/^\d{4}-\d{2}-\d{2}/)) {
              if (!tasksByDate[dateKey]) {
                tasksByDate[dateKey] = [];
              }
              
              tasksByDate[dateKey].push({
                id: task.id.toString(),
                name: task.text || task.taskName || task.title,
                description: task.description || '',
                time: timeStr, // Use extracted time, empty string if no time
                points: task.points || 0, // Points from backend
                complete: task.completed || false,
                category: task.category || 'Other',
                dueDate: dateKey,
                type: task.type || 'task', // Store the type to check if it's an event
              });
            }
          }
        });

      // Convert to AgendaSection format
      Object.keys(tasksByDate).forEach(date => {
        agendaSections.push({
          title: date,
          data: tasksByDate[date],
        });
      });

      // Debug logging (remove after testing)
      if (eventTasks.length > 0) {
        console.log('Calendar: Found events:', eventTasks.length, eventTasks.map((t: any) => ({ id: t.id, text: t.text, type: t.type, dueDate: t.dueDate })));
        console.log('Calendar: Tasks by date:', Object.keys(tasksByDate));
      }

      setItems(agendaSections);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Load tasks when component mounts or user changes
  useEffect(() => {
    if (user && token) {
      fetchTasks();
    }
  }, [user, token]);

  // Complete task function
  const completeTask = async (taskId: string) => {
    if (!token) return;

    // Find the task to check if it's an event
    const task = items
      .flatMap(section => section.data)
      .find(item => item.id === taskId);
    
    // Prevent completing events
    if (task?.type === 'event') {
      Alert.alert('Cannot Complete Event', 'Events cannot be completed. They are informational only.');
      return 0;
    }

    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to complete task');
      }

      const result = await response.json();
      
      // Update local state
      setItems(prevItems =>
        prevItems.map(section => ({
          ...section,
          data: section.data.map(item =>
            item.id === taskId 
              ? { ...item, complete: true }
              : item
          ),
        }))
      );

      // Show success message with points if available
      const pointsEarned = result.points || task?.points || 0;
      if (pointsEarned > 0) {
        Alert.alert('Task Completed', `You have earned ${pointsEarned} points!`);
      } else {
        Alert.alert('Task Completed', 'Task marked as complete!');
      }
      return pointsEarned;
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task');
      return 0;
    }
  };

  // Shared function to navigate weeks (used by buttons and swipe handlers)
  const navigateWeek = (direction: 'prev' | 'next') => {
    isSwipingRef.current = true;
    lastSwipeTimeRef.current = Date.now();
    
    const [year, month, day] = visibleWeekDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    const newWeekDate = formatDateString(date);
    
    setVisibleWeekDate(newWeekDate);
    
    if (!isDateInVisibleWeek(currentDate, newWeekDate)) {
      const newSelectedDate = getSameDayInWeek(currentDate, newWeekDate);
      setCurrentDate(newSelectedDate);
    }
    
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 1000);
  };

  const toggleComplete = async (date: string, itemId: string) => {
    const pointsEarned = await completeTask(itemId);
    if (pointsEarned > 0) {
      setModal(false);
    }
  };

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
        </View>
        {item.description && (
          <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>{item.description}</Text>
        )}
        <View style={styles.taskFooter}>
          <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>
            {item.time ? `${item.category || 'Event'}: ${item.time}` : (item.category || 'Event')}
          </Text>
          <Text style={[styles.taskPoints, { color: colors.primary }]}>{item.points} pts</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Simplified calendar theme
  const calendarBg = colors.background;
  const disabledDayColor = isDarkMode ? '#666666' : '#CCCCCC';
  const calendarTheme = useMemo(() => ({
    backgroundColor: calendarBg,
    calendarBackground: calendarBg,
    textSectionTitleColor: colors.text,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: buttonTextColor,
    todayTextColor: colors.primary,
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
    textDayFontSize: 20,
    textMonthFontSize: 60,
    textDayHeaderFontSize: 15,
    'stylesheet.day.basic': {
      base: {
        width: 50,
        height: 40,
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
        alignSelf: 'center',
        marginTop: 4,
        marginBottom: 4,
        marginLeft: 9,
        marginRight: 9,
      },
    },
    'stylesheet.calendar.header': {
      week: {
        marginTop: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingRight: 10,
        marginBottom: 0,
        backgroundColor: calendarBg,
        paddingTop: 4,
        paddingBottom: 0,
      },
      monthText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        fontFamily: 'monospace',
      },
      dayHeader: {
        marginTop: 0,
        marginBottom: 24,
        width: 50,
        textAlign: 'center',
        color: colors.text,
        fontFamily: 'monospace',
        fontSize: 15,
      },
    },
    'stylesheet.calendar.main': {
      container: {
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: calendarBg,
      },
      week: {
        backgroundColor: calendarBg,
        paddingTop: 8,
        paddingBottom: 4,
      },
    },
  }), [colors.background, colors.text, colors.primary, buttonTextColor, isDarkMode]);

  // Get current month and year based on selected date
  const currentMonthName = useMemo(() => {
    const [year, month] = currentDate.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Keep ref in sync with visibleWeekDate
  useEffect(() => {
    previousVisibleWeekRef.current = visibleWeekDate;
  }, [visibleWeekDate]);

  // Get marked dates (dates with tasks) - show dots for all dates with events
  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};
    
    // Add dots for all dates that have events
    items.forEach(section => {
      if (section.data.length > 0) {
        marked[section.title] = {
          marked: true,
          dotColor: colors.primary,
        };
      }
    });
    
    // Add selected styling for the current date (if in visible week)
    if (isDateInVisibleWeek(currentDate, visibleWeekDate)) {
      marked[currentDate] = {
        ...marked[currentDate],
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
            alignSelf: 'center',
            marginTop: 4,
            marginBottom: 4,
            marginLeft: 9,
            marginRight: 9,
            paddingTop: 0,
            paddingBottom: 0,
            borderWidth: 0,
          },
          text: {
            color: buttonTextColor,
            textAlign: 'center',
            textAlignVertical: 'center',
            lineHeight: 20,
            fontSize: 20,
            fontWeight: 'normal',
          },
        },
      };
    }
    
    return marked;
  }, [items, currentDate, visibleWeekDate, colors.primary, buttonTextColor]);

  // Get tasks for selected date and sort them
  const todayAgenda = items.filter(section => section.title === currentDate);
  const todayTasks = todayAgenda.length > 0 ? todayAgenda[0].data : [];
  
  const sortedTasks = useMemo(() => {
    const tasks = [...todayTasks];
    
    if (sortBy === 'type') {
      return tasks.sort((a, b) => {
        const categoryA = a.category || 'Event';
        const categoryB = b.category || 'Event';
        if (categoryA !== categoryB) {
          return categoryA.localeCompare(categoryB);
        }
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
    } else if (sortBy === 'points') {
      return tasks.sort((a, b) => b.points - a.points);
    } else {
      return tasks.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    }
  }, [todayTasks, sortBy]);

  // Sort button component
  const SortButton = ({ option, icon, label }: { option: SortOption; icon: string; label: string }) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        {
          backgroundColor: sortBy === option ? colors.primary : colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => setSortBy(option)}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={sortBy === option ? buttonTextColor : colors.text}
      />
      <Text
        style={[
          styles.sortButtonText,
          { color: sortBy === option ? buttonTextColor : colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Format selected date display
  const selectedDateText = useMemo(() => {
    const [year, month, day] = currentDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    const ordinalSuffix = getOrdinalSuffix(day);
    return `${weekday}, ${monthName} ${day}${ordinalSuffix}:`;
  }, [currentDate]);

  return (
    <CalendarProvider date={visibleWeekDate} style={{ backgroundColor: colors.background }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {/* Header with Pet, Month/Year, and Navigation */}
          <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
            <Image
              source={selectedPet.image}
              style={styles.petImage}
              resizeMode="contain"
            />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.dateText, { color: colors.text }]}>
                {currentMonthName}
              </Text>
            </View>
            <View style={styles.navigationContainer}>
              <TouchableOpacity onPress={() => navigateWeek('prev')}>
                <Ionicons name="chevron-back" size={26} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateWeek('next')}>
                <Ionicons name="chevron-forward" size={26} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Week Calendar */}
          <View style={[styles.calendarWrapper, { backgroundColor: colors.background, ...noShadow }]}>
            <View style={[styles.calendarLine, styles.calendarLineTop, { backgroundColor: colors.border }]} />
            <WeekCalendar
              key={`week-calendar-${isDarkMode ? 'dark' : 'light'}-${colors.background}-${colors.primary}-${firstDay}`}
              current={visibleWeekDate}
              onDayPress={(day) => {
                const dayIsInVisibleWeek = isDateInVisibleWeek(day.dateString, visibleWeekDate);
                const now = Date.now();
                const timeSinceLastSwipe = now - lastSwipeTimeRef.current;
                const looksLikeSwipe = isSwipingRef.current || timeSinceLastSwipe < 2000;
                
                if (!dayIsInVisibleWeek && looksLikeSwipe) {
                  // Swipe detected - determine direction and navigate
                  const [year, month, dayNum] = visibleWeekDate.split('-').map(Number);
                  const date = new Date(year, month - 1, dayNum);
                  const [dayYear, dayMonth, dayDay] = day.dateString.split('-').map(Number);
                  const dayDateObj = new Date(dayYear, dayMonth - 1, dayDay);
                  const daysDiff = Math.round((dayDateObj.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                  
                  navigateWeek(daysDiff > 0 ? 'next' : 'prev');
                  setTimeout(() => {
                    isSwipingRef.current = false;
                  }, 100);
                } else {
                  // Normal day selection
                  setCurrentDate(day.dateString);
                  setVisibleWeekDate(day.dateString);
                }
              }}
              onMonthChange={(month) => {
                isSwipingRef.current = true;
                lastSwipeTimeRef.current = Date.now();
                
                const [prevYear, prevMonth] = previousVisibleWeekRef.current.split('-').map(Number);
                const prevMonthIndex = prevYear * 12 + prevMonth;
                const newMonthIndex = month.year * 12 + month.month;
                const monthDiff = newMonthIndex - prevMonthIndex;
                
                if (monthDiff !== 0) {
                  navigateWeek(monthDiff > 0 ? 'next' : 'prev');
                }
                
                setTimeout(() => {
                  isSwipingRef.current = false;
                }, 1500);
              }}
              markedDates={markedDates}
              theme={calendarTheme}
              style={[styles.calendar, { backgroundColor: calendarBg, ...noShadow }]}
              hideExtraDays={false}
              firstDay={firstDay}
              enableSwipeMonths={false}
              hideArrows={true}
              allowShadow={false}
            />
            <View style={[styles.calendarLine, styles.calendarLineBottom, { backgroundColor: colors.border }]} />
          </View>

          {/* Tasks Section */}
          <View style={[styles.tasksSection, { backgroundColor: colors.background }]}>
            {/* Sort Buttons */}
            <View style={styles.sortContainer}>
              <Text style={[styles.sortLabel, { color: colors.text }]}>Sort:</Text>
              <SortButton option="time" icon="time-outline" label="Time" />
              <SortButton option="type" icon="list-outline" label="Type" />
              <SortButton option="points" icon="star-outline" label="Points" />
            </View>

            {/* Selected Date */}
            <Text style={[styles.selectedDateText, { color: colors.text }]}>
              {selectedDateText}
            </Text>

            {/* Tasks List */}
            {loading ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Loading tasks...
                </Text>
              </View>
            ) : sortedTasks.length > 0 ? (
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
                {selectedItem.time && (
                  <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                    Time: {selectedItem.time}
                  </Text>
                )}
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
                  {!selectedItem.complete && selectedItem.type !== 'event' && (
                    <TouchableOpacity
                      style={[styles.completeButton, { backgroundColor: colors.primary }]}
                      onPress={() => toggleComplete(currentDate, selectedItem.id)}
                    >
                      <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                        Complete
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </Modal>
      </View>
    </CalendarProvider>
  );
}

// Shared style for removing shadows/elevation
const noShadow = {
  elevation: 0,
  shadowOpacity: 0,
  shadowColor: 'transparent' as const,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...noShadow,
  },
  scrollContainer: {
    flex: 1,
    ...noShadow,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...noShadow,
  },
  petImage: {
    width: 70,
    height: 70,
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginLeft: 16,
  },
  calendarWrapper: {
    overflow: 'visible',
    position: 'relative',
    paddingBottom: 4,
    paddingTop: 4,
    ...noShadow,
  },
  calendar: {
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    opacity: 1,
    ...noShadow,
  },
  calendarLine: {
    height: 1,
    width: Dimensions.get('window').width,
    position: 'absolute',
    marginLeft: -Dimensions.get('window').width * 0.5,
    left: Dimensions.get('window').width * 0.5,
  },
  calendarLineTop: {
    top: 0,
  },
  calendarLineBottom: {
    bottom: 0,
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
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  taskTime: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 6,
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
    alignItems: 'center',
    minWidth: '80%',
    maxWidth: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'monospace',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
    width: '100%',
  },
  closeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});