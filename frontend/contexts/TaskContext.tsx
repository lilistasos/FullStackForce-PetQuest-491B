import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getApiUrl } from '@/utils/api';

export type Task = {
  id: string | number;
  text: string;
  completed: boolean;
  category: string;
  originalCategory?: string; // Original category before completion (for restoring when uncompleting)
  description: string;
  points: number;
  dueDate: string;
  assignedTo?: string; // child name (for backward compatibility)
  assignedBy?: string; // parent name (for backward compatibility)
  assignedToUserId?: number; // child user ID
  assignedByUserId?: number; // parent user ID
  assignedToName?: string; // child name from backend
  assignedByName?: string; // parent name from backend
  createdAt: string;
};

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => Promise<void>;
  toggleComplete: (taskId: string | number) => Promise<void>;
  getTasksByChild: (childName: string) => Task[];
  refreshTasks: () => Promise<void>;
  loading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();
  const previousTaskIdsRef = useRef<Set<string>>(new Set());

  // Load tasks from backend on mount and when token/user changes
  const loadTasks = async () => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    try {
      const apiUrl = getApiUrl();
      console.log('TaskContext: Loading tasks from API URL:', `${apiUrl}/api/tasks`);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${apiUrl}/api/tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform backend data to match frontend Task type
      // Preserve original category (don't overwrite if already set from previous load)
      const transformedTasks: Task[] = data.map((task: any) => {
        // Find existing task to preserve originalCategory if it exists
        const existingTask = tasks.find(t => t.id.toString() === task.id.toString());
        // If task already has originalCategory (from previous load), preserve it
        // Otherwise, set it to the current category so we know where to restore it
        const originalCategory = existingTask?.originalCategory || task.category;
        
        return {
          id: task.id.toString(),
          text: task.text,
          completed: task.completed,
          category: task.category,
          originalCategory: originalCategory, // Preserve original category for when uncompleting
          description: task.description || '',
          points: task.points || 0,
          dueDate: task.dueDate,
          assignedToUserId: task.assignedToUserId,
          assignedByUserId: task.assignedByUserId,
          assignedTo: task.assignedToName || task.assignedTo,
          assignedBy: task.assignedByName || task.assignedBy,
          assignedToName: task.assignedToName,
          assignedByName: task.assignedByName,
          createdAt: task.createdAt,
        };
      });

      // Update previous task IDs
      previousTaskIdsRef.current = new Set(transformedTasks.map(t => t.id.toString()));
      setTasks(transformedTasks);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      if (error.name === 'AbortError') {
        console.error('TaskContext: Request timed out after 10 seconds');
      }
      // Don't throw - just log and continue with empty tasks
      setTasks([]); // Set empty tasks on error so app doesn't hang
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  const refreshTasks = async () => {
    await loadTasks();
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const apiUrl = getApiUrl();
      
      // If assignedToUserId is not provided, we need to find it by name
      // This is for backward compatibility with existing code that uses childName
      let assignedToUserId = taskData.assignedToUserId;
      
      if (!assignedToUserId && taskData.assignedTo && user?.role === 'parent') {
        // Fetch children to find the user ID by name
        const childrenResponse = await fetch(`${apiUrl}/api/users/children`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (childrenResponse.ok) {
          const children = await childrenResponse.json();
          const child = children.find((c: any) => c.firstName === taskData.assignedTo);
          if (child) {
            assignedToUserId = child.id;
          } else {
            throw new Error(`Child "${taskData.assignedTo}" not found`);
          }
        }
      }

      if (!assignedToUserId) {
        throw new Error('assignedToUserId is required');
      }

      const response = await fetch(`${apiUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: taskData.text,
          category: taskData.category,
          description: taskData.description || '',
          points: taskData.points || 0,
          dueDate: taskData.dueDate,
          assignedToUserId: assignedToUserId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create task');
      }

      const newTask = await response.json();
      
      // Transform and add to local state
      const transformedTask: Task = {
        id: newTask.id.toString(),
        text: newTask.text,
        completed: newTask.completed,
        category: newTask.category,
        description: newTask.description || '',
        points: newTask.points || 0,
        dueDate: newTask.dueDate,
        assignedToUserId: newTask.assignedToUserId,
        assignedByUserId: newTask.assignedByUserId,
        assignedTo: newTask.assignedToName || taskData.assignedTo,
        assignedBy: newTask.assignedByName || taskData.assignedBy,
        assignedToName: newTask.assignedToName,
        assignedByName: newTask.assignedByName,
        createdAt: newTask.createdAt,
      };

      setTasks((prevTasks) => [...prevTasks, transformedTask]);
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const toggleComplete = async (taskId: string | number) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const task = tasks.find(t => t.id.toString() === taskId.toString());
    if (!task) {
      throw new Error('Task not found');
    }

    const newCompletedState = !task.completed;

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          completed: newCompletedState,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update task');
      }

      const updatedTask = await response.json();
      
      // Update local state
      // When completing, preserve original category
      // When uncompleting, restore original category
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.id.toString() === taskId.toString()) {
            // If originalCategory is not set, use current category as original
            // This ensures we know where to restore the task when uncompleting
            const originalCategory = t.originalCategory || t.category;
            return {
              ...t,
              completed: updatedTask.completed,
              originalCategory: originalCategory, // Always preserve original category for restoration
              // Note: The category field from backend stays as-is, we handle display logic in the UI
            };
          }
          return t;
        })
      );
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  };

  const getTasksByChild = (childName: string) => {
    // Filter by child name (for backward compatibility)
    return tasks.filter((task) => {
      return task.assignedTo === childName || 
             task.assignedToName === childName ||
             (user?.role === 'child' && user?.firstName === childName);
    });
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, toggleComplete, getTasksByChild, refreshTasks, loading }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
