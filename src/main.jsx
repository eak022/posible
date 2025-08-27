import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import router from "./routes/Router";
import { CategoryProvider } from "./context/CategoryContext";
import Modal from "react-modal";
import { ProductProvider } from "./context/ProductContext";
import { SupplierProvider } from "./context/SupplierContext";
import { StatusProvider } from "./context/StatusContext";
import { PurchaseOrderProvider } from "./context/PurchaseOrderContext";
import { PromotionProvider } from "./context/PromotionContext";

Modal.setAppElement("#root"); // เพิ่มบรรทัดนี้

function ThemeSetter() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);
  return null;
}

function TokenCleaner() {
  useEffect(() => {
    // ล้าง token เก่าที่อาจเหลืออยู่เมื่อเริ่มต้นแอป
    console.log("🧹 เริ่มต้นแอป - ตรวจสอบและล้าง tokens เก่า...");
    
    // ตรวจสอบว่ามี token เก่าอยู่หรือไม่
    const hasLocalToken = localStorage.getItem('x-access-token') || localStorage.getItem('x-refresh-token');
    const hasSessionToken = sessionStorage.getItem('x-access-token') || sessionStorage.getItem('x-refresh-token');
    const hasCookieToken = document.cookie.includes('x-access-token') || document.cookie.includes('x-refresh-token');
    
    console.log("🔍 พบ tokens เก่า:", {
      localStorage: !!hasLocalToken,
      sessionStorage: !!hasSessionToken,
      cookies: !!hasCookieToken
    });
    
    // ถ้ามี token เก่า ให้ล้างออก
    if (hasLocalToken || hasSessionToken || hasCookieToken) {
      console.log("🧹 ล้าง tokens เก่า...");
      
      // ล้าง localStorage
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
      
      console.log("✅ ล้าง tokens เก่าเสร็จสิ้น");
    } else {
      console.log("✅ ไม่พบ tokens เก่า");
    }
  }, []);
  
  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeSetter />
    <TokenCleaner />
    <CategoryProvider>
      <ProductProvider>
        <SupplierProvider>
          <StatusProvider>
            <PurchaseOrderProvider>
              <PromotionProvider>
                <RouterProvider router={router} />
              </PromotionProvider>
            </PurchaseOrderProvider>
          </StatusProvider>
        </SupplierProvider>
      </ProductProvider>
    </CategoryProvider>
  </StrictMode>
);
