import { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import productStatusService from "../../services/status.service";
import EditProductStatusModal from "./EditProductStatusModal";
import CreateProductStatusModal from "./CreateProductStatusModal";
import ProductStatusList from "../../components/Status/ProductStatusList";
import { useStatus } from "../../context/StatusContext";

const ProductStatusPage = () => {
  const { statuses, setStatuses } = useStatus();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const data = await productStatusService.getAllStatuses();
      if (Array.isArray(data)) {
        setStatuses(data);
      } else {
        setStatuses([]);
      }
    } catch (error) {
      setStatuses([]);
    }
    setLoading(false);
  };

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
          await productStatusService.deleteStatus(id);
          fetchStatuses();
          Swal.fire("ลบสำเร็จ!", "สถานะสินค้าถูกลบแล้ว", "success");
        } catch (error) {
          const message = error?.response?.data?.message;
          if (message === "สถานะหลักไม่สามารถลบได้") {
            Swal.fire("ไม่สามารถลบได้!", "สถานะหลักไม่สามารถลบได้", "error");
          } else {
            Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถลบสถานะสินค้าได้", "error");
          }
        }
      }
    });
  };

  const openEditModal = (status) => {
    setSelectedStatus(status);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedStatus(null);
    fetchStatuses();
  };

  const filteredStatuses = statuses.filter((status) =>
    status.statusName.toLowerCase().includes(search.toLowerCase())
  );


  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStatuses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStatuses.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">รายการสถานะสินค้า</h1>
          <div className="flex gap-2 items-center">
            <input 
              id="status-search-input" //เพิ่ม id
              type="text"
              placeholder="ค้นหาสถานะสินค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button
              id="create-status-button" //เพิ่มid
              onClick={() => setIsCreateModalOpen(true)}
              className="filter-button bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <FaPlus/>
              <span >เพิ่มสถานะสินค้า</span>
            </button>
          </div>
        </div>
        {/* Status Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-3 gap-4 p-4 bg-purple-500 text-white font-semibold">
            <div>ลำดับ</div>
            <div>ชื่อสถานะสินค้า</div>
            <div className="text-center">จัดการ</div>
          </div>
          {currentItems.map((status, index) => (
            <ProductStatusList
              key={status._id}
              status={status}
              index={indexOfFirstItem + index}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
          {filteredStatuses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบรายการสถานะสินค้า
            </div>
          )}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex justify-end items-center gap-2 p-4">
              <button
                id="status-prev-page" //เพิ่ม id
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
                id="status-next-page" //เพิ่ม id
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
        <EditProductStatusModal status={selectedStatus} onClose={closeEditModal} />
      )}
      {isCreateModalOpen && (
        <CreateProductStatusModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            fetchStatuses();
          }}
          fetchStatuses={fetchStatuses}
        />
      )}
    </div>
  );
};

export default ProductStatusPage;
