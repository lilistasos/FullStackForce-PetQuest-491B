import React, { createContext, useContext, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string;
  assignedAt: string;
  points: number;
};

type NewTaskContextProps = {
  newTasks: Task[];
  showTasks: (tasks: Task[]) => void;
  hideTasks: () => void;
};

const NewTaskContext = createContext<NewTaskContextProps>({
  newTasks: [],
  showTasks: () => {},
  hideTasks: () => {},
});

export const useNewTask = () => useContext(NewTaskContext);

export const NewTaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [newTasks, setNewTasks] = useState<Task[]>([]);

  const showTasks = (tasks: Task[]) => {
    console.log('NewTaskContext: showTasks called with:', tasks.length, 'task(s)');
    setNewTasks(tasks);
    console.log('NewTaskContext: newTasks state set to:', tasks);
  };

  const hideTasks = () => {
    setNewTasks([]);
  };

  return (
    <NewTaskContext.Provider value={{ newTasks, showTasks, hideTasks }}>
      {children}
    </NewTaskContext.Provider>
  );
};