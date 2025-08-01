import api from './api';

const categoryService = {
    // ดึงรายการหมวดหมู่ทั้งหมด
    getAllCategories: async () => {
        try {
            const response = await api.get('/category');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ดึงข้อมูลหมวดหมู่ตาม ID
    getCategoryById: async (categoryId) => {
        try {
            const response = await api.get(`/category/${categoryId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // เพิ่มหมวดหมู่ใหม่
    createCategory: async (categoryData) => {
        try {
            const response = await api.post('/category', categoryData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // อัปเดตข้อมูลหมวดหมู่
    updateCategory: async (categoryId, categoryData) => {
        try {
            const response = await api.put(`/category/${categoryId}`, categoryData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ลบหมวดหมู่
    deleteCategory: async (categoryId) => {
        try {
            const response = await api.delete(`/category/${categoryId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default categoryService; 