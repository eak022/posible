import { createContext, useContext, useState } from "react";

export const SupplierContext = createContext();

export const SupplierProvider = ({ children }) => {
  const [suppliers, setSuppliers] = useState([]);
  return (
    <SupplierContext.Provider value={{ suppliers, setSuppliers }}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSupplier = () => useContext(SupplierContext); 