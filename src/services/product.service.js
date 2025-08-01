import api from './api';

const productService = {
    // ดึงรายการสินค้าทั้งหมด
    getAllProducts: async () => {
        try {
            const response = await api.get('/product');
            return response.data;
        } catch (error) {
            throw error;
        }
    },



    // ดึงข้อมูลสินค้าตาม ID
    getProductById: async (productId) => {
        try {
            const response = await api.get(`/product/${productId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createProduct: async (productData) => {
        try {
            const response = await api.post('/product', productData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // ระบุ Content-Type ให้ตรงกับ FormData
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
    ,

    // ดึงข้อมูล categories
    getAllCategories: async () => {
        try {
            const response = await api.get('/category'); // ใช้ API ที่ได้กำหนด
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ดึงข้อมูล statuses
    getAllStatuses: async () => {
        try {
            const response = await api.get('/status'); // ใช้ API ที่ได้กำหนด
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // อัปเดตข้อมูลสินค้า
    updateProduct: async (productId, productData) => {
        try {
            const response = await api.put(`/product/${productId}`, productData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ลบสินค้า
    deleteProduct: async (productId) => {
        try {
            const response = await api.delete(`/product/${productId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

};

export default productService; 