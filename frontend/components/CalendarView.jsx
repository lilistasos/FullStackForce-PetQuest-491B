// components/CalendarView.js
import React from "react";
import { Calendar } from "react-native-calendars";

export default function CalendarView() {
  return (
    <Calendar
      onDayPress={(day) => console.log("Selected day", day)}
      markedDates={{
        "2025-10-06": { selected: true, marked: true, selectedColor: "#52AFDD" },
      }}
      theme={{
        todayTextColor: "#52AFDD",
        selectedDayBackgroundColor: "#52AFDD",
      }}
    />
  );
}
