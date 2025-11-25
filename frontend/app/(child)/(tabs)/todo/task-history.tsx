//import React from "react";
import { useTasks, Task as TaskType } from "@/contexts/TaskContext";
import React, { useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal } from "react-native";

export default function TaskHistoryScreen() {
    const {tasks} = useTasks();
    const completed = tasks.filter((t: TaskType) => t.completed);
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
        <View style={{flex: 1, padding: 16, backgroundColor: 'white'}}>

            {showDetails && (
                <Modal
                visible={modal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModal(false)}>
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
                        <View style={{borderRadius: 16, padding: 24, alignItems: 'center', minWidth: '80%', maxWidth: '90%'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 8}}>
                                <Text>{showDetails.text}</Text>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        <FlatList
        data={completed}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        />
        </View>
    );
    
}
