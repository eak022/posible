import { Navigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth, clearAllTokens } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        console.log("🔐 เริ่มตรวจสอบ Authentication...");
        console.log("📊 สถานะเริ่มต้น:", { isAuthenticated, isLoading });
        
        // ตรวจสอบว่ามี token อยู่ในที่ต่างๆ หรือไม่
        const hasLocalToken = localStorage.getItem('x-access-token') || localStorage.getItem('x-refresh-token');
        const hasSessionToken = sessionStorage.getItem('x-access-token') || sessionStorage.getItem('x-refresh-token');
        const hasCookieToken = document.cookie.includes('x-access-token') || document.cookie.includes('x-refresh-token');
        
        console.log("🔍 ตรวจสอบ tokens:", {
          localStorage: !!hasLocalToken,
          sessionStorage: !!hasSessionToken,
          cookies: !!hasCookieToken
        });
        
        // ถ้าไม่มี token ใดๆ เลย ให้ตั้งค่า isAuthenticated เป็น false ทันที
        if (!hasLocalToken && !hasSessionToken && !hasCookieToken) {
          console.log("🚫 ไม่พบ token ใดๆ - ตั้งค่า isAuthenticated เป็น false");
          clearAllTokens();
          setIsChecking(false);
          return;
        }
        
        await checkAuth();
        
        console.log("✅ การตรวจสอบ Authentication เสร็จสิ้น");
        console.log("📊 สถานะหลังตรวจสอบ:", { isAuthenticated, isLoading });
      } catch (error) {
        console.log("❌ Auth check failed:", error);
        // เมื่อเกิด error ให้ล้าง tokens และตั้งค่า isAuthenticated เป็น false
        clearAllTokens();
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [checkAuth, clearAllTokens]);

  // ถ้ากำลังโหลด หรือกำลังตรวจสอบ auth ให้แสดง loading
  if (isLoading || isChecking) {
    console.log("⏳ กำลังโหลด...", { isLoading, isChecking });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // ถ้าไม่ได้ login ให้ไปหน้า login
  if (!isAuthenticated) {
    console.log("🚫 ไม่ได้ล็อกอิน - กำลังนำทางไปหน้า /login");
    console.log("📊 สถานะปัจจุบัน:", { isAuthenticated, isLoading, isChecking });
    
    // ล้าง tokens ทั้งหมดก่อนนำทาง
    clearAllTokens();
    
    return <Navigate to="/login" replace />;
  }

  // ถ้า login แล้ว ให้แสดงเนื้อหาที่ต้องการ
  console.log("✅ ล็อกอินแล้ว - แสดงเนื้อหา");
  return children;
};

export default ProtectedRoute;
