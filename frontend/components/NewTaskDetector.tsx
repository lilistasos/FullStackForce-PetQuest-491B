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
  const { showTask } = useNewTask();
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

    // Show notification for the most recent new task
    if (newTasks.length > 0) {
      // Get the most recently created task
      const latestNewTask = newTasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      const taskId = latestNewTask.id.toString();
      
      // Mark this task as shown so it won't trigger again
      shownTaskIdsRef.current.add(taskId);

      try {
        showTask({
          id: taskId,
          title: latestNewTask.text,
          description: latestNewTask.description || 'No description provided',
          assignedAt: latestNewTask.createdAt,
        });
      } catch (error) {
        console.error('NewTaskDetector: Error calling showTask:', error);
      }
    }

    // Update previous task IDs
    previousTaskIdsRef.current = new Set(tasks.map(t => t.id.toString()));
  }, [tasks, user?.role, showTask, loading]);

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
    }, 5000); // 5 seconds for better responsiveness

    // Cleanup on unmount or when dependencies change
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user?.role, refreshTasks, loading, tasks.length]); // Add tasks.length to trigger when initial load completes

  return null; // This component doesn't render anything
}

