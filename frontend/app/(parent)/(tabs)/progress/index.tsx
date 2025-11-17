import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";


type ChildProgress = {
    id: string;
    name: string;
    completed: number;
    total: number;
    tasks: { id: number; title: string; done: boolean }[];
  };
  
export default function ProgressScreen() {
    const [children, setChildren] = useState<ChildProgress[]>([]);

  const [loading, setLoading] = useState(true);

  // TEMP DATA until backend is ready
  const loadDummyData = () => {
    const sample = [
      {
        id: "child1",
        name: "Aiden",
        completed: 5,
        total: 8,
        tasks: [
          { id: 1, title: "Feed pet", done: true },
          { id: 2, title: "Brush pet", done: false },
        ],
      },
      {
        id: "child2",
        name: "Mila",
        completed: 2,
        total: 5,
        tasks: [
          { id: 1, title: "Play with pet", done: true },
          { id: 2, title: "Clean pet area", done: false },
        ],
      },
    ];
    setChildren(sample);
    setLoading(false);
  };

  useEffect(() => {
    // When backend is ready, REPLACE this:
    // fetch("http://your-backend/tasks/progress?parentId=123")
    //   .then(res => res.json())
    //   .then(setChildren)
    //   .finally(() => setLoading(false));

    loadDummyData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderChild = ({ item }: { item: ChildProgress }) => (

    <View style={styles.childCard}>
      <Text style={styles.childName}>{item.name}</Text>
      <Text style={styles.progressText}>
        {item.completed} / {item.total} tasks complete
      </Text>

      {/* Task list inside each child */}
      <View style={styles.taskList}>
        {item.tasks.map((t) => (
          <Text
            key={t.id}
            style={[styles.taskItem, t.done ? styles.done : styles.notDone]}
          >
            {t.title} — {t.done ? "✓" : "✗"}
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Child Progress</Text>
      <FlatList
        data={children}
        renderItem={renderChild}
        keyExtractor={(c) => c.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F7FAFC",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
  },
  childCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  childName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  progressText: {
    marginTop: 4,
    marginBottom: 8,
    color: "#555",
  },
  taskList: {
    marginTop: 8,
  },
  taskItem: {
    fontSize: 16,
    paddingVertical: 4,
  },
  done: { color: "green" },
  notDone: { color: "red" },
});
