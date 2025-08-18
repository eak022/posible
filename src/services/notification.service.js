import api from './api';

const getAllNotifications = async () => {
    try {
        const response = await api.get(`/notifications/all`);
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

const notificationService = {
    getAllNotifications
};

export default notificationService; 
