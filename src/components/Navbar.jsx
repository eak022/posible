import { Link, useNavigate } from "react-router-dom";
// import { useNavigate } from "react-router-dom";

import {
  FaBell,
  FaSignOutAlt,
  FaCog,
  FaChevronDown,
  FaUser,
  FaTimes,
} from "react-icons/fa";
import { useState, useEffect, useContext } from "react";
import useAuthStore from "../store/useAuthStore";
import NotificationModal from './NotificationModal';
import notificationService from '../services/notification.service';
import { ProductContext } from "../context/ProductContext"; // สมมติว่ามี ProductContext

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    total: 0,
    lowStock: 0,
    expiring: 0
  });

  const { products } = useContext(ProductContext); // ดึง products จาก context

  useEffect(() => {
    const fetchNotificationCounts = async () => {
      try {
        const response = await notificationService.getAllNotifications();
        if (response.success) {
          setNotificationCounts(response.counts);
        }
      } catch (error) {
        console.error("Error fetching notification counts:", error);
      }
    };
    fetchNotificationCounts();
  }, [products]); // ดึงใหม่เมื่อ products เปลี่ยน

  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleBlurDropdown = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setTimeout(() => {
        setIsDropdownOpen(false);
      }, 100); // เพิ่มการหน่วงเวลา 100ms
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await logout();
      setIsDropdownOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const openNotificationModal = (e) => {
    if (e && e.target) {
      e.target.blur(); // ยังคง blur ปุ่มไว้ เพื่อป้องกันปัญหา focus
    }
    setIsNotificationModalOpen(true);
  };

  const closeNotificationModal = () => {
    setIsNotificationModalOpen(false);
  };

  return (
    <div className="navbar bg-gray-50 shadow-md px-4 flex items-center justify-between">
      <div className="flex items-center gap-4"></div>
      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <div className="relative">
          <button
            className="btn btn-ghost btn-circle relative group"
            onClick={openNotificationModal}
            aria-label="แจ้งเตือน"
          >
            <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-pink-200 via-red-200 to-yellow-200 opacity-0 group-hover:opacity-60 transition duration-300 blur-sm z-0"></span>
            <FaBell className="w-5 h-5 text-black-100 drop-shadow-md z-10 relative transition-transform group-hover:scale-110" />
            {notificationCounts.total > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow-lg border-2 border-white animate-bounce z-100">
                {notificationCounts.total}
              </span>
            )}
          </button>
        </div>

        {/* User Info and Dropdown together */}
        <div className="flex items-center gap-1">
          {/* User Avatar */}
          <div className="btn btn-ghost btn-circle avatar" 
          onClick={() => navigate('/profile')} 
          style={{ cursor: 'pointer' }}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {user?.profileImage ? (
                <img
                //ใช้profileImageเพื่อให้มันดึงโปรไฟล์ที่เกิดการแก้ไขมา
                  src={user.profileImage}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser className="w-6 h-6 text-gray-500" />
              )}
            </div>
          </div>

          {/* User Info and Dropdown */}
          <div className="dropdown dropdown-end flex items-center relative">
            {/* User Info and Arrow */}
            <button
              className="btn btn-ghost ml-2"
              onClick={handleToggleDropdown}
            >
              <div className="flex flex-col text-right ml-0">
                <span className="font-medium text-gray-800">
                  {user?.username || "ผู้ใช้"}
                </span>
                <span className="text-gray-500 text-sm">
                  {user?.shopName || "ร้านค้า"}
                </span>
              </div>

              {/* Dropdown Arrow */}
              <FaChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <ul
                className="dropdown-content menu p-2 shadow bg-white rounded-box w-52 mt-3 absolute right-0 top-14 z-50"
              >
                <li>
                  <button
                    className="flex items-center gap-2 text-black w-full text-left hover:bg-gray-100"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <FaCog className="w-4 h-4" /> การตั้งค่า
                  </button>
                </li>
                <li>
                  <button
                    className="flex items-center gap-2 text-red-500 w-full text-left hover:bg-gray-100"
                    onMouseDown={handleLogout}
                  >
                    <FaSignOutAlt className="w-4 h-4" /> ออกจากระบบ
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={closeNotificationModal}
      />
    </div>
  );
};

export default Navbar;
