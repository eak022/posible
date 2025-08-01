import api from './api';

const supplierService = {
    // ดึงรายการซัพพลายเออร์ทั้งหมด
    getAllSuppliers: async () => {
        try {
            const response = await api.get('/supplier/getAllSupplier');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ดึงข้อมูลซัพพลายเออร์ตาม ID
    getSupplierById: async (supplierId) => {
        try {
            const response = await api.get(`/supplier/getSupplierById/${supplierId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // สร้างซัพพลายเออร์ใหม่
    createSupplier: async (supplierData) => {
        try {
            const response = await api.post('/supplier/createSupplier', supplierData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // อัปเดตข้อมูลซัพพลายเออร์
    updateSupplier: async (supplierId, supplierData) => {
        try {
            const response = await api.put(`/supplier/updateSupplierInfo/${supplierId}`, supplierData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ลบซัพพลายเออร์
    deleteSupplier: async (supplierId) => {
        try {
            const response = await api.delete(`/supplier/deleteSupplier/${supplierId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default supplierService; 