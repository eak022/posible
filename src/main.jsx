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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeSetter />
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
