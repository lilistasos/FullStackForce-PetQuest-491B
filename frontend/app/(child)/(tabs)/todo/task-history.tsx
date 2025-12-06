//import React from "react";
import { useTasks, Task as TaskType } from "@/contexts/TaskContext";
import React, { useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { getApiUrl } from '@/utils/api';

export default function TaskHistoryScreen() {
    const {getTasksByChild, tasks: contextTasks, refreshTasks, loading: tasksLoading} = useTasks();
    const completed = contextTasks.filter((t: TaskType) => t.completed);
    const [showDetails, setShowDetails] = useState<TaskType | null>(null);
    const [modal, setModal] = useState(false);

    const handlePress = ({item}: {item: TaskType}) => {
        setShowDetails(item);
        setModal(true);
    }

    const renderItem = ({item}: {item: TaskType}) => {
        return (
        <TouchableOpacity onPress={() => handlePress({item})}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{fontSize: 16}}>{item.text}</Text>
                <Text style={{fontSize: 16}}>{item.points} pts</Text>
            </View>
        </TouchableOpacity>
        );
    };

    const deleteTask = async (taskId : string | number) => {
        const apiUrl = getApiUrl();
        try {
            const response = await fetch(`${apiUrl}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        }
        catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    const clearHistory = () => {
        completed.forEach((task) => {
            deleteTask(task.id);
        })
    }

    if (completed.length === 0) {
        return (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{fontSize: 16, color: 'black'}}>No tasks completed yet</Text>
            </View>
        )
    }

    return (
        <View style={{flex: 1, padding: 16, backgroundColor: 'white'}}>
            <Modal
            visible={modal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModal(false)}>
            <View style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
            {showDetails && (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
                    <View style={{borderRadius: 16, padding: 24, alignItems: 'center', minWidth: '80%', maxWidth: '90%', backgroundColor: 'white'}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 8}}>
                            <Text>{showDetails.text}</Text>
                        </View>
                        <Text>Description: {showDetails.description}</Text>
                        <Text>Due: {showDetails.dueDate}</Text>
                        <Text>Assigned By: {showDetails.assignedBy}</Text>
                        <Text>Completed At: </Text>
                        <View style={{marginTop: 16, alignItems: 'center', justifyContent: 'center'}}>
                            <TouchableOpacity onPress={() => setModal(false)} style={{backgroundColor: 'red', padding: 12, borderRadius: 8}}>
                                <Text style={{color: 'black', fontSize: 16}}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>      
            )}
            </View>
            </Modal>
        {completed.length === 0 ? (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{fontSize: 16, color: 'black'}}>No tasks completed yet</Text>
            </View>
        ) : (
        <FlatList
        data={completed}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        />
        )}
        <TouchableOpacity style={{alignItems: 'center', backgroundColor: 'red'}} onPress={() => clearHistory()}>
            <Text style={{color: 'black', fontSize: 20, padding: 12}}>Clear History</Text>
        </TouchableOpacity>
        </View>
        
    );
    
}
