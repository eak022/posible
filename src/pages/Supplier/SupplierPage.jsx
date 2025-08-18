import { useState, useEffect } from "react";
import supplierService from "../../services/supplier.service";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import CreateSupplierModal from "./CreateSupplierModal";
import EditSupplierModal from "./EditSupplierModal";
import SupplierList from "../../components/Supplier/SupplierList";
import { useSupplier } from "../../context/SupplierContext";

const SupplierPage = () => {
  const { suppliers, setSuppliers } = useSupplier();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ฟังก์ชันดึงข้อมูลซัพพลายเออร์ทั้งหมดจาก backend
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await supplierService.getAllSuppliers();
      if (Array.isArray(data)) {
        setSuppliers(data);
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      setSuppliers([]);
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
          await supplierService.deleteSupplier(id); // เรียก API ลบ
          fetchSuppliers(); // โหลดข้อมูลใหม่
          Swal.fire("ลบสำเร็จ!", "ซัพพลายเออร์ถูกลบแล้ว", "success");
        } catch (error) {
          Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถลบซัพพลายเออร์ได้", "error");
        }
      }
    });
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier); // กำหนดซัพพลายเออร์ที่ต้องการแก้ไข
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedSupplier(null);
    setIsEditModalOpen(false);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    supplier.sellerName?.toLowerCase().includes(search.toLowerCase()) ||
    supplier.phoneNumber?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

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
          <h1 className="text-2xl font-semibold">รายการซัพพลายเออร์</h1>
          <div className="flex gap-2 items-center">
            <input
              id="supplier-search-input" //เพิ่ม id
              type="text"
              placeholder="ค้นหาซัพพลายเออร์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button
              id="create-supplier-button" //เพิ่ม id
              onClick={openModal}
              className="supplier-add-btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <FaPlus size={16} className="text-white" />
              <span className="whitespace-nowrap text-sm">เพิ่มซัพพลายเออร์</span>
            </button>
          </div>
        </div>

        {/* Supplier Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-4 bg-purple-500 text-white font-semibold">
            <div>ลำดับ</div>
            <div>ชื่อซัพพลายเออร์</div>
            <div>เบอร์โทร</div>
            <div className="text-center">จัดการ</div>
          </div>

          {currentItems.map((supplier, index) => (
            <SupplierList
              key={supplier._id}
              supplier={supplier}
              index={indexOfFirstItem + index}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบรายการซัพพลายเออร์
            </div>
          )}
        </div>
           {/* Pagination Controls */}
           {totalPages > 1 && (
            <div className="flex justify-end items-center gap-2 p-4">
              <button 
                id="supplier-prev-page" //เพิ่ม id
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
                id="supplier-next-page" //เพิ่ม id
                className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                ถัดไป
              </button>
            </div>
          )}
      </div>

      {/* CreateSupplierModal */}
      <CreateSupplierModal
        isOpen={isModalOpen}
        onClose={closeModal}
        fetchSuppliers={fetchSuppliers}
      />
      {/* EditSupplierModal */}
      <EditSupplierModal
        supplierId={selectedSupplier?._id}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        updateSupplier={async (id, data) => {
          await supplierService.updateSupplier(id, data);
          fetchSuppliers(); // Refresh ข้อมูลหลังจากแก้ไขสำเร็จ
        }}
      />
    </div>
  );
};

export default SupplierPage;
