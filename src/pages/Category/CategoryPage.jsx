import { useState } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import { useCategoryContext } from "../../context/CategoryContext";
import EditCategoryModal from "./EditCategoryModal";
import CreateCategoryModal from "./CreateCategoryModal";
import CategoryList from "../../components/Category/CategoryList";

const CategoryPage = () => {
  const { categories, createCategory, updateCategory, deleteCategory, fetchCategories, loading, error } = useCategoryContext();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  const handleDelete = async (id) => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "เมื่อลบแล้วไม่สามารถกู้คืนได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteCategory(id);
          Swal.fire("ลบสำเร็จ!", "หมวดหมู่ถูกลบแล้ว", "success");
        } catch (error) {
          const message = error?.response?.data?.message;
          if (message === "ไม่สามารถลบประเภทสินค้าที่ถูกใช้งานอยู่ได้") {
            Swal.fire("ไม่สามารถลบได้!", "ไม่สามารถลบประเภทสินค้าที่ถูกใช้งานอยู่ได้", "error");
          } else {
            Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถลบหมวดหมู่ได้", "error");
          }
        }
      }
    });
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCategory(null);
    fetchCategories();
  };

  // ✅ เพิ่มลำดับจริงให้กับ array ก่อนกรอง
  const numberedCategories = categories
    .map((category, index) => ({
      ...category,
      realNumber: index + 1,
    }));

  // ✅ ใช้ลำดับจริงในการค้นหา
  const filteredCategories = numberedCategories.filter((category) => {
    const keyword = search.trim().toLowerCase();
    if (keyword === "") return true;

    return category.categoryName.toLowerCase().includes(keyword);
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  return (
    <div className="p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">รายการหมวดหมู่สินค้า</h2>
          <div className="flex gap-2">
            <input
              id="category-search-input" //เพิ่ม id
              type="text"
              placeholder="ค้นหาหมวดหมู่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button
              id="create-category-button" //เพิ่ม id
              onClick={() => setIsCreateModalOpen(true)}
              className="filter-button bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 px-4 py-2 rounded-lg"
              data-tip="เพิ่มหมวดหมู่"
            >
              <FaPlus />
              <span>เพิ่มหมวดหมู่</span>
            </button>
          </div>
        </div>
        {/* Category Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-3 gap-4 p-4 bg-purple-500 text-white font-semibold">
            <div>ลำดับ</div>
            <div>ชื่อหมวดหมู่</div>
            <div className="text-center">จัดการ</div>
          </div>
          {currentItems.map((category, index) => (
            <CategoryList
              key={category._id}
              category={category}
              index={indexOfFirstItem + index}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบหมวดหมู่สินค้า
            </div>
          )}
        </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-end items-center gap-2 p-4">
              <button
                id="category-prev-page" //เพิ่ม id
                className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ก่อนหน้า
              </button>
              <span className="text-sm text-gray-700">
                หน้า {currentPage} / {totalPages}
              </span>
              <button
                id="category-next-page" //เพิ่ม id
                className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                ถัดไป
              </button>
            </div>
          )}
      </div>
      {isEditModalOpen && (
        <EditCategoryModal category={selectedCategory} onClose={closeEditModal} />
      )}
      {isCreateModalOpen && (
        <CreateCategoryModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            fetchCategories();
          }}
          fetchCategories={fetchCategories}
        />
      )}
    </div>
  );
};

export default CategoryPage;
