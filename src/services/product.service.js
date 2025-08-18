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

    // ✅ ระบบจัดการล็อตใหม่

    // เพิ่มล็อตใหม่ให้กับสินค้า
    addLotToProduct: async (productId, lotData) => {
        try {
            const response = await api.post(`/product/${productId}/lots`, lotData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ดึงข้อมูลล็อตทั้งหมดของสินค้า
    getProductLots: async (productId, status = null) => {
        try {
            const params = status ? { status } : {};
            const response = await api.get(`/product/${productId}/lots`, { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ตรวจสอบสต็อกพร้อมข้อมูลล็อต
    checkStockAvailability: async (productId, requiredQuantity) => {
        try {
            const response = await api.get(`/product/${productId}/stock-check`, {
                params: { requiredQuantity }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ปรับปรุงจำนวนในล็อต
    updateLotQuantity: async (productId, lotNumber, quantity, reason = null) => {
        try {
            const response = await api.put(`/product/${productId}/lots/${lotNumber}`, {
                quantity,
                reason
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ตัดจำหน่ายล็อต
    disposeLot: async (productId, lotNumber, reason = 'manual') => {
        try {
            const response = await api.patch(`/product/${productId}/lots/${lotNumber}/dispose`, {
                reason
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ ฟังก์ชันใหม่: แก้ไขราคาซื้อและวันหมดอายุในล็อต
    updateLotDetails: async (productId, lotNumber, details, reason = null) => {
        try {
            const response = await api.patch(`/product/${productId}/lots/${lotNumber}/details`, {
                ...details,
                reason
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ ฟังก์ชันใหม่: แก้ไขข้อมูลล็อตทั้งหมด (จำนวน, ราคา, วันหมดอายุ)
    updateLotComplete: async (productId, lotNumber, lotData, reason = null) => {
        try {
            const response = await api.put(`/product/${productId}/lots/${lotNumber}/complete`, {
                ...lotData,
                reason
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ สร้างบาร์โค้ดภายในร้าน (EAN-13 prefix 20–29)
    generateInternalBarcode: async ({ type, storeId }) => {
        try {
            const response = await api.post('/product/generate-barcode', { type, storeId });
            return response.data; // { barcode }
        } catch (error) {
            throw error;
        }
    },

};

export default productService; 