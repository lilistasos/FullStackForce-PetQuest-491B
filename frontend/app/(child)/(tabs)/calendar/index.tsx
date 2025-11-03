import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, Dimensions } from 'react-native';
import { WeekCalendar, CalendarProvider } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePet } from '@/contexts/PetContext';

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
}

interface AgendaSection {
  title: string;
  data: TaskItem[];
}

type SortOption = 'time' | 'type' | 'points';

export default function CalendarScreen() {
  const { colors, isDarkMode } = useTheme();
  const { selectedPet } = usePet();
  const buttonTextColor = getContrastColor(colors.primary);

  const now = new Date();
  const [currentDate, setCurrentDate] = useState(() => 
    new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  // Track visible week separately from selected date to prevent auto-selection on swipe
  const [visibleWeekDate, setVisibleWeekDate] = useState(() => 
    new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  // Track if we're in a swipe gesture to prevent date selection
  const isSwipingRef = useRef(false);
  // Track when the last swipe occurred to prevent auto-selection
  const lastSwipeTimeRef = useRef<number>(0);
  
  const [sortBy, setSortBy] = useState<SortOption>('time');

  const [items, setItems] = useState<AgendaSection[]>([
      {
        title: '2025-10-21',
      data: [
        { name: 'Soccer Practice', id: '1', description: 'Team practice at Riverside Field', time: '04:00 PM', points: 15, complete: false, category: 'Practice' },
        { name: 'Art Class', id: '2', description: 'After school art program', time: '03:00 PM', points: 10, complete: false, category: 'School' },
      ],
    },
    {
      title: '2025-10-22',
      data: [
        { name: 'Piano Lesson', id: '3', description: 'Weekly piano lesson', time: '02:00 PM', points: 20, complete: false, category: 'Practice' },
        { name: 'Soccer Game', id: '4', description: 'Home game vs. Eagles', time: '05:00 PM', points: 30, complete: false, category: 'Game' },
      ],
    },
    {
      title: '2025-11-01',
      data: [
        { name: 'Swimming Practice', id: '5', description: 'Evening swim practice', time: '05:30 PM', points: 15, complete: false, category: 'Practice' },
        { name: 'Basketball Practice', id: '6', description: 'Morning practice session', time: '10:00 AM', points: 20, complete: true, category: 'Practice' },
      ],
    },
  ]);

  const [modal, setModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TaskItem | null>(null);

  const toggleComplete = (date: string, itemId: string) => {
    setItems(prevItems =>
      prevItems.map(section => {
        if (section.title === date) {
          return {
            ...section,
            data: section.data.map(item =>
              item.id === itemId ? { ...item, complete: !item.complete } : item
            ),
          };
        }
        return section;
      })
    );
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

  // Calendar theme that adapts to dark/light mode - matches parent calendar
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
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    'stylesheet.calendar.header': {
      week: {
        marginTop: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 5,
        paddingRight: 5,
        marginBottom: 0,
        backgroundColor: calendarBg,
        paddingTop: 10,
        paddingBottom: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0,
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
        marginBottom: 12,
        width: 32,
        textAlign: 'center',
        color: colors.text,
        fontFamily: 'monospace',
        fontSize: 12,
      },
    },
    'stylesheet.calendar.main': {
      container: {
        paddingLeft: 5,
        paddingRight: 5,
        backgroundColor: calendarBg,
        borderTopWidth: 0,
        borderBottomWidth: 0,
      },
      week: {
        backgroundColor: calendarBg,
        marginTop: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
      },
      weekContainer: {
        backgroundColor: calendarBg,
      },
      dayContainer: {
        backgroundColor: calendarBg,
      },
    },
    'stylesheet.day.single': {
      base: {
        marginTop: 4,
        backgroundColor: calendarBg,
      },
    },
    'stylesheet.agenda.list': {
      container: {
        backgroundColor: calendarBg,
      },
      knob: {
        backgroundColor: calendarBg,
      },
      knobContainer: {
        backgroundColor: calendarBg,
      },
      weekday: {
        backgroundColor: calendarBg,
      },
      reservation: {
        backgroundColor: calendarBg,
      },
    },
    'stylesheet.week': {
      container: {
        backgroundColor: calendarBg,
      },
      week: {
        backgroundColor: calendarBg,
      },
      weekContainer: {
        backgroundColor: calendarBg,
      },
      dayContainer: {
        backgroundColor: calendarBg,
      },
    },
    'stylesheet.day.basic.marked': {
      backgroundColor: calendarBg,
    },
    'stylesheet.day.period': {
      base: {
        backgroundColor: calendarBg,
      },
      selected: {
        backgroundColor: calendarBg,
      },
    },
    'stylesheet.calendar-list.container': {
      backgroundColor: calendarBg,
    },
    'stylesheet.calendar-list.week': {
      container: {
        backgroundColor: calendarBg,
      },
      dayText: {
        backgroundColor: calendarBg,
      },
    },
  };

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

  // Helper function to check if a date is in the visible week
  const isDateInVisibleWeek = (dateString: string, weekStartDate: string): boolean => {
    const [year, month, day] = weekStartDate.split('-').map(Number);
    const weekStart = new Date(year, month - 1, day);
    
    // Calculate the end of the week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Parse the date to check
    const [checkYear, checkMonth, checkDay] = dateString.split('-').map(Number);
    const checkDate = new Date(checkYear, checkMonth - 1, checkDay);
    
    // Check if the date is within the week range
    return checkDate >= weekStart && checkDate <= weekEnd;
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

  // Get current month and year based on selected date (updates when date changes)
  const currentMonthName = (() => {
    const [year, month] = currentDate.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })();

  // Get tasks for selected date and sort them
  const todayAgenda = items.filter(section => section.title === currentDate);
  const todayTasks = todayAgenda.length > 0 ? todayAgenda[0].data : [];
  
  const sortedTasks = useMemo(() => {
    const tasks = [...todayTasks];
    
    if (sortBy === 'type') {
      return tasks.sort((a, b) => {
        // First sort by category
        const categoryA = a.category || 'Event';
        const categoryB = b.category || 'Event';
        if (categoryA !== categoryB) {
          return categoryA.localeCompare(categoryB);
        }
        // If same category, sort by time
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
    } else if (sortBy === 'points') {
      // Sort by points (highest to lowest)
      return tasks.sort((a, b) => b.points - a.points);
    } else {
      // Sort by time (default)
      return tasks.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    }
  }, [todayTasks, sortBy]);

  return (
    <CalendarProvider date={visibleWeekDate} style={{ backgroundColor: colors.background }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {/* Header with Pet, Month/Year, and Navigation */}
          <View
            style={[
              styles.headerContainer,
              { backgroundColor: colors.background },
            ]}
          >
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
              <TouchableOpacity
                style={[
                  styles.navButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  isSwipingRef.current = true;
                  lastSwipeTimeRef.current = Date.now(); // Record when navigation occurred
                  const [year, month, day] = visibleWeekDate.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  date.setDate(date.getDate() - 7);
                  setVisibleWeekDate(date.toISOString().split('T')[0]);
                  // Reset swipe flag after a delay
                  setTimeout(() => {
                    isSwipingRef.current = false;
                  }, 1000);
                }}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  isSwipingRef.current = true;
                  lastSwipeTimeRef.current = Date.now(); // Record when navigation occurred
                  const [year, month, day] = visibleWeekDate.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  date.setDate(date.getDate() + 7);
                  setVisibleWeekDate(date.toISOString().split('T')[0]);
                  // Reset swipe flag after a delay
                  setTimeout(() => {
                    isSwipingRef.current = false;
                  }, 1000);
                }}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Week Calendar */}
          <View 
            style={[
              styles.calendarWrapper, 
              { 
                backgroundColor: colors.background,
                ...noShadow,
              }
            ]}
          >
            {/* Horizontal line above calendar */}
            <View style={[styles.calendarLine, styles.calendarLineTop, { backgroundColor: colors.border }]} />
            <WeekCalendar
              key={`week-calendar-${isDarkMode ? 'dark' : 'light'}-${colors.background}`}
              current={visibleWeekDate}
              onDayPress={(day) => {
                // Only update selected date on explicit click, not during swipe or immediately after navigation
                const now = Date.now();
                const timeSinceLastSwipe = now - lastSwipeTimeRef.current;
                
                // Ignore if we're currently swiping OR if a swipe happened recently (within 1 second)
                if (!isSwipingRef.current && timeSinceLastSwipe > 1000) {
                  setCurrentDate(day.dateString);
                  // Update visible week to show the selected date's week
                  setVisibleWeekDate(day.dateString);
                } else {
                  // If we're swiping or just swiped, ignore this auto-selection
                  // Reset the flag after a delay
                  setTimeout(() => {
                    isSwipingRef.current = false;
                  }, 100);
                }
              }}
              onMonthChange={(month) => {
                // When swiping to a new week/month, update visible week but keep selected date the same
                isSwipingRef.current = true;
                lastSwipeTimeRef.current = Date.now(); // Record when the swipe occurred
                // Find the first Monday of the month's week view
                const date = new Date(month.year, month.month - 1, 15); // Use middle of month for calculation
                // Get the Monday of the week containing this date (firstDay is 1 for Monday)
                const dayOfWeek = date.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                date.setDate(date.getDate() + mondayOffset);
                const newVisibleWeek = date.toISOString().split('T')[0];
                
                // Only update if it's different to avoid unnecessary renders
                if (newVisibleWeek !== visibleWeekDate) {
                  setVisibleWeekDate(newVisibleWeek);
                }
                
                // Reset swipe flag after animation completes
                setTimeout(() => {
                  isSwipingRef.current = false;
                }, 1000);
              }}
              markedDates={{
                // Mark currentDate as selected if it's in the visible week
                // This ensures the date showing tasks is always circled when visible
                ...(isDateInVisibleWeek(currentDate, visibleWeekDate) ? {
                  [currentDate]: {
                    selected: true,
                    marked: true,
                    selectedColor: colors.primary,
                    customStyles: {
                      container: {
                        backgroundColor: colors.primary,
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      text: {
                        color: buttonTextColor,
                      },
                    },
                  },
                } : {}),
              }}
              theme={calendarTheme}
              style={[
                styles.calendar, 
                { 
                  backgroundColor: calendarBg,
                  ...noShadow,
                }
              ]}
              hideExtraDays={false}
              firstDay={1}
              enableSwipeMonths={true}
              hideArrows={true}
              allowShadow={false}
            />
            {/* Horizontal line below calendar */}
            <View style={[styles.calendarLine, styles.calendarLineBottom, { backgroundColor: colors.border }]} />
          </View>

          {/* Tasks Section */}
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
                const [year, month, day] = currentDate.split('-').map(Number);
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
          onRequestClose={() => {
            setModal(!modal);
          }}
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
                      toggleComplete(currentDate, selectedItem.id);
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
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarWrapper: {
    overflow: 'visible',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    opacity: 1,
    position: 'relative',
    paddingBottom: 8,
    paddingTop: 16,
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
