import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
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
            
            // ตรวจสอบว่ามี user data หรือไม่
            if (response.data.user) {
                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoading: false
                });
            } else {
                // ถ้าไม่มี user data ให้เรียก check-auth เพื่อดึงข้อมูล
                await get().checkAuth();
            }
            
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
            console.log("🚪 เริ่มกระบวนการ logout...");
            
            // เรียก logout API เพื่อ blacklist tokens
            await api.post('/auth/logout');
            console.log("✅ Logout API สำเร็จ");
            
        } catch (error) {
            console.error('❌ Logout API error:', error);
        } finally {
            // ล้าง state และ tokens ไม่ว่าจะสำเร็จหรือไม่
            console.log("🧹 ล้าง state และ tokens...");
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
            
            // เรียกฟังก์ชันล้าง tokens ทั้งหมด
            get().clearAllTokens();
        }
    },

    // ล้าง tokens ทั้งหมด
    clearAllTokens: () => {
        console.log("🧹 ล้าง tokens ทั้งหมด...");
        
        // ล้าง cookies
        document.cookie = "x-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "x-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // ล้าง localStorage
        localStorage.removeItem('x-access-token');
        localStorage.removeItem('x-refresh-token');
        localStorage.removeItem('user');
        
        // ล้าง sessionStorage
        sessionStorage.removeItem('x-access-token');
        sessionStorage.removeItem('x-refresh-token');
        sessionStorage.removeItem('user');
        
        console.log("✅ ล้าง tokens ทั้งหมดเสร็จสิ้น");
    },

    // ตรวจสอบสถานะการเข้าสู่ระบบ
    checkAuth: async () => {
        set({ isLoading: true, error: null });
        try {
            console.log("🔍 เริ่มตรวจสอบ Authentication ใน useAuthStore...");
            console.log("🍪 Cookies ก่อนเรียก API:", document.cookie);
            console.log("💾 localStorage tokens:", {
                accessToken: localStorage.getItem('x-access-token'),
                refreshToken: localStorage.getItem('x-refresh-token')
            });
            console.log("📱 sessionStorage tokens:", {
                accessToken: sessionStorage.getItem('x-access-token'),
                refreshToken: sessionStorage.getItem('x-refresh-token')
            });
            
            const response = await api.get('/auth/check-auth');

            console.log('📡 Response จาก API:', response.data);
            console.log('📋 Response Headers:', response.headers);
            console.log('🍪 Cookies หลังเรียก API:', document.cookie);

            if (response.data.user) {
                console.log("✅ พบข้อมูลผู้ใช้ - ตั้งค่า isAuthenticated เป็น true");
                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoading: false
                });
            } else {
                console.log("❌ ไม่พบข้อมูลผู้ใช้ - ตั้งค่า isAuthenticated เป็น false");
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            }

            console.log('📊 State หลังอัพเดท:', {
                user: response.data.user,
                isAuthenticated: !!response.data.user
            });
            console.log('=== จบการตรวจสอบ Authentication ===');

            return response.data;
        } catch (error) {
            console.log('=== เกิดข้อผิดพลาดในการตรวจสอบ Authentication ===');
            console.log('❌ Error:', error.response?.data);
            console.log('📊 Error Status:', error.response?.status);
            console.log('📋 Error Headers:', error.response?.headers);
            console.log('🍪 Cookies ตอนเกิด error:', document.cookie);

            // ตรวจสอบประเภทของ error
            if (error.response?.status === 401) {
                const errorMessage = error.response?.data?.message;
                
                if (errorMessage === "Token has been revoked. Please login again.") {
                    // Token ถูก revoked ให้ logout และ redirect
                    console.log("🚫 Token ถูก revoked - กำลัง logout");
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
                    });
                    
                    // ล้าง tokens ทั้งหมด
                    get().clearAllTokens();
                    
                    // Redirect ไปหน้า login
                    window.location.href = '/login';
                } else {
                    console.log("🚫 401 Error - ตั้งค่า isAuthenticated เป็น false");
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: errorMessage || "เซสชันหมดอายุ"
                    });
                    
                    // ล้าง tokens เมื่อเกิด 401 error
                    get().clearAllTokens();
                }
            } else {
                console.log("❌ Error อื่นๆ - ตั้งค่า isAuthenticated เป็น false");
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: "เกิดข้อผิดพลาดในการตรวจสอบสถานะ"
                });
                
                // ล้าง tokens เมื่อเกิด error อื่นๆ
                get().clearAllTokens();
            }
            
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

// เพิ่ม store เข้า window เพื่อให้ API interceptor เข้าถึงได้
if (typeof window !== 'undefined') {
    window.useAuthStore = useAuthStore;
}

export default useAuthStore; 