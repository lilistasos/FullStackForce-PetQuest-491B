// components/CalendarView.js
import React, {useState, useCallback} from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar, WeekCalendar, CalendarProvider, Agenda, AgendaList } from "react-native-calendars";
import {Card, Text, Avatar } from "react-native-paper"


export default function CalendarView() {
  console.log("calendar");
  const [currentDate, setCurrentDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
 
  const [items, setItems] = useState([{
    title: '2025-10-19', data: [{name: "Meeting", description: "Meeting with friend", time: "10:00 am"}, 
      {name: "Lunch", time:"12:00"},
    ],},
    {
      title: '2025-10-20', data: [{name: "Study", description: "study for test", time: "12:00 pm"}],
    },
  ]);
  
  const renderItem = React.useCallback((item) => {
    console.log("renderItem: ", item);
     return (
      <TouchableOpacity style={styles.item}>
        <Card>
          <Card.Content>
            <View style={styles.row}>
              <Text>{item.name}</Text>
              <Avatar.Text label={item.name ? item.name[0]?.toUpperCase() : "?"}/>
              {/* {item.data.map((data, index) => (
                <Text key={index}>{'${data.name} - {data.time}'}</Text>
              ))} */}
            </View>
            {/* <Text>{item.time}</Text> */}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }, []);

  // const renderItem = useCallback((item) => {
  //   console.log("renderItem: ", item)
  //   return (
  //     <View>
  //       <Text>{item.name}</Text>
  //     </View>
  //   );
  // }, []);

  const onDateChanged = () => {
    console.log("onDateChanged");
  }
  return (
    

    // <Agenda
    //         items={items}
    //         loadItemsForMonth={loadItems}
    //         renderItem={renderItem}
    //         selected='2025-10-18'          
    //       />  
   
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
        
        {/* <Agenda
            items={items}
            //loadItemsForMonth={loadItems}
            //renderItem={renderItem}
            selected='2025-10-18'          
          />   */}
        <View style={styles.line}/>
        <AgendaList
          sections={items.filter(section => section.title === currentDate)}
          renderItem={({item}) => renderItem(item)}
        />
        
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
