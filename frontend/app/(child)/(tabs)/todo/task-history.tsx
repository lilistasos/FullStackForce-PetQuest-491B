//import React from "react";
import { useTasks, Task as TaskType } from "@/contexts/TaskContext";
import React, { useMemo } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";

export default function TaskHistoryScreen() {
    const {tasks} = useTasks();
    const completed = tasks.filter((t: TaskType) => t.completed);
    const renderItem = ({item}: {item: TaskType}) => {
        return (
        <TouchableOpacity>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{fontSize: 16}}>{item.text}</Text>
                <Text style={{fontSize: 16}}>{item.points}</Text>
            </View>
        </TouchableOpacity>
        );
    };

    if (completed.length === 0) {
        return (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{fontSize: 16, color: 'black'}}>No tasks completed yet</Text>
            </View>
        )
    }

    return (
        <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        />
    );
    
}
