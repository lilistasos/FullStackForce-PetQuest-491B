import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image, ScrollView, Pressable, Modal, TextInput, Animated, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";

// API URL helper function
const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return __DEV__ ? "http://10.0.2.2:4000" : "http://10.0.2.2:4000";
  } else if (Platform.OS === 'ios') {
    return __DEV__ ? "http://localhost:4000" : "http://localhost:4000";
  } else {
    return "http://localhost:4000";
  }
};

const API_URL = getApiUrl();

type Task = {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  description: string;
  points: number;
  assignedTo: string;
  childName: string;
  childEmail: string;
  date: string;
  time: string;
};

const ParentTaskScreen = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  // Current Date State
  const [currentDate, setCurrentDate] = useState(new Date());

  // UI States
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editText, setEditText] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPoints, setEditPoints] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Fetch tasks from backend
  const fetchParentTasks = async () => {
    console.log('Current auth state:', { 
      hasUser: !!user, 
      hasToken: !!token,
      userRole: user?.role,
      tokenLength: token?.length 
    });

    if (!token) {
      setDebugInfo('No auth token available');
      setLoading(false);
      return;
    }

    if (!user || user.role !== 'parent') {
      setDebugInfo('User not authenticated as parent');
      setLoading(false);
      return;
    }

    try {
      setDebugInfo('Fetching tasks from API...');
      console.log('Making API call to:', `${API_URL}/api/parent/my-tasks`);
      
      const response = await fetch(`${API_URL}/api/parent/my-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('API Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const tasksData = await response.json();
        console.log('Tasks fetched successfully:', tasksData.length, 'tasks');
        setTasks(tasksData);
        setDebugInfo(`Loaded ${tasksData.length} tasks`);
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        setDebugInfo(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error('Network error fetching tasks:', error);
      setDebugInfo(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (token && user) {
        fetchParentTasks();
      } else {
        setLoading(false);
        setDebugInfo('Not authenticated - please log in');
      }
    }
  }, [authLoading, token, user]);

  // Format date for comparison (YYYY-MM-DD)
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get tasks for the current selected date
  const getTasksForCurrentDate = () => {
    const formattedKey = formatDateKey(currentDate);
    return tasks.filter(task => {
      if (!task.date || task.date === 'No Date') return false;
      const taskDate = task.date.split('T')[0];
      return taskDate === formattedKey;
    });
  };

  const currentDateTasks = getTasksForCurrentDate();

  // Change date function
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  // Date display
  const weekday = currentDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = currentDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const year = currentDate.getFullYear();

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!token || !taskToDelete) {
      console.error('No auth token or task to delete');
      return;
    }

    try {
      console.log('Deleting task:', taskToDelete.id, taskToDelete.text);
      
      const response = await fetch(`${API_URL}/api/parent/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('Task deleted successfully');
        // Remove task from local state
        setTasks(prev => prev.filter(task => task.id !== taskToDelete.id));
        setDeleteModal(false);
        setTaskToDelete(null);
      } else {
        console.error('Failed to delete task:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (task: Task) => {
    console.log('Showing delete confirmation for task:', task.text);
    setTaskToDelete(task);
    setDeleteModal(true);
  };

  // Handle task edit
  const handleEditSave = async () => {
    if (!taskToEdit || !token) {
      console.error('No task to edit or auth token missing');
      return;
    }

    try {
      const updateData = {
        title: editText,
        description: editDescription,
        points: parseInt(editPoints) || 0,
        category: editCategory,
        dueDate: taskToEdit.date ? `${taskToEdit.date}T12:00:00Z` : null,
      };
      
      console.log('Updating task:', taskToEdit.id);

      const response = await fetch(`${API_URL}/api/parent/tasks/${taskToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === taskToEdit.id 
            ? { 
                ...task, 
                text: editText, 
                description: editDescription, 
                points: parseInt(editPoints) || 0,
                category: editCategory
              }
            : task
        ));
        setEditModal(false);
        setTaskToEdit(null);
        console.log('Task updated successfully');
      } else {
        console.error('Failed to update task:', response.status);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handlePressTask = (taskId: string) => {
    setShowDetails((prev) => (prev === taskId ? null : taskId));
  };

  // Refresh tasks
  const handleRefresh = () => {
    setLoading(true);
    setDebugInfo('Refreshing...');
    fetchParentTasks();
  };

  // Categories for organization
  const categories = [
    { id: "Homework", title: "Homework" },
    { id: "Chores", title: "Chores" },
    { id: "Extracurriculars", title: "Extracurriculars" },
    { id: "Practice", title: "Practice"},
    { id: "Appointments", title: "Appointments"},
    { id: "Other", title: "Other" },
    { id: "Completed", title: "Completed" },
  ];

  const renderCategory = (category: { id: string; title: string }) => {
    const categoryTasks = currentDateTasks.filter((t) => t.category === category.id);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{category.title}</Text>
          <Text style={styles.taskCount}>({categoryTasks.length})</Text>
        </View>

        <View style={styles.taskList}>
          {categoryTasks.length > 0 ? (
            categoryTasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={{flex: 1, flexDirection: "column", marginLeft: 8}}>
                  <Pressable onPress={() => handlePressTask(task.id)}>
                    <Text style={styles.taskText}>
                      <Ionicons
                        name={showDetails === task.id ? "chevron-down" : "chevron-forward"}
                        size={16}
                        color="gray"
                        style={{marginRight: 6}}
                      />
                      {task.text}
                      <Text style={styles.assignedToText}> → {task.childName}</Text>
                    </Text>
                  </Pressable>
                  
                  {showDetails === task.id && (
                    <View style={{marginTop: 4}}>
                      <Text style={styles.detailText}>Description: {task.description}</Text>
                      <Text style={styles.detailText}>Points: {task.points}</Text>
                      <Text style={styles.detailText}>Assigned to: {task.childName}</Text>
                      <Text style={styles.detailText}>Due: {task.date} at {task.time}</Text>
                      
                      <View style={styles.buttonRow}>
                        <TouchableOpacity 
                          onPress={() => {
                            setTaskToEdit(task);
                            setEditText(task.text);
                            setEditDescription(task.description);
                            setEditPoints(task.points.toString());
                            setEditCategory(task.category);
                            setEditModal(true);
                          }} 
                          style={styles.editButton}
                        >
                          <Text style={{ color: "white" }}>Edit</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          onPress={() => showDeleteConfirmation(task)} 
                          style={styles.deleteButton}
                        >
                          <Text style={{ color: "white" }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No tasks yet</Text>
          )}
        </View>
      </View>
    );
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Checking authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Please log in to view tasks</Text>
          <Text style={styles.warningText}>Not authenticated</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (user.role !== 'parent') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Access Denied</Text>
          <Text style={styles.warningText}>This screen is for parents only</Text>
          <Text>Your role: {user.role}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading tasks...</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Parent Task View</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#0077B6" />
        </TouchableOpacity>
      </View>

      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>{debugInfo}</Text>
        <Text style={styles.debugText}>Date: {formatDateKey(currentDate)} | Total: {tasks.length} | Today: {currentDateTasks.length}</Text>
      </View>

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Image
            source={{ uri: user.profileImageUri || "https://cdn-icons-png.flaticon.com/512/1067/1067840.png" }}
            style={styles.avatar}
          />

          <View style={styles.dateSection}>
            <Text style={styles.weekday}>{weekday}</Text>
            <Text style={styles.monthDay}>{monthDay},</Text>
            <Text style={styles.year}>{year}</Text>
          </View>

          <View style={styles.arrowContainer}>
            <TouchableOpacity onPress={() => changeDate(-1)}>
              <Ionicons name="chevron-back" size={26} color="#0077B6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeDate(1)}>
              <Ionicons name="chevron-forward" size={26} color="#0077B6" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Total Tasks: {tasks.length} | Today: {currentDateTasks.length}
        </Text>
      </View>

      {/* Task Categories */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderCategory(item)}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={loading}
        onRefresh={handleRefresh}
      />

      {/* Edit Task Modal */}
      <Modal visible={editModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TextInput 
              placeholder="Task name" 
              value={editText} 
              onChangeText={setEditText} 
              style={styles.input} 
            />
            <TextInput 
              placeholder="Description" 
              value={editDescription} 
              onChangeText={setEditDescription} 
              style={styles.input} 
            />
            <TextInput 
              placeholder="Points" 
              keyboardType="numeric" 
              value={editPoints} 
              onChangeText={setEditPoints} 
              style={styles.input} 
            />
            <TextInput 
              placeholder="Category" 
              value={editCategory} 
              onChangeText={setEditCategory} 
              style={styles.input} 
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={() => setEditModal(false)} style={styles.cancelButton}>
                <Text style={{ color: "white" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditSave} style={styles.saveButton}>
                <Text style={{ color: "white" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Delete Task</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{taskToDelete?.text}"?
            </Text>
            <Text style={styles.deleteModalSubtext}>
              This task is assigned to {taskToDelete?.childName} and cannot be undone.
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                onPress={() => {
                  setDeleteModal(false);
                  setTaskToDelete(null);
                }} 
                style={styles.cancelButton}
              >
                <Text style={{ color: "white" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmDeleteButton} 
                onPress={handleDeleteTask}
              >
                <Text style={{ color: "white" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
  },
  topTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },
  header: {
    marginTop: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  dateSection: {
    alignItems: "center",
    flex: 1,
  },
  weekday: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  monthDay: {
    fontSize: 18,
    color: "#333",
  },
  year: {
    fontSize: 18,
    color: "#333",
  },
  arrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statsContainer: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  statsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  debugContainer: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  taskCount: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  taskList: {
    paddingLeft: 8,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 6,
  },
  taskText: {
    fontSize: 16,
    color: "#333",
  },
  assignedToText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  detailText: {
    color: "#555",
    marginBottom: 4,
  },
  emptyText: {
    fontStyle: "italic",
    color: "#aaa",
    marginLeft: 8,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: "#0077B6",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#FF0000",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBox: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  deleteModalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#FF0000",
  },
  deleteModalText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  deleteModalSubtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    width: "100%",
    marginBottom: 8,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#888",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#0077B6",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  confirmDeleteButton: {
    backgroundColor: "#FF0000",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    color: "#0077B6",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  warningText: {
    color: '#FF6B35',
    fontSize: 12,
  },
});

export default ParentTaskScreen;
