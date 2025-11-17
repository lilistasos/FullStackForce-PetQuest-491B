import React, { useEffect, useRef } from 'react';
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
      if (tasks.length > 0) {
        // First load - just store the IDs, don't show notifications
        previousTaskIdsRef.current = new Set(tasks.map(t => t.id.toString()));
        isInitialLoadRef.current = false;
        console.log('NewTaskDetector: Initial load complete, tracking', tasks.length, 'tasks');
      }
      return;
    }

    // After initial load, detect new tasks (not completed)
    const newTasks = tasks.filter(
      t => !previousTaskIdsRef.current.has(t.id.toString()) && !t.completed
    );

    // Show notification for the most recent new task
    if (newTasks.length > 0) {
      console.log('NewTaskDetector: Found', newTasks.length, 'new task(s)');
      
      // Get the most recently created task
      const latestNewTask = newTasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      console.log('NewTaskDetector: Showing notification for task:', latestNewTask.text);

      showTask({
        id: latestNewTask.id.toString(),
        title: latestNewTask.text,
        description: latestNewTask.description || 'No description provided',
        assignedAt: latestNewTask.createdAt,
      });
    }

    // Update previous task IDs
    previousTaskIdsRef.current = new Set(tasks.map(t => t.id.toString()));
  }, [tasks, user?.role, showTask, loading]);

  // Set up periodic refresh for child users (every 10 seconds for better responsiveness)
  useEffect(() => {
    if (user?.role !== 'child') {
      return;
    }

    // Wait for initial load to complete before starting periodic refresh
    if (isInitialLoadRef.current) {
      return;
    }

    // Refresh tasks periodically to catch new assignments
    refreshIntervalRef.current = setInterval(() => {
      console.log('NewTaskDetector: Periodic refresh triggered');
      refreshTasks();
    }, 10000); // 10 seconds for better responsiveness

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user?.role, refreshTasks, loading]);

  return null; // This component doesn't render anything
}

