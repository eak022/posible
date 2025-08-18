import React, { useEffect, useState, useRef } from "react";
import { FaArrowLeft, FaEdit, FaUserCircle, FaKey } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import userService from "../../services/user.service";
import Swal from "sweetalert2";
import useAuthStore from "../../store/useAuthStore";
import PasswordModal from "./PasswordModal";

const EditProfile = () => {
  const navigate = useNavigate();
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);
  const [userData, setUserData] = useState({
    username: "",
    phoneNumber: "",
    profileImage: "",
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userService.getProfile();
        setUserData({
          username: data.username || "",
          phoneNumber: data.phoneNumber || "",
          profileImage: data.profileImage || "",
        });
        setPreviewImage(data.profileImage);
      } catch (e) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
        });
      }
    };
    fetchUser();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (userData.phoneNumber.length !== 10) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก",
        confirmButtonText: "ตกลง",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("username", userData.username);
    formData.append("phoneNumber", userData.phoneNumber);
    if (profileImageFile) {
      formData.append("profileImage", profileImageFile);
    }
    
    try {
      const res = await userService.updateProfile(formData);
      updateUserProfile(res.user);

      Swal.fire({
        icon: "success",
        title: "บันทึกข้อมูลเสร็จสิ้น",
        text: res.message,
        timer: 1500,
        showConfirmButton: false,
      });
      setTimeout(() => navigate("/profile"), 1500);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.response?.data?.message || "ไม่สามารถอัพเดทโปรไฟล์ได้",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordUpdate = (passwordData) => {
    return userService.updatePassword(passwordData);
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-lg text-black">
          <div className="flex justify-between items-center mb-8">
            <button 
            id="edit-profile-back-button" //เพิ่ม id
            onClick={() => navigate("/profile", { state: { fromEdit: true }, replace: true })} 
            className="btn btn-ghost btn-circle">
              <FaArrowLeft className="text-xl" />
            </button>
            <h1 className="text-3xl font-bold text-slate-800">แก้ไขข้อมูลส่วนตัว</h1>
            <div className="w-10"></div>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="mb-8">
            <div className="flex flex-col items-center mb-6">
              <div 
              id="edit-profile-avatar" //เพิ่ม id
              className="avatar relative cursor-pointer" 
              onClick={() => fileInputRef.current.click()}>
                <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile Preview" />
                  ) : (
                    <FaUserCircle className="w-full h-full text-gray-300" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 bg-gray-200 p-1 rounded-full">
                  <FaEdit className="text-gray-600" />
                </span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
            </div>
            
            <div className="space-y-5">
               <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">ชื่อผู้ใช้</label>
                  <input 
                  id="edit-profile-username-input" //เพิ่ม id
                  name="username" 
                  value={userData.username} 
                  onChange={handleInputChange} 
                  placeholder="ชื่อผู้ใช้" 
                  className="input input-bordered w-full text-lg bg-slate-100 p-4" 
                  required 
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">เบอร์โทรศัพท์</label>
                  <input 
                  id="edit-profile-phone-input" //เพิ่ม id
                  name="phoneNumber" 
                  value={userData.phoneNumber} 
                  onChange={e => {
                    // รับเฉพาะตัวเลขและไม่เกิน 10 ตัว
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setUserData({ ...userData, phoneNumber: value });
                  }} placeholder="เบอร์โทร" className="input input-bordered w-full text-lg bg-slate-100 p-4" maxLength={10} />
               </div>
            </div>
            
            <div className="flex justify-end items-center mt-10 gap-4">
               <button 
               id="edit-profile-submit-button" //เพิ่ม id
                type="submit" 
                className="btn btn-success" 
                disabled={loading}>
                 {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
               </button>
             </div>
          </form>

          {/* Password update button */}
          <div className="border-t pt-6 text-center"> 
            <button 
              id="edit-profile-password-button" //เพิ่ม id
              onClick={() => setIsPasswordModalOpen(true)}
              className="btn btn-outline btn-secondary flex items-center gap-2 mx-auto"
            >
              <FaKey />
              เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </div>
      </div>
      <PasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)}
        onPasswordUpdate={handlePasswordUpdate}
      />
    </>
  );
};

export default EditProfile;
