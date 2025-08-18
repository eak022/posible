import api from './api';

const orderService = {
    // สร้างคำสั่งซื้อ
    createOrder: async (orderData) => {
        try {
            const response = await api.post('/order', orderData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' };
        }
    },

    // ดึงรายการคำสั่งซื้อทั้งหมด
    getOrders: async () => {
        try {
            const response = await api.get('/order');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'เกิดข้อผิดพลาดในการดึงรายการคำสั่งซื้อ' };
        }
    },

    // ดึงรายละเอียดคำสั่งซื้อตาม ID
    getOrderById: async (id) => {
        try {
            const response = await api.get(`/order/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'เกิดข้อผิดพลาดในการดึงรายละเอียดคำสั่งซื้อ' };
        }
    },

    // ลบคำสั่งซื้อ
    deleteOrder: async (id) => {
        try {
            const response = await api.delete(`/order/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ' };
        }
    },

    // อัปเดตรายละเอียดคำสั่งซื้อ
    updateOrderDetail: async (id, updateData) => {
        try {
            const response = await api.put(`/order/${id}`, updateData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'เกิดข้อผิดพลาดในการอัปเดตรายละเอียดคำสั่งซื้อ' };
        }
    },

    // อัปเดตสถานะคำสั่งซื้อ
    updateOrderStatus: async (orderId, orderStatus) => {
        try {
            const response = await api.patch(`/order/${orderId}/status`, { orderStatus });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ดึงรายการคำสั่งซื้อตามสถานะ
    getOrdersByStatus: async (status) => {
        try {
            const response = await api.get(`/order/status/${status}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ดึงรายการคำสั่งซื้อตามวันที่
    getOrdersByDate: async (startDate, endDate) => {
        try {
            const response = await api.get(`/order/date?start=${startDate}&end=${endDate}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ยกเลิกคำสั่งซื้อ
    cancelOrder: async (orderId) => {
        try {
            const response = await api.post(`/order/${orderId}/cancel`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // สร้างออเดอร์ตัดจำหน่ายสินค้า
    createDisposeOrder: async (disposeData) => {
        try {
            const response = await api.post('/order/dispose', disposeData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'เกิดข้อผิดพลาดในการสร้างออเดอร์ตัดจำหน่ายสินค้า' };
        }
    },
};

export default orderService; 