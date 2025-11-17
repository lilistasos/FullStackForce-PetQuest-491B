import React, { createContext, useContext, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string;
  assignedAt: string;
};

type NewTaskContextProps = {
  newTask: Task | null;
  showTask: (task: Task) => void;
  hideTask: () => void;
};

const NewTaskContext = createContext<NewTaskContextProps>({
  newTask: null,
  showTask: () => {},
  hideTask: () => {},
});

export const useNewTask = () => useContext(NewTaskContext);

export const NewTaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [newTask, setNewTask] = useState<Task | null>(null);

  const showTask = (task: Task) => {
    setNewTask(task);
  };

  const hideTask = () => {
    setNewTask(null);
  };

  return (
    <NewTaskContext.Provider value={{ newTask, showTask, hideTask }}>
      {children}
    </NewTaskContext.Provider>
  );
};