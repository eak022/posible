import { createContext, useContext, useState, useEffect } from "react";
import { orderService } from "../services";

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState([]);

  // Cache ข้อมูลเป็นเวลา 3 นาที
  const CACHE_DURATION = 3 * 60 * 1000; // 3 นาที

  // ฟังก์ชันดึงข้อมูลคำสั่งซื้อแบบ Cached
  const fetchOrders = async (forceRefresh = false) => {
    const now = Date.now();
    
    // ถ้าไม่บังคับ refresh และข้อมูลยังไม่หมดอายุ ให้ใช้ข้อมูลเดิม
    if (!forceRefresh && orders.length > 0 && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      console.log("📦 ใช้ข้อมูลคำสั่งซื้อจาก Cache");
      return orders;
    }

    try {
      setLoading(true);
      console.log("🔄 ดึงข้อมูลคำสั่งซื้อใหม่จาก API");
      
      const response = await orderService.getOrders();
      
      // ดึงสถานะและวิธีการชำระเงินที่ไม่ซ้ำกัน
      const uniqueStatuses = [...new Set(response.map(order => order.orderStatus))];
      const uniquePayments = [...new Set(response.map(order => order.paymentMethod))];
      
      setStatusOptions(uniqueStatuses);
      setPaymentOptions(uniquePayments);
      setOrders(response);
      setLastFetch(now);
      
      return response;
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันกรองคำสั่งซื้อตามเงื่อนไข
  const filterOrders = (filters = {}) => {
    let result = [...orders];

    // กรองตามสถานะ
    if (filters.status && filters.status !== "ทั้งหมด") {
      result = result.filter(order => order.orderStatus === filters.status);
    }

    // กรองตามวันที่
    if (filters.startDate && filters.endDate) {
      result = result.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= filters.startDate && orderDate <= filters.endDate;
      });
    }

    // กรองตามวิธีการชำระเงิน
    if (filters.payment && filters.payment !== "ทั้งหมด") {
      result = result.filter(order => order.paymentMethod === filters.payment);
    }

    // กรองตามคำค้นหา
    if (filters.searchTerm) {
      result = result.filter(order => {
        const orderId = order._id.toLowerCase();
        const searchTerm = filters.searchTerm.toLowerCase();
        
        // ค้นหาจาก order ID
        if (orderId.includes(searchTerm)) return true;
        
        // ค้นหาจาก order number (ถ้ามี generateOrderNumber function)
        try {
          // สร้าง order number แบบเดียวกับที่ใช้ในระบบ
          const orderNumber = `ORD${order._id.slice(-8).toUpperCase()}`;
          if (orderNumber.toLowerCase().includes(searchTerm)) return true;
        } catch (e) {
          // ถ้าเกิด error ให้ข้าม
        }
        
        return false;
      });
    }

    return result;
  };

  // ฟังก์ชันอัพเดทคำสั่งซื้อใน state
  const updateOrder = (orderId, updates) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId ? { ...order, ...updates } : order
      )
    );
  };

  // ฟังก์ชันเพิ่มคำสั่งซื้อใหม่
  const addOrder = (newOrder) => {
    setOrders(prevOrders => [newOrder, ...prevOrders]);
  };

  // ฟังก์ชันลบคำสั่งซื้อ
  const removeOrder = (orderId) => {
    setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
  };

  // โหลดข้อมูลเมื่อเริ่มต้น
  useEffect(() => {
    fetchOrders();
  }, []);

  const value = {
    orders,
    loading,
    statusOptions,
    paymentOptions,
    fetchOrders,
    filterOrders,
    updateOrder,
    addOrder,
    removeOrder,
    lastFetch
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => useContext(OrderContext);
