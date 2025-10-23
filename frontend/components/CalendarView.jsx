// components/CalendarView.js
import React, {useState, useCallback} from "react";
import { View, StyleSheet, TouchableOpacity, Button, Alert, Modal } from "react-native";
import { Calendar, WeekCalendar, CalendarProvider, AgendaList } from "react-native-calendars";
import {Card, Text, Avatar, Checkbox } from "react-native-paper"

export default function CalendarView() {
  
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(() => new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0]);

 
  const [items, setItems] = useState([{
    title: '2025-10-21', data: [{name: "Meeting", id: '1', description: "Meeting with friend", time: "10:00 am", points: 15, complete: false},
      {name: "Lunch", id: '2', time:"12:00", points: 10, complete: false},
    ],},
    {
      title: '2025-10-22', data: [{name: "Study", id: '3', description: "study for test", time: "12:00 pm", points: 30, complete: false},
        {name: "HW", id: '4', description: "Do math hw", time: "4:00 pm", points: 20, complete: false}
      ],
    },
  ]);
 
  const [isExpanded, setExpanded] = useState({});
  const todayAgenda = items.filter(section => section.title === currentDate);
  const [modal, setModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const toggleExpand = useCallback((name) => {
    setExpanded((prev) => ({
      ...prev, [name]: !prev[name],
    }));
  }, []);

  const toggleComplete = (date, itemId) => {
    setItems(prevItems => 
      prevItems.map(section => {
        if (section.title === date) {
          return {
            ...section,
            data: section.data.map(item => 
              item.id === itemId ? {...item, complete: !item.complete} : item
            ),
          };
        }
        return section;
      })
    );
  };
 {/*toggleExpand(item.name)*/}



  const renderItem = React.useCallback(({item}) => {
    console.log("renderItem: ", item);
     return (
      <View>
      <TouchableOpacity style={styles.item} onPress={() => {setSelectedItem(item); setModal(true);}}>
        <Card>
          <Card.Content>
            <View style={styles.row}>
              <Text style={{textDecorationLine: item.complete ? 'line-through': 'none'}}>{item.name}</Text>
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
     
        
      
     
      {/* { isExpanded[item.name] && (
        <View style={{padding: 10, backgroundColor: '#f0f0f0'}}>
        <Text>{item.description}</Text>
        <Text>Points: {item.points}</Text>
        <Button>
          title="Complete"
          onPress={() => {Alert.alert("Task Completed", "You have earned " + item.points + " points"); toggleComplete(currentDate, item.id);
            console.log(item.complete);
          }}
          color="#008000"
        </Button>
        </View>
      )}  */}


     </View>
     );
}, [isExpanded, setModal]);


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
        <Modal
          animationType="slide"
          transparent={true}
          visible={modal}
          onRequestClose={() => {
           setModal(!modal);
       }}
      >
      {selectedItem && (
       <View style={{flex:1, justifyContent:'center', alignItems:'center', marginTop:22}}>
         <View style={{backgroundColor:'white', padding:20, alignItems:'center'}}>
          <Text>{selectedItem.name}</Text>
          <Text>Description: {selectedItem.description}</Text>
          <Text>Points: {selectedItem.points}</Text>
          <TouchableOpacity style={{backgroundColor:"#FF0000"}} onPress={() => setModal(!modal)} >
            <Text>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{backgroundColor:"#008000"}} onPress={() => {Alert.alert("Task Completed", `You have earned ${selectedItem.points} + points `); toggleComplete(currentDate, selectedItem.id);
            console.log(selectedItem.complete);}}>
            <Text>Complete</Text>
          </TouchableOpacity>
        </View>

      </View>
      )}
        </Modal>
       
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
