// Parent chooses which child to create a task for

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const [selectedChild, setSelectedChild] = useState("");
const [taskName, setTaskName] = useState("");
const [category, setCategory] = useState("");
const [date, setDate] = useState("");
const [note, setNote] = useState("");

