import axios from "axios";

// กำหนด base URL สำหรับ backend server
const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000/api/v1';

console.log('API Base URL:', baseURL);

const api = axios.create({
    baseURL: baseURL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: 10000,
});

// ตัวแปรสำหรับป้องกัน multiple refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

// Add request interceptor
api.interceptors.request.use(
    (config) => {
        // ไม่ต้องเพิ่ม Authorization header เพราะใช้ cookies แล้ว
        console.log('API Request:', {
            method: config.method,
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`
        });
        
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data
        });
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        console.error('API Response Error:', {
            status: error.response?.status,
            message: error.message,
            url: error.config?.url,
            baseURL: error.config?.baseURL
        });
        
        // ถ้าเป็น 401 และยังไม่ได้ลอง refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // รอ refresh token อื่นเสร็จ
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // ลอง refresh token
                const response = await api.post('/auth/refresh-token');
                const { user } = response.data;
                
                // อัพเดท state ใน store
                if (window.useAuthStore) {
                    window.useAuthStore.getState().updateUserProfile(user);
                }
                
                processQueue(null, null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                
                // ถ้า refresh ไม่สำเร็จ ให้ logout
                if (window.useAuthStore) {
                    window.useAuthStore.getState().logout();
                }
                
                // redirect ไปหน้า login
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        // กรณีอื่นๆ
        if (error.response?.status === 401) {
            // Token ถูก revoked หรือหมดอายุ
            if (window.useAuthStore) {
                window.useAuthStore.getState().logout();
            }
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

export default api; 