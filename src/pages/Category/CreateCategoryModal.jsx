import React, { useState } from 'react';
import { useCategoryContext } from '../../context/CategoryContext';
import Swal from 'sweetalert2';

const CreateCategoryModal = ({ isOpen, onClose }) => {
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(false);
    const { createCategory } = useCategoryContext();

    const handleCreate = async () => {
        if (!categoryName.trim()) {
            Swal.fire({
                title: "แจ้งเตือน",
                text: "กรุณากรอกชื่อประเภทสินค้า",
                icon: "warning",
                confirmButtonColor: "#ffcc00",
                confirmButtonText: "ตกลง",
            });
            return;
        }
    
        setLoading(true);
        try {
            await createCategory({ categoryName });
            Swal.fire({
                title: "เพิ่มประเภทสินค้าสำเร็จ",
                text: "เพิ่มหมวดหมู่สำเร็จ",
                icon: "success",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "ยืนยัน",
            });
            setCategoryName("");
            onClose();
        } catch (error) {
            Swal.fire({
                title: "เกิดข้อผิดพลาด!",
                text: "ไม่สามารถเพิ่มประเภทสินค้าได้",
                icon: "error",
                confirmButtonColor: "#d33",
                confirmButtonText: "ยืนยัน",
            });
        }
        setLoading(false);
    };

    const handleCancel = () => {
        setCategoryName("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4 text-black">ข้อมูลประเภทสินค้า</h2>
                <input
                    id="create-category-name-input" //เพิ่ม id
                    type="text"
                    placeholder="ชื่อประเภทสินค้า"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="p-2 border rounded-md w-full"
                />
                <div className="flex justify-end mt-4 space-x-2">
                    <button
                        id="create-category-cancel-button" //เพิ่ม id
                        className="p-2 bg-[#FE6F71] text-white rounded-md hover:bg-[#e85b5d] transition"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        ยกเลิก
                    </button>
                    <button
                        id="create-category-submit-button" //เพิ่ม id
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

export default CreateCategoryModal;
