import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // ลงทะเบียนผู้ใช้ใหม่
    register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/register', userData);
            set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false
            });
            return response.data;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน',
                isLoading: false
            });
            throw error;
        }
    },

    // เข้าสู่ระบบ
    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', credentials);
            set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false
            });
            return response.data;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
                isLoading: false
            });
            throw error;
        }
    },

    // ออกจากระบบ
    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            await api.post('/auth/logout');
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'เกิดข้อผิดพลาดในการออกจากระบบ',
                isLoading: false
            });
            throw error;
        }
    },

    // ตรวจสอบสถานะการเข้าสู่ระบบ
    checkAuth: async () => {
        set({ isLoading: true, error: null });
        try {

            const response = await api.get('/auth/check-auth');

            console.log('2. Response จาก API:', response.data);
            console.log('3. Response Headers:', response.headers);
            console.log('4. Cookies หลังเรียก API:', document.cookie);

            set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false
            });

            console.log('5. State หลังอัพเดท:', {
                user: response.data.user,
                isAuthenticated: true
            });
            console.log('=== จบการตรวจสอบ Authentication ===');

            return response.data;
        } catch (error) {
            console.log('=== เกิดข้อผิดพลาดในการตรวจสอบ Authentication ===');
            console.log('Error:', error.response?.data);
            console.log('Error Status:', error.response?.status);
            console.log('Error Headers:', error.response?.headers);
            console.log('Cookies ตอนเกิด error:', document.cookie);

            set({
                user: null,
                isAuthenticated: false,
                isLoading: false
            });
            throw error;
        }
    },

    // อัปเดตข้อมูลโปรไฟล์ใน State
    updateUserProfile: (newUserData) => {
        set((state) => ({
            user: { ...state.user, ...newUserData }
        }));
    },

    // ล้าง error
    clearError: () => set({ error: null })
}));

export default useAuthStore; 