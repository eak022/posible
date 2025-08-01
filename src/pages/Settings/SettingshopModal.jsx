import React, { useState } from "react";
import userService from "../../services/user.service";
import Swal from "sweetalert2";

const SettingshopModal = ({ initialShop, onClose, onSuccess }) => {
  const [shopName, setShopName] = useState(initialShop.shopName);
  const [address, setAddress] = useState(initialShop.address);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateProfile({ shopName, address });
      Swal.fire({
        icon: "success",
        title: "บันทึกข้อมูลเสร็จสิ้น",
        showConfirmButton: false,
        timer: 1500,
      });
      onSuccess({ shopName, address });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถบันทึกข้อมูลได้",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form 
        id="shop-settings-form" //เพิ่ม id
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-xl relative"
        onSubmit={handleSubmit}
      >
        <button
          id="shop-close-button" //เพิ่ม id
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold mb-6 text-black border-b pb-2">ข้อมูลทั่วไป</h2>
        <div className="flex flex-row gap-8 mb-8">
          <div className="flex-1 flex flex-col">
            <label className="mb-2 font-medium text-black">ชื่อร้านค้า</label>
            <input 
              id="shop-name-input" //เพิ่ม id
              className="p-3 rounded-md border bg-gray-50 text-black shadow-sm"
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              placeholder="ชื่อร้านค้า"
              disabled={loading}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="mb-2 font-medium text-black">ที่อยู่</label>
            <textarea 
              id="shop-address-textarea" //เพิ่ม id
              className="p-3 rounded-md border bg-gray-50 text-black shadow-sm min-h-[80px]"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="ที่อยู่ร้านค้า"
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button 
            id="shop-cancel-button" //เพิ่ม id
            type="button"
            className="px-8 py-2 border border-red-400 text-red-500 rounded-lg bg-white hover:bg-red-50 transition"
            onClick={onClose}
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button 
            id="shop-submit-button" //เพิ่ม id
            type="submit"
            className="px-8 py-2 bg-green-500 text-black rounded-lg hover:bg-green-300 transition"
            disabled={loading}
          >
            ยืนยัน
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingshopModal; 