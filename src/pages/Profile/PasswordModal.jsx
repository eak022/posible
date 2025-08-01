import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import Swal from "sweetalert2";

const PasswordModal = ({ isOpen, onClose, onPasswordUpdate }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };
  
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      return Swal.fire({ icon: 'error', title: 'รหัสผ่านใหม่ไม่ตรงกัน' });
    }
    setLoading(true);
    try {
      const res = await onPasswordUpdate({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      Swal.fire({ 
        icon: 'success', 
        title: 'เปลี่ยนรหัสผ่านเสร็จสิ้น', 
        text: res.message,
        timer: 1500,
        showConfirmButton: false,
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      onClose();
    } catch (error) {
       Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.response?.data?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-black">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h3>
          <button 
          id="password-close-button" //เพิ่ม id
          onClick={onClose} 
          className="btn btn-sm btn-circle btn-ghost">
            <IoMdClose size={24}/>
          </button>
        </div>
        <form onSubmit={handleUpdatePassword} className="space-y-5">
           <input
            id="password-current-input" //เพิ่ม id
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            className="input input-bordered w-full bg-slate-200 p-4 text-lg"
            disabled={loading}
            placeholder="รหัสผ่านปัจจุบัน"
            required
          />
          <input
            id="password-new-input" //เพิ่ม id
            type="password"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            className="input input-bordered w-full bg-slate-200 p-4 text-lg"
            disabled={loading}
            placeholder="รหัสผ่านใหม่"
            required
          />
           <input
            id="password-confirm-input" //เพิ่ม id
            type="password"
            name="confirmNewPassword"
            value={passwordData.confirmNewPassword}
            onChange={handlePasswordChange}
            className="input input-bordered w-full bg-slate-200 p-4 text-lg"
            disabled={loading}
            placeholder="ยืนยันรหัสผ่านใหม่"
            required
          />
          <div className="flex justify-end pt-4">
            <button 
              id="password-submit-button" //เพิ่ม id
             type="submit" 
             className="btn btn-primary" 
             disabled={loading}>
              {loading ? "กำลังเปลี่ยน..." : "ยืนยัน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal; 