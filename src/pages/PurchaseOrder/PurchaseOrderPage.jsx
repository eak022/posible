import { useState, useEffect } from 'react';
import purchaseOrderService from '../../services/purchaseOrder.service';
import supplierService from '../../services/supplier.service';
import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import PurchaseOrderList from '../../components/PurchaseOrder/PurchaseOrderList';
import PurchaseOrderDetail from '../../components/PurchaseOrder/PurchaseOrderDetail';
import { usePurchaseOrder } from "../../context/PurchaseOrderContext";

const PurchaseOrderPage = () => {
    const { purchaseOrders, setPurchaseOrders } = usePurchaseOrder();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);

    useEffect(() => {
        fetchPurchaseOrders();
    }, []);

    const fetchPurchaseOrders = async () => {
        try {
            const response = await purchaseOrderService.getAllPurchaseOrders();
            const orders = Array.isArray(response) ? response : response.purchaseOrders || [];
            
            // ดึงข้อมูลซัพพลายเออร์สำหรับทุกใบสั่งของ
            const ordersWithSupplier = await Promise.all(
                orders.map(async (order) => {
                    if (order.supplierId) {
                        try {
                            // ตรวจสอบว่า supplierId เป็น object หรือ string
                            const supplierId = typeof order.supplierId === 'object' 
                                ? order.supplierId._id 
                                : order.supplierId;
                            
                            const supplierData = await supplierService.getSupplierById(supplierId);
                            return {
                                ...order,
                                supplierId: supplierData
                            };
                        } catch (error) {
                            console.error(`Error fetching supplier for order ${order._id}:`, error);
                            return order;
                        }
                    }
                    return order;
                })
            );

            setPurchaseOrders(ordersWithSupplier);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            Swal.fire({ icon: 'error', title: 'ไม่สามารถโหลดข้อมูลใบสั่งของได้' });
            setPurchaseOrders([]);
            setLoading(false);
        }
    };

    const handleReceiveStock = async (id) => {
        try {
            const result = await Swal.fire({
                title: 'ยืนยันการรับสินค้า',
                text: 'คุณต้องการยืนยันการรับสินค้าตามใบสั่งของนี้ใช่หรือไม่?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก'
            });

            if (result.isConfirmed) {
                await purchaseOrderService.receiveStock(id);
                await Swal.fire('สำเร็จ', 'รับสินค้าเรียบร้อยแล้ว', 'success');
                fetchPurchaseOrders();
            }
        } catch (error) {
            console.error('Error receiving stock:', error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถรับสินค้าได้', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            const result = await Swal.fire({
                title: 'ยืนยันการลบ',
                text: 'คุณต้องการลบใบสั่งของนี้ใช่หรือไม่?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'ลบ',
                cancelButtonText: 'ยกเลิก'
            });

            if (result.isConfirmed) {
                await purchaseOrderService.deletePurchaseOrder(id);
                await Swal.fire('สำเร็จ', 'ลบใบสั่งของเรียบร้อยแล้ว', 'success');
                fetchPurchaseOrders();
            }
        } catch (error) {
            console.error('Error deleting purchase order:', error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบใบสั่งของได้', 'error');
        }
    };

    const handleView = (id) => {
        setSelectedOrderId(id);
    };

    const handleCloseModal = () => {
        setSelectedOrderId(null);
    };

    const handleEdit = (id) => {
        navigate(`/editpurchase-order/${id}`);
    };

    const handleAddStock = (id) => {
        navigate(`/purchase-orders/${id}/add-stock`);
    };

    const filteredPurchaseOrders = purchaseOrders
        .filter(order => 
            order?.supplierId?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order?.supplierId?.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order?.orderNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPurchaseOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPurchaseOrders.length / itemsPerPage);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">กำลังโหลด...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">รายการใบสั่งของ</h1>
                    <div className="search-filter-container">
                        <input
                            type="text"
                            id="purchase-order-search-input"
                            placeholder="ค้นหาตามเลขใบสั่งของ หรือ ชื่อซัพพลายเออร์"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <button
                            id="create-purchase-order-button"
                            onClick={() => navigate('/create-purchase-order')}
                            className="filter-button bg-purple-600 text-white hover:bg-purple-700"
                        >
                            <FaPlus />
                            <span>สร้างใบสั่งของ</span>
                        </button>
                    </div>
                </div>

                {/* Purchase Orders Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="grid grid-cols-4 gap-4 p-4 bg-purple-500 text-white font-semibold">
                        <div>เลขใบสั่งของ</div>
                        <div>ซัพพลายเออร์</div>
                        <div>จำนวนรายการสินค้า</div>
                        <div className="text-center">จัดการ</div>
                    </div>

                    {currentItems.map((order, index) => (
                        <PurchaseOrderList
                            key={order._id}
                            order={order}
                            index={index}
                            onReceive={handleReceiveStock}
                            onView={handleView}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onAddStock={handleAddStock}
                        />
                    ))}

                    {filteredPurchaseOrders.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            ไม่พบรายการใบสั่งของ
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-end items-center gap-2 p-4">
                        <button
                            id="purchase-order-prev-page"
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
                            id="purchase-order-next-page"
                            className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            ถัดไป
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedOrderId && (
                <PurchaseOrderDetail
                    id={selectedOrderId}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default PurchaseOrderPage; 