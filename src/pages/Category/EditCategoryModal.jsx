import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import categoryService from "../../services/category.service";
import { useCategoryContext } from '../../context/CategoryContext';

const EditCategoryModal = ({ category, onClose }) => {
  const [categoryName, setCategoryName] = useState(category?.categoryName || "");
  const { updateCategory } = useCategoryContext();

  useEffect(() => {
    if (category) {
      setCategoryName(category.categoryName);
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCategory(category._id, { categoryName });
      Swal.fire({
        title: "แก้ไขสถานะสินค้าสำเร็จ",
        icon: "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "ยืนยัน",
      });
      onClose();
    } catch (error) {
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
        <h2 className="text-xl font-semibold mb-4">แก้ไขข้อมูลหมวดหมู่</h2>
        <form onSubmit={handleSubmit}>
          <input
            id="edit-category-name-input" //เพิ่ม id
            type="text"
            className="w-full p-2 border rounded-md"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <div className="mt-4 flex justify-end space-x-2">
            <button 
              id="edit-category-cancel-button" //เพิ่ม id
              type="button"
              className="p-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition"
              onClick={onClose}
            >
              ยกเลิก
            </button>
            <button 
              id="edit-category-submit-button" //เพิ่ม id
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

export default EditCategoryModal;
