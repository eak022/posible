import api from "./api";

const purchaseOrderService = {
    // สร้างใบสั่งซื้อใหม่
    createPurchaseOrder: async (purchaseOrderData) => {
        try {
            // แสดง log เพื่อตรวจสอบข้อมูลที่ส่งไป
            console.log('Sending purchase order data:', purchaseOrderData);
            const response = await api.post("/purchase-orders", purchaseOrderData);
            return response.data;
        } catch (error) {
            console.error('Error in createPurchaseOrder:', error.response?.data);
            throw error;
        }
    },

    // รับสินค้าตามใบสั่งซื้อ
    receiveStock: async (purchaseOrderId) => {
        try {
            const response = await api.post(`/purchase-orders/${purchaseOrderId}/receive`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ดึงข้อมูลใบสั่งซื้อทั้งหมด
    getAllPurchaseOrders: async () => {
        try {
            const response = await api.get("/purchase-orders");
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ดึงข้อมูลใบสั่งซื้อตาม ID
    getPurchaseOrderById: async (purchaseOrderId) => {
        try {
            const response = await api.get(`/purchase-orders/${purchaseOrderId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    

    // อัพเดทข้อมูลใบสั่งซื้อ
    updatePurchaseOrder: async (purchaseOrderId, updateData) => {
        try {
            const response = await api.put(`/purchase-orders/${purchaseOrderId}`, updateData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ลบใบสั่งซื้อ
    deletePurchaseOrder: async (purchaseOrderId) => {
        try {
            const response = await api.delete(`/purchase-orders/${purchaseOrderId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ตรวจสอบและเติมสต็อกอัตโนมัติสำหรับสินค้าเดียว
    autoAddStock: async (productId) => {
        try {
            const response = await api.post(`/purchase-orders/auto-add-stock/${productId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ตรวจสอบและเติมสต็อกอัตโนมัติสำหรับสินค้าทั้งหมด
    autoAddStockAll: async () => {
        try {
            const response = await api.post("/purchase-orders/auto-add-stock-all");
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // เติมสต็อกทั้งหมดในใบสั่งซื้อในครั้งเดียว
    addAllStockFromOrder: async (orderId) => {
        try {
            const response = await api.post(`/purchase-orders/${orderId}/add-all-stock`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ตรวจสอบและเติมสต็อกอัตโนมัติสำหรับสินค้าที่มีสต็อก = 0
    autoAddStockForZeroStock: async () => {
        try {
            const response = await api.post("/purchase-orders/auto-add-stock-zero");
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default purchaseOrderService;
