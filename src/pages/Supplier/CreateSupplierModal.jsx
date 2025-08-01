import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import supplierService from "../../services/supplier.service";

const CreateSupplierModal = ({ isOpen, onClose, fetchSuppliers }) => {
  const [supplierName, setSupplierName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supplierService || typeof supplierService.createSupplier !== "function") {
      console.error("supplierService is not properly imported or undefined");
    }
  }, []);

  const handleCreate = async () => {
    // ตรวจสอบให้แน่ใจว่าได้กรอกข้อมูลครบถ้วน
    if (!supplierName.trim() || !contactName.trim() || !contactPhone.trim() || !address.trim()) {
      Swal.fire({
        title: "แจ้งเตือน",
        text: "กรุณากรอกข้อมูลให้ครบถ้วน",
        icon: "warning",
        confirmButtonColor: "#ffcc00",
        confirmButtonText: "ตกลง",
      });
      return;
    }
  
    setLoading(true);
    try {
      // ส่งข้อมูลที่จำเป็นไปที่ Backend (ไม่ใช้ email)
      const supplierData = { 
        companyName: supplierName, 
        sellerName: contactName, 
        phoneNumber: contactPhone, 
        address,
      };
  
      console.log("Final supplierData before sending:", JSON.stringify(supplierData, null, 2));
  
      const response = await supplierService.createSupplier(supplierData);
      console.log("Response from API:", response);
  
      Swal.fire({
        title: "เพิ่มซัพพลายเออร์สำเร็จ",
        icon: "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "ยืนยัน",
      });
  
      // รีเซ็ตข้อมูลหลังจากการสร้างสำเร็จ
      setSupplierName("");
      setContactName("");
      setContactPhone("");
      setAddress("");
  
      fetchSuppliers();
      onClose();
    } catch (error) {
      console.error("Error creating supplier:", error.response?.data || error.message);
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: error.response?.data?.message || "ไม่สามารถเพิ่มซัพพลายเออร์ได้",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "ยืนยัน",
      });
    }
    setLoading(false);
  };
  
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4 text-black">ข้อมูลซัพพลายเออร์</h2>
        <input 
        id="create-supplier-name-input" //เพิ่ม id
        type="text" 
        placeholder="ชื่อซัพพลายเออร์" 
        value={supplierName} 
        onChange={(e) => setSupplierName(e.target.value)} 
        className="p-2 border rounded-md w-full mb-4" 
        />
        <input 
        id="create-supplier-contact-input" //เพิ่ม id
        type="text" 
        placeholder="ชื่อผู้ติดต่อ" 
        value={contactName} onChange={(e) => setContactName(e.target.value)} 
        className="p-2 border rounded-md w-full mb-4" 
        />
        <input 
        id="create-supplier-phone-input" //เพิ่ม id
        type="tel" 
        placeholder="เบอร์โทรศัพท์ผู้ติดต่อ" 
        value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} 
        className="p-2 border rounded-md w-full mb-4" 
        />
        <textarea 
        id="create-supplier-address-input" //เพิ่ม id
        type="text" 
        placeholder="ที่อยู่" 
        value={address} onChange={(e) => setAddress(e.target.value)} 
        className="p-2 border rounded-md w-full mb-4" 
        />

        <div className="flex justify-end mt-4 space-x-2">
          <button 
          id="create-supplier-cancel-button" //เพิ่ม id
          className="p-2 bg-[#FE6F71] text-white rounded-md hover:bg-[#e85b5d] transition" 
          onClick={onClose} disabled={loading}>
            ยกเลิก
          </button>

          <button 
          id="create-supplier-submit-button" //เพิ่ม id
          className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition" 
          onClick={handleCreate} 
          disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default CreateSupplierModal;