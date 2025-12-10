import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTasks } from '@/contexts/TaskContext';
import { useAuth } from '@/hooks/useAuth';
import { useNewTask } from '@/contexts/NewTaskContext';

/**
 * Component that detects when new tasks are assigned to the child
 * and triggers the NewTaskPopup notification
 */
export default function NewTaskDetector() {
  const { tasks, refreshTasks, loading } = useTasks();
  const { user } = useAuth();
  const { showTasks } = useNewTask();
  const previousTaskIdsRef = useRef<Set<string>>(new Set());
  const shownTaskIdsRef = useRef<Set<string>>(new Set()); // Track tasks that have already been shown
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    // Only detect for child users
    if (user?.role !== 'child') {
      return;
    }

    // Skip if still loading initial tasks
    if (loading) {
      return;
    }

    // Wait until we have loaded tasks at least once (initial setup)
    if (isInitialLoadRef.current) {
      if (tasks.length >= 0) { // Changed to >= 0 to handle empty task lists too
        // First load - just store the IDs, don't show notifications
        // Also mark all existing tasks as already shown so they don't trigger popups
        const taskIds = tasks.map(t => t.id.toString());
        previousTaskIdsRef.current = new Set(taskIds);
        shownTaskIdsRef.current = new Set(taskIds);
        isInitialLoadRef.current = false;
      }
      return;
    }

    // After initial load, detect new tasks (not completed and not already shown)
    const newTasks = tasks.filter(
      t => !previousTaskIdsRef.current.has(t.id.toString()) && 
           !t.completed && 
           !shownTaskIdsRef.current.has(t.id.toString())
    );

    // Show notification for all new tasks
    if (newTasks.length > 0) {
      console.log('NewTaskDetector: Found', newTasks.length, 'new task(s)');
      
      // Sort by creation date (most recent first)
      const sortedNewTasks = newTasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log('NewTaskDetector: Showing notification for', sortedNewTasks.length, 'task(s)');

      try {
        // Convert all new tasks to the format expected by the popup
        const tasksToShow = sortedNewTasks.map(task => ({
          id: task.id.toString(),
          title: task.text,
          description: task.description || 'No description provided',
          assignedAt: task.createdAt,
          points: task.points || 0,
        }));
        
        showTasks(tasksToShow);
        console.log('NewTaskDetector: showTasks called successfully with', tasksToShow.length, 'task(s)');
      } catch (error) {
        console.error('NewTaskDetector: Error calling showTasks:', error);
      }
    }

    // Update previous task IDs
    previousTaskIdsRef.current = new Set(tasks.map(t => t.id.toString()));
  }, [tasks, user?.role, showTasks, loading]);

  // Refresh when app comes to foreground
  useEffect(() => {
    if (user?.role !== 'child') {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isInitialLoadRef.current) {
        refreshTasks();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.role, refreshTasks]);

  // Refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user?.role === 'child' && !isInitialLoadRef.current) {
        refreshTasks();
      }
    }, [user?.role, refreshTasks])
  );

  // Set up periodic refresh for child users (every 5 seconds for better responsiveness)
  useEffect(() => {
    if (user?.role !== 'child' || loading) {
      return;
    }

    // Wait for initial load to complete before starting periodic refresh
    if (isInitialLoadRef.current) {
      return;
    }

    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Refresh tasks periodically to catch new assignments
    refreshIntervalRef.current = setInterval(() => {
      refreshTasks();
    }, 30000); // 30 seconds to reduce load

    // Cleanup on unmount or when dependencies change
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user?.role, refreshTasks, loading]); // Removed tasks.length to prevent interval restart on every task change

  return null; // This component doesn't render anything
}

