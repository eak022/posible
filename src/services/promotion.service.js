import api from './api';

const promotionService = {
    // ดึงรายการโปรโมชั่นทั้งหมด
    getAllPromotions: async () => {
        try {
            const response = await api.get('/promotion');
            return response.data.promotions;
        } catch (error) {
            console.error("Error in getAllPromotions:", error);
            throw error;
        }
    },

    // ดึงข้อมูลโปรโมชั่นตาม ID
    getPromotionById: async (promotionId) => {
        try {
            const response = await api.get(`/promotion/${promotionId}`);
            return response.data.promotion;
        } catch (error) {
            console.error("Error in getPromotionById:", error);
            throw error;
        }
    },

    // ดึงโปรโมชั่นที่ใช้งานได้ (ตามวันที่)
    getActivePromotions: async () => {
        try {
            const response = await api.get('/promotion/active');
            return response.data.promotions;
        } catch (error) {
            console.error("Error in getActivePromotions:", error);
            throw error;
        }
    },

    // ดึงโปรโมชั่นตามสินค้า
    getPromotionByProduct: async (productId) => {
        try {
            const response = await api.get(`/promotion/product/${productId}`);
            // ถ้าไม่เจอโปรโมชั่น ให้ return null
            return response.data.promotion || null;
        } catch (error) {
            // ถ้า error เป็น 404 หรือไม่มีโปรโมชั่น ให้ return null
            if (error.response && error.response.status === 404) {
                return null;
            }
            console.error("Error in getPromotionByProduct:", error);
            throw error;
        }
    },

    // สร้างโปรโมชั่นใหม่
    createPromotion: async (promotionData) => {
        try {
            const response = await api.post('/promotion', promotionData);
            return response.data.promotion;
        } catch (error) {
            console.error("Error in createPromotion:", error);
            throw error;
        }
    },

    // อัปเดตโปรโมชั่น
    updatePromotion: async (promotionId, promotionData) => {
        try {
            const response = await api.put(`/promotion/${promotionId}`, promotionData);
            return response.data.promotion;
        } catch (error) {
            console.error("Error in updatePromotion:", error);
            throw error;
        }
    },

    // ลบโปรโมชั่น
    deletePromotion: async (promotionId) => {
        try {
            const response = await api.delete(`/promotion/${promotionId}`);
            return response.data.message;
        } catch (error) {
            console.error("Error in deletePromotion:", error);
            throw error;
        }
    },

    // ค้นหาส่วนลดจากคำค้น
    searchPromotions: async (searchTerm) => {
        try {
            const response = await api.get(`/promotion/search?q=${searchTerm}`);
            return response.data.promotions;
        } catch (error) {
            console.error("Error in searchPromotions:", error);
            throw error;
        }
    }
};

export default promotionService;
