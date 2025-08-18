import { createContext, useContext, useState } from "react";

export const PromotionContext = createContext();

export const PromotionProvider = ({ children }) => {
  const [promotions, setPromotions] = useState([]);
  return (
    <PromotionContext.Provider value={{ promotions, setPromotions }}>
      {children}
    </PromotionContext.Provider>
  );
};

export const usePromotion = () => useContext(PromotionContext); 