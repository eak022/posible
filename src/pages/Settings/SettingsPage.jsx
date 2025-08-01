import React, { useEffect, useState } from "react";
import userService from "../../services/user.service";
import SettingshopModal from "./SettingshopModal";
import { FaStore, FaEdit, FaMapMarkerAlt, FaBuilding } from "react-icons/fa";

const SettingsPage = () => {
  const [shop, setShop] = useState({ shopName: "", address: "" });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const data = await userService.getProfile();
      setShop({ shopName: data.shopName || "", address: data.address || "" });
    } catch (e) {
      console.error("Error fetching shop data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  const handleModalSuccess = (newShop) => {
    setShop(newShop);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ตั้งค่าร้านค้า</h1>
          <p className="text-gray-600">จัดการข้อมูลร้านค้า</p>
        </div>

        {/* Shop Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <FaStore className="text-2xl text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">ข้อมูลร้านค้า</h2>
                <p className="text-gray-600">ข้อมูลพื้นฐานของร้านค้าของคุณ</p>
              </div>
            </div>
            <button
              id="edit-settings-button"
              onClick={() => setShowModal(true)}
              className="btn btn-warning flex gap-2"
            >
              <FaEdit />
              แก้ไขข้อมูล
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Shop Name */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-3">
                <FaBuilding className="text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-700">ชื่อร้านค้า</h3>
              </div>
              <p 
              id="shop-name-value" //เพิ่ม id
              className="text-lg font-medium text-gray-800">
                {shop.shopName || "ยังไม่ได้ตั้งชื่อร้านค้า"}
              </p>
            </div>

            {/* Address */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-3">
                <FaMapMarkerAlt className="text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-700">ที่อยู่ร้านค้า</h3>
              </div>
              <p 
              id="shop-address-value"  //เพิ่ม id
              className="text-lg font-medium text-gray-800">
                {shop.address || "ยังไม่ได้ตั้งที่อยู่ร้านค้า"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <SettingshopModal
          initialShop={shop}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default SettingsPage; 