import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Pages
import Order from "../pages/Order/OrderPage";
import Product from "../pages/Stock/StockPage";
import EditProduct from "../pages/Stock/EditProduct";
import CreateProduct from "../pages/Stock/CreateProduct";
import PurchaseOrderPage from "../pages/PurchaseOrder/PurchaseOrderPage";
import CreatePurchaseOrder from "../pages/PurchaseOrder/CreatePurchaseOrder";
import ProductStatusPage from "../pages/Status/ProductStatus";
import SupplierPage from "../pages/Supplier/SupplierPage";
import CategoryPage from "../pages/Category/CategoryPage";
import PromotionPage from "../pages/Promotion/Promotion";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import Profile from "../pages/Profile/Profile";
import EditProfile from "../pages/Profile/EditProfile";
import Login from "../pages/Login";
import Register from "../pages/Register";
import History from "../pages/History/HistoryPage";
import EditPurchaseOrder from "../pages/PurchaseOrder/EditPurchaseOrder";
import SettingsPage from "../pages/Settings/SettingsPage";

// Layout
import MainLayout from "../layouts/Mainlayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Order />,
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/order-sell",
        element: <Order />,
      },
      {
        path: "/order-sell/:category",
        element: <Order />,
      },
      {
        path: "/product",
        element: <Product />,
      },
      {
        path: "/product/:category",
        element: <Product />,
      },
      {
        path: "/products/edit-product/:id",
        element: <EditProduct />,
      },
      {
        path: "/products/create-product",
        element: <CreateProduct />,
      },
      {
        path: "/editpurchase-order/:id",
        element: <EditPurchaseOrder />,
      },
      {
        path: "/purchase-orders",
        element: <PurchaseOrderPage />,
      },
      {
        path: "/create-purchase-order",
        element: <CreatePurchaseOrder />,
      },
      {
        path: "/sales-history",
        element: <History />,
      },
      {
        path: "/management/promotions", // เส้นทางโปรโมชั่น
        element: <PromotionPage />,
      },
      {
        path: "/profile", // เส้นทางโปรไฟล์
        element: <Profile />,
      },
      {
        path: "/edit-profile", // เส้นทางโปรไฟล์
        element: <EditProfile />,
      },
      {
        path: "/management/status", //เส้นทางสถานะสินค้า
        element: <ProductStatusPage />,
      },
      {
        path: "/management/suppliers", //เส้นทางซัพพลายเออร์
        element: <SupplierPage />,
      },
      {
        path: "/management/categories", //เส้นทางหมวดหมู่
        element: <CategoryPage />,
      },
      {
        path: "/setting/shop",
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
]);

export default router;
