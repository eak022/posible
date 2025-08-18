import { createContext, useContext, useState } from "react";

export const PurchaseOrderContext = createContext();

export const PurchaseOrderProvider = ({ children }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  return (
    <PurchaseOrderContext.Provider value={{ purchaseOrders, setPurchaseOrders }}>
      {children}
    </PurchaseOrderContext.Provider>
  );
};

export const usePurchaseOrder = () => useContext(PurchaseOrderContext); 