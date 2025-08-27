import { useEffect, useRef } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

const useTokenRefresh = () => {
    const { user, isAuthenticated, logout } = useAuthStore();
    const refreshIntervalRef = useRef(null);
    const refreshTimeoutRef = useRef(null);

    // ฟังก์ชันสำหรับ refresh token
    const refreshToken = async () => {
        try {
            const response = await api.post('/auth/refresh-token');
            console.log('Token refreshed successfully:', response.data);
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            
            // ถ้า refresh ไม่สำเร็จ ให้ logout
            if (error.response?.status === 401) {
                await logout();
                window.location.href = '/login';
            }
            return false;
        }
    };

    // ตั้งค่า auto refresh token
    useEffect(() => {
        if (isAuthenticated && user) {
            // Refresh token ทุก 10 นาที (ก่อน access token หมดอายุ 5 นาที)
            refreshIntervalRef.current = setInterval(async () => {
                console.log('Auto refreshing token...');
                await refreshToken();
            }, 10 * 60 * 1000); // 10 นาที

            // ตั้ง timeout สำหรับ refresh token แรก
            refreshTimeoutRef.current = setTimeout(async () => {
                console.log('Initial token refresh...');
                await refreshToken();
            }, 5 * 60 * 1000); // 5 นาที
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [isAuthenticated, user, logout]);

    // ฟังก์ชันสำหรับ refresh token แบบ manual
    const manualRefresh = async () => {
        return await refreshToken();
    };

    return {
        refreshToken: manualRefresh
    };
};

export default useTokenRefresh;
