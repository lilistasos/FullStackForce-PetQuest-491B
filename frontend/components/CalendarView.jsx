// components/CalendarView.js
import React, {useState, useCallback} from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar, WeekCalendar, CalendarProvider, Agenda, AgendaList } from "react-native-calendars";
import {Card, Text, Avatar } from "react-native-paper"

export default function CalendarView() {
  
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(() => new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0]);

 
  const [items, setItems] = useState([{
    title: '2025-10-21', data: [{name: "Meeting", description: "Meeting with friend", time: "10:00 am", points: 15},
      {name: "Lunch", time:"12:00", points: 10},
    ],},
    {
      title: '2025-10-22', data: [{name: "Study", description: "study for test", time: "12:00 pm", points: 30},
        {name: "HW", description: "Do math hw", time: "4:00 pm", points: 20}
      ],
    },
  ]);
 
  const [isExpanded, setExpanded] = useState({});
  const todayAgenda = items.filter(section => section.title === currentDate);


  const toggle = useCallback((name) => {
    setExpanded((prev) => ({
      ...prev, [name]: !prev[name],
    }));
  }, []);
 
  const renderItem = React.useCallback(({item}) => {
    console.log("renderItem: ", item);
     return (
      <View>
      <TouchableOpacity style={styles.item} onPress={() => toggle(item.name)}>
        <Card>
          <Card.Content>
            <View style={styles.row}>
              <Text>{item.name}</Text>
              {/* <Avatar.Text label={item.name ? item.name[0]?.toUpperCase() : "?"}/> */}
              <Text>{item.time}</Text>
              {/* {item.data.map((data, index) => (
                <Text key={index}>{'${data.name} - {data.time}'}</Text>
              ))} */}
            </View>
            {/* <Text>{item.time}</Text> */}
          </Card.Content>
        </Card>
      </TouchableOpacity>
     
      { isExpanded[item.name] && (
        <View style={{padding: 10, backgroundColor: '#f0f0f0'}}>
        <Text>{item.description}</Text>
        <Text>Points: {item.points}</Text>
        </View>
      )} 
     </View>
     );
}, [isExpanded, toggle]);


  const onDateChanged = () => {
    console.log("onDateChanged");
  }
  return (
   
   
    <CalendarProvider date={currentDate}>
      <WeekCalendar
        current={currentDate}
        onDayPress={(day) => {console.log("Selected day", day); setCurrentDate(day.dateString);}}
        markedDates={{
          [currentDate]: { selected: true, marked: true, selectedColor: "#52AFDD" },
        }}
        theme={{
          todayTextColor: "#52AFDD",
          selectedDayBackgroundColor: "#52AFDD",
        }} />
       
        <View style={styles.line}/>
        { todayAgenda.length > 0 ? (
          <AgendaList
          sections={items.filter(section => section.title === currentDate)}
          renderItem={renderItem}
        />
        ) : (
          <View>
            <Text style={{textAlign: 'center'}}>No tasks for today</Text>
          </View>
        )}
        
       
    </CalendarProvider>
   
  );
}


const styles = StyleSheet.create({
    item: {
      backgroundColor: 'white',
      flex: 1,
      borderRadius:5,
      padding:10,
      marginRight:10,
      marginTop:17
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    line: {
      height: 1,
      backgroundColor: '#D3D3D3',
      width: '100%',
    }
  });
