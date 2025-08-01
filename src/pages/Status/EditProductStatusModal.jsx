import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import statusService from "../../services/status.service";

const EditProductStatusModal = ({ status, onClose }) => {
  const [statusName, setStatusName] = useState(status?.statusName || "");

  useEffect(() => {
    if (status) {
      setStatusName(status.statusName);
    }
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await statusService.updateStatus(status._id, { statusName });

      // แสดง SweetAlert2 เมื่ออัปเดตสำเร็จ
      Swal.fire({
        // title: "สำเร็จ!",
        title: "แก้ไขสถานะสินค้าสำเร็จ",
        icon: "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "ยืนยัน",
      });

      onClose();
    } catch (error) {
      console.error("Error updating status:", error);

      // แสดง SweetAlert2 เมื่อเกิดข้อผิดพลาด
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่สามารถแก้ไขสถานะสินค้าได้",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "ยืนยัน",
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-black">
        <h2 className="text-xl font-semibold mb-4">แก้ไขข้อมูลสถานะสินค้า</h2>
        <form onSubmit={handleSubmit}>
          <input
            id="edit-status-name-input" //เพิ่ม id
            type="text"
            className="w-full p-2 border rounded-md"
            value={statusName}
            onChange={(e) => setStatusName(e.target.value)}
          />
          <div className="mt-4 flex justify-end space-x-2">
            <button
              id="edit-status-cancel-button" //เพิ่ม id
              type="button"
              className="p-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition"
              onClick={onClose}
            >
              ยกเลิก
            </button>
            <button
              id="edit-status-submit-button" //เพิ่ม id
              type="submit"
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductStatusModal;
