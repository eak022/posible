import { useState } from "react";
import Swal from "sweetalert2";
import statusService from "../../services/status.service";

const CreateProductStatusModal = ({ isOpen, onClose, fetchStatuses }) => {
  const [statusName, setStatusName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!statusName.trim()) {
      Swal.fire({
        title: "แจ้งเตือน",
        text: "กรุณากรอกชื่อสถานะสินค้า",
        icon: "warning",
        confirmButtonColor: "#ffcc00",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    setLoading(true);
    try {
      await statusService.createStatus({ statusName });

      Swal.fire({
        // title: "สำเร็จ!",
        title: "เพิ่มสถานะสินค้าสำเร็จ",
        icon: "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "ยืนยัน",
      });

      setStatusName(""); // เคลียร์ช่องอินพุต
      fetchStatuses(); // โหลดข้อมูลสถานะใหม่
      onClose();
    } catch (error) {
      console.error("Error creating status:", error);

      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่สามารถเพิ่มสถานะสินค้าได้",
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
        <h2 className="text-xl font-semibold mb-4 text-black">ข้อมูลสถานะสินค้า</h2>
        <input
          id="create-status-name-input" //เพิ่ม id
          type="text"
          placeholder="ชื่อสถานะสินค้า"
          value={statusName}
          onChange={(e) => setStatusName(e.target.value)}
          className="p-2 border rounded-md w-full"
        />
        <div className="flex justify-end mt-4 space-x-2">
          <button 
            id="create-status-cancel-button" //เพิ่ม id
            className="p-2 bg-[#FE6F71] text-white rounded-md hover:bg-[#e85b5d] transition"
            onClick={onClose}
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            id="create-status-submit-button" //เพิ่ม id
            className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProductStatusModal;
