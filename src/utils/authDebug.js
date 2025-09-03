// Auth Debug Helper
// ใช้สำหรับ debug ปัญหา authentication

export const debugAuthState = () => {
  console.log('=== AUTH DEBUG INFO ===');
  
  // ตรวจสอบ localStorage
  const authStorage = localStorage.getItem('auth-storage');
  console.log('📦 Auth Storage:', authStorage ? JSON.parse(authStorage) : 'null');
  
  // ตรวจสอบ tokens ใน localStorage
  const localTokens = {
    accessToken: localStorage.getItem('x-access-token'),
    refreshToken: localStorage.getItem('x-refresh-token')
  };
  console.log('💾 LocalStorage Tokens:', localTokens);
  
  // ตรวจสอบ tokens ใน sessionStorage
  const sessionTokens = {
    accessToken: sessionStorage.getItem('x-access-token'),
    refreshToken: sessionStorage.getItem('x-refresh-token')
  };
  console.log('📱 SessionStorage Tokens:', sessionTokens);
  
  // ตรวจสอบ cookies
  console.log('🍪 Cookies:', document.cookie);
  
  // ตรวจสอบ current URL
  console.log('🌐 Current URL:', window.location.href);
  console.log('📍 Current Path:', window.location.pathname);
  
  console.log('=== END AUTH DEBUG ===');
};

export const clearAllAuthData = () => {
  console.log('🧹 Clearing all auth data...');
  
  // ล้าง localStorage
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('x-access-token');
  localStorage.removeItem('x-refresh-token');
  localStorage.removeItem('user');
  
  // ล้าง sessionStorage
  sessionStorage.removeItem('x-access-token');
  sessionStorage.removeItem('x-refresh-token');
  sessionStorage.removeItem('user');
  
  // ล้าง cookies
  document.cookie = "x-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "x-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  
  console.log('✅ All auth data cleared');
};

// เพิ่มฟังก์ชัน debug เข้า window object เพื่อให้เรียกใช้จาก console ได้
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuthState;
  window.clearAuth = clearAllAuthData;
}
