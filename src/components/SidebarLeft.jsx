import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  FaHome,
  FaShoppingCart,
  FaBox,
  FaTags,
  FaHistory,
  FaFileAlt,
  FaCog,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
} from "react-icons/fa";
import { useCategoryContext } from "../context/CategoryContext";

const Sidebar = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();
  const params = useParams();
  const { categories, loading, error } = useCategoryContext();

  // ตรวจสอบและเปิด dropdown อัตโนมัติเมื่อเข้าหน้า order-sell
  useEffect(() => {
    if (location.pathname.startsWith('/order-sell')) {
      setOpenDropdown('orders');
    } else if (location.pathname.startsWith('/product')) {
      setOpenDropdown('products');
    } else if (
      (location.pathname.startsWith('/management') && location.pathname !== '/management/promotions')
      || location.pathname === '/purchase-orders'
    ) {
      setOpenDropdown('management');
    } else {
      setOpenDropdown(null);
    }
  }, [location.pathname]);

  const handleDropdownToggle = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // ฟังก์ชันตรวจสอบว่าเป็นหมวดหมู่ที่เลือกอยู่ในแต่ละเมนู
  const isSelectedOrderCategory = (categoryId) => {
    return location.pathname.startsWith('/order-sell') && (params.category || "") === categoryId;
  };
  const isSelectedProductCategory = (categoryId) => {
    return location.pathname.startsWith('/product') && (params.category || "") === categoryId;
  };

  // ฟังก์ชันตรวจสอบว่าเป็นลิงก์ที่ active อยู่หรือไม่
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  // เพิ่มฟังก์ชันช่วยเช็ค active
  const isManagementActive = () => (
    (location.pathname.startsWith('/management') && location.pathname !== '/management/promotions') ||
    location.pathname === '/purchase-orders'
  );
  const isPromotionActive = () => location.pathname === '/management/promotions';

  // ฟังก์ชันสำหรับ render หมวดหมู่แต่ละเมนู
  const renderCategoryLinks = (type) => {
    if (!categories || categories.length === 0) return null;
    // เพิ่ม "ทั้งหมด" เป็นตัวเลือกแรก
    const allOption = { id: "", name: "ทั้งหมด" };
    const list = [allOption, ...categories.map(cat => ({ id: cat._id, name: cat.categoryName }))];
    return list.map((category) => {
      const isSelected =
        type === "order"
          ? location.pathname.startsWith("/order-sell") && (params.category || "") === category.id
          : location.pathname.startsWith("/product") && (params.category || "") === category.id;

      const toPath = type === "order"
        ? `/order-sell/${category.id || ""}`
        : `/product/${category.id || ""}`;

      return (
        <Link
          key={category.id}
          to={toPath}
          className={`p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 ${
            isSelected
              ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-medium shadow-sm"
              : ""
          }`}
        >
          {category.name}
        </Link>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-64 bg-white p-4 shadow-md">
        <div className="text-center">กำลังโหลด...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen w-64 bg-white p-4 shadow-md">
        <div className="text-center text-red-500">เกิดข้อผิดพลาด: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-64 bg-white p-4 shadow-md">
      {/* Logo */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center">
          <img src="/LOGO.png" alt="Logo" />
        </div>
        <span className="text-lg font-semibold text-gray-800">POSsible</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto">
        <div className="flex flex-col space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 ${
              isActiveLink('/dashboard') ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' : ''
            }`}
          >
            <FaHome className="mr-3 text-xl" />
            <span className="font-medium">แคชบอร์ด</span>
          </Link>

          {/* ออเดอร์ขาย */}
          <div>
            <Link
              to="/order-sell"
              className={`flex items-center justify-between w-full p-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 ${
                location.pathname.startsWith('/order-sell') ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' : ''
              }`}
              onClick={() => setOpenDropdown(openDropdown === 'orders' ? null : 'orders')}
            >
              <div className="flex items-center">
                <FaShoppingCart className="mr-3 text-xl" />
                <span className="font-medium">ออเดอร์ขาย</span>
              </div>
              {openDropdown === 'orders' ? <FaChevronUp className="text-blue-500" /> : <FaChevronDown />}
            </Link>
            {openDropdown === 'orders' && (
              <div className="ml-6 mt-2 flex flex-col space-y-1 max-h-48 overflow-y-auto">
                {renderCategoryLinks("order")}
              </div>
            )}
          </div>

          {/* สินค้า */}
          <div>
            <Link
              to="/product"
              className={`flex items-center justify-between w-full p-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 ${
                location.pathname.startsWith('/product') ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' : ''
              }`}
              onClick={() => setOpenDropdown(openDropdown === 'products' ? null : 'products')}
            >
              <div className="flex items-center">
                <FaBox className="mr-3 text-xl" />
                <span className="font-medium">สินค้า</span>
              </div>
              {openDropdown === 'products' ? <FaChevronUp className="text-blue-500" /> : <FaChevronDown />}
            </Link>
            {openDropdown === 'products' && (
              <div className="ml-6 mt-2 flex flex-col space-y-1 max-h-48 overflow-y-auto">
                {renderCategoryLinks("product")}
              </div>
            )}
          </div>

          {/* โปรโมชั่น */}
          <Link
            to="/management/promotions"
            className={`flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 ${
              isPromotionActive() ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' : ''
            }`}
          >
            <FaTags className="mr-3 text-xl" />
            <span className="font-medium">โปรโมชั่น</span>
          </Link>

          {/* ประวัติการขาย */}
          <Link
            to="/sales-history"
            className={`flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 ${
              isActiveLink('/sales-history') ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' : ''
            }`}
          >
            <FaHistory className="mr-3 text-xl" />
            <span className="font-medium">ประวัติการขาย</span>
          </Link>

          {/* จัดการ (Dropdown) */}
          <div>
            <button
              className={`flex items-center justify-between w-full p-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 ${
                isManagementActive() ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' : ''
              }`}
              onClick={() => handleDropdownToggle('management')}
            >
              <div className="flex items-center">
                <FaFileAlt className="mr-3 text-xl" />
                <span className="font-medium">จัดการ</span>
              </div>
              {openDropdown === 'management' ? <FaChevronUp className="text-blue-500" /> : <FaChevronDown />}
            </button>
            {openDropdown === 'management' && (
              <div className="ml-6 mt-2 flex flex-col space-y-1 max-h-48 overflow-y-auto">
                <Link
                  to="/purchase-orders"
                  className={`flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 ${
                    isActiveLink('/purchase-orders') ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-medium shadow-sm' : ''
                  }`}
                >
                  <FaFileAlt className="mr-2" /> จัดการใบสั่งของ
                </Link>
                <Link
                  to="/management/suppliers"
                  className={`flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 ${
                    isActiveLink('/management/suppliers') ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-medium shadow-sm' : ''
                  }`}
                >
                  <FaBox className="mr-2" /> จัดการซัพพลายเออร์
                </Link>
                <Link
                  to="/management/status"
                  className={`flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 ${
                    isActiveLink('/management/status') ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-medium shadow-sm' : ''
                  }`}
                >
                  <FaClipboardList className="mr-2" /> จัดการสถานะสินค้า
                </Link>
                <Link
                  to="/management/categories"
                  className={`flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 ${
                    isActiveLink('/management/categories') ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-medium shadow-sm' : ''
                  }`}
                >
                  <FaTags className="mr-2" /> จัดการประเภทสินค้า
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Settings ติดขอบล่างเสมอ */}
      <div className="mt-auto">
        <Link
          to="/setting/shop"
          className={`flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 ${
            isActiveLink('/setting/shop') ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' : ''
          }`}
        >
          <FaCog className="mr-3 text-xl" />
          <span className="font-medium">การตั้งค่า</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
