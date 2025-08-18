import { createContext, useContext, useState } from "react";

export const StatusContext = createContext();

export const StatusProvider = ({ children }) => {
  const [statuses, setStatuses] = useState([]);
  return (
    <StatusContext.Provider value={{ statuses, setStatuses }}>
      {children}
    </StatusContext.Provider>
  );
};

export const useStatus = () => useContext(StatusContext); 