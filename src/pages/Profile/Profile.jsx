import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaEdit, FaUserCircle, FaUser, FaPhone } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import userService from "../../services/user.service";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await userService.getProfile();
        setUser(data);
      } catch (e) {
        console.error("Error fetching user data:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const InfoRow = ({ label, value, icon }) => (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-xl w-full">
        <span className="text-slate-500">{icon}</span>
        <span className="text-black font-semibold text-lg">{value || "-"}</span>
      </div>
    </div>
  );

  return (
    <div className="text-black flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-8">
          <button 
          id="profile-back-button"
          onClick={() => {
            if (location.state?.fromEdit) {
              navigate(-2);
            } else {
              navigate(-1);
            }
          }}
          className="btn btn-ghost btn-circle">
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-3xl font-bold text-slate-800">ข้อมูลส่วนตัว</h1>
          <div className="w-10"></div>
        </div>

        {loading ? (
          <div className="text-center p-10">
            <span 
            className="loading loading-lg loading-spinner text-primary"
            ></span>
          </div>
        ) : user ? (
          <>
            <div className="flex flex-col items-center mb-10">
              <div className="avatar">
                <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4">
                  {user.profileImage ? (
                    <img 
                    src={user.profileImage} 
                    alt="Profile" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <FaUserCircle className="w-24 h-24 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-xl font-bold mt-5 text-gray-500">{"ผู้ใช้งาน"}</h2>
            </div>

            <div className="space-y-5">
              <InfoRow 
              id="profile-username" //เพิ่ม id
              label="ชื่อผู้ใช้" 
              value={user.username} 
              icon={<FaUser size={15} />} 
              />
              <InfoRow
              id="profile-phone"
              label="เบอร์โทรศัพท์" //เพิ่ม id
              value={user.phoneNumber} 
              icon={<FaPhone size={15} />} 
              />
            </div>

            <div className="flex justify-end mt-10">
              <button 
                id="profile-edit-button" //เพิ่ม id
                className="btn btn-warning flex gap-2"
                onClick={() => navigate("/edit-profile")}
              >
                <FaEdit /> แก้ไขข้อมูลส่วนตัว
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-10">
            <p className="text-red-500 font-semibold">ไม่สามารถโหลดข้อมูลผู้ใช้ได้</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
