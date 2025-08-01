import api from './api';

const statusService = {
    // ดึงรายการสถานะทั้งหมด
    getAllStatuses: async () => {
        try {
            const response = await api.get('/status');
            return response.data.statuses;
        } catch (error) {
            console.error("Error in getAllStatuses:", error);
            throw error;
        }
    },

    // ดึงข้อมูลสถานะตาม ID
    getStatusById: async (statusId) => {
        try {
            const response = await api.get(`/status/${statusId}`);
            return response.data.status;
        } catch (error) {
            console.error("Error in getStatusById:", error);
            throw error;
        }
    },

    // สร้างสถานะใหม่
    createStatus: async (statusData) => {
        try {
            const response = await api.post('/status', statusData);
            return response.data.status;
        } catch (error) {
            console.error("Error in createStatus:", error);
            throw error;
        }
    },

    // อัปเดตสถานะ
    updateStatus: async (statusId, statusData) => {
        try {
            const response = await api.put(`/status/${statusId}`, statusData);
            return response.data.status;
        } catch (error) {
            console.error("Error in updateStatus:", error);
            throw error;
        }
    },

    // ลบสถานะ
    deleteStatus: async (statusId) => {
        try {
            const response = await api.delete(`/status/${statusId}`);
            return response.data.message;
        } catch (error) {
            console.error("Error in deleteStatus:", error);
            throw error;
        }
    }
};

export default statusService;
