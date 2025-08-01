import { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPrint, FaPlus, FaTags } from "react-icons/fa";
import promotionService from "../../services/promotion.service";
import EditPromotionModal from "./EditPromotionModal";
import CreatePromotionModal from "./CreatePromotionModal";
import Swal from "sweetalert2"; // ไลบรารีสำหรับ popup
import { usePromotion } from "../../context/PromotionContext";


const PromotionPage = () => {
  const { promotions, setPromotions } = usePromotion();
  const [search, setSearch] = useState("");
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7); // แสดงกี่รายการต่อหน้า

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const data = await promotionService.getAllPromotions();
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      setPromotions([]);
    }
  };

  // ฟังก์ชันลบซัพพลายเออร์ พร้อมการยืนยันด้วย Swal
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
          await promotionService.deletePromotion(id); // เรียก API ลบ
          fetchPromotions(); // โหลดข้อมูลใหม่
          Swal.fire("ลบสำเร็จ!", "โปรโมชั่นถูกลบแล้ว", "success");
        } catch (error) {
          Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถลบโปรโมชั่นได้", "error");
        }
      }
    });
  };


  const openEditModal = (promotion) => {
    setSelectedPromotion(promotion);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPromotion(null);
    fetchPromotions();
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    fetchPromotions(); // โหลดข้อมูลโปรโมชั่นใหม่
  };

  // สร้าง array ที่ใส่ลำดับจริงก่อน
  const numberedPromotions = promotions
    .slice() // clone array
    .reverse() // ให้ลำดับล่าสุดอยู่บนสุด
    .map((promotion, index, arr) => ({
      ...promotion,
      realNumber: arr.length - index, // ใส่ลำดับจริงจากท้ายสุดขึ้นมา
    }));
  // ฟิลเตอร์ซัพพลายเออร์ตามคำค้นหา และเรียงจากรายการล่าสุดไปเก่าสุด
  const filteredPromotions = numberedPromotions.filter((promotion) => {
    const keyword = search.trim().toLowerCase();
    if (keyword === "") return true;

    // ค้นหาโดยเลขลำดับ (กรณีเป็นตัวเลข)
    if (/^\d+$/.test(keyword)) {
      return promotion.realNumber.toString() === keyword;
    }
    // ค้นหาโดยชื่อโปรโมชั่น
    return promotion.promotionName.toLowerCase().includes(keyword);
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPromotions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);

  return (
    <div className="p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">รายการโปรโมชั่น</h1>
          <div className="search-filter-container flex gap-2 items-center">
            <input 
              id="promotion-search-input" //เพิ่ม id
              type="text"
              placeholder="ค้นหาโปรโมชั่น..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button 
              id="create-promotion-button" //เพิ่ม id
              onClick={() => setIsCreateModalOpen(true)}
              className="filter-button bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 px-4 py-2 rounded-lg"
              data-tip="เพิ่มโปรโมชั่น"
            >
              <FaPlus />
              <span>เพิ่มโปรโมชั่น</span>
            </button>
          </div>
        </div>
        {/* Promotion Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-4 p-4 bg-purple-500 text-white font-semibold text-center">
            <div className="text-left pl-2">ลำดับ</div>
            <div className="text-left">ชื่อโปรโมชั่น</div>
            <div className="text-center">วันที่เริ่ม-สิ้นสุด</div>
            <div className="text-center">ราคาก่อนลด-หลังลด</div>
            <div className="text-center">จัดการ</div>
          </div>
          {currentItems.map((promotion, index) => (
            <div key={promotion._id} className="grid grid-cols-5 gap-4 px-4 py-3 border-b items-center group hover:bg-gray-100 transition-colors text-center">
              <div className="text-left pl-2 font-medium">{promotion.realNumber}</div>
              <div className="text-left ">{promotion.promotionName}</div>
              <div className="text-center">
                {new Date(promotion.validityStart).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} - {new Date(promotion.validityEnd).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-center pr-2">
                <span className="line-through text-red-500 mr-1">
                  ฿{promotion.productId?.sellingPricePerUnit ?? "-"}
                </span>
                <span className="text-green-500">
                  ฿{promotion.discountedPrice}
                </span>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  id="edit-promotion-button-<promotion._id>" //เพิ่ม id
                  className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                  onClick={() => openEditModal(promotion)}
                  title="แก้ไข"
                >
                  <FaEdit />
                </button>
                <button
                  id="delete-promotion-button-<promotion._id>" //เพิ่ม id
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  onClick={() => handleDelete(promotion._id)}
                  title="ลบ"
                >
                  <FaTrash />
                </button>
                <button
                  id="print-promotion-button-<promotion._id>" //เพิ่ม id
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                  onClick={() => handlePrint(promotion)}
                  title="ปริ้น"
                >
                  <FaPrint />
                </button>
              </div>
            </div>
          ))}
          {filteredPromotions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบโปรโมชั่น
            </div>
          )}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex justify-end items-center gap-2 p-4">
              <button 
                id="promotion-prev-page" //เพิ่ม id
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
                id="promotion-next-page" //เพิ่ม id
                className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                ถัดไป
              </button>
            </div>
          )}
        {isEditModalOpen && (
          <EditPromotionModal promotion={selectedPromotion} onClose={closeEditModal} />
        )}
        {isCreateModalOpen && (
          <CreatePromotionModal
            isOpen={isCreateModalOpen}
            onClose={closeCreateModal}
            fetchPromotions={fetchPromotions}
          />
        )}
      </div>
    </div>
  );
};

export default PromotionPage;
