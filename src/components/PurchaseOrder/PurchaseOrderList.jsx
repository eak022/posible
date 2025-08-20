import React from 'react';
import { FaCheck, FaEye, FaTrash, FaEdit, FaTruck, FaCheckDouble, FaFileAlt, FaBoxes, FaClipboardCheck, FaReceipt } from 'react-icons/fa';
import PropTypes from 'prop-types';

const PurchaseOrderList = ({ order, onReceive, onReceiveFromDelivery, onUpdateDelivery, onViewOrder, onViewReceipt, onDelete, onEdit, onAddStock, index, isReceivePage = false }) => {
    // ตรวจสอบโครงสร้างข้อมูลซัพพลายเออร์
    const supplierName = order.supplierId?.name || order.supplierId?.companyName || 'ไม่ระบุ';

    // ฟังก์ชันสำหรับแสดงสถานะการส่งมอบ
    const getDeliveryStatusText = (status) => {
        // เมื่อเติมสินค้าแล้ว ให้แสดงเป็น "ส่งมอบครบแล้ว" เท่านั้น
        if (status === 'fully_delivered' || status === 'completed') {
            return { text: 'ส่งมอบครบแล้ว', color: 'bg-green-100 text-green-800' };
        } else {
            return { text: 'รอส่งมอบ', color: 'bg-gray-100 text-gray-800' };
        }
    };

    const deliveryStatus = getDeliveryStatusText(order.deliveryStatus);

    // ตรวจสอบว่าสินค้าถูกเติมแล้วหรือไม่ (เฉพาะในหน้าจัดการใบสั่งของ)
    const isStockAdded = order.deliveryStatus === 'fully_delivered' || order.status === 'completed';

    return (
        <div className="grid grid-cols-5 gap-4 p-4 border-b items-center">
            <div>{order.orderNumber || index + 1}</div>
            <div>{supplierName}</div>
            <div>{order.products?.length || 0}</div>
            <div>
                <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${deliveryStatus.color} transition-colors`}>
                    {deliveryStatus.text}
                </span>
            </div>
            <div className="flex justify-center gap-2">
                {/* แสดงปุ่มอัปเดตข้อมูลการส่งมอบเฉพาะในหน้ารับสินค้า */}
                {isReceivePage && (
                    <button
                        id={`po-update-delivery-button-${index}`}
                        onClick={() => onUpdateDelivery(order._id)}
                        className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        title={order.status === 'completed' ? 'แก้ไขข้อมูลการรับสินค้า' : 'อัพเดทข้อมูลการส่งมอบและรับสินค้า'}
                    >
                        <FaClipboardCheck />
                    </button>
                )}

                {/* แสดงปุ่มแก้ไขเฉพาะเมื่อยังไม่มีการเติมสินค้า (เฉพาะในหน้าจัดการใบสั่งของ) */}
                {!isReceivePage && !isStockAdded && (
                    <button
                        id={`po-edit-button-${index}`}
                        onClick={() => onEdit(order._id)}
                        className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                        title="แก้ไขใบสั่งซื้อ"
                    >
                        <FaEdit />
                    </button>
                )}

                {/* ปุ่มดูรายละเอียดใบสั่งซื้อ (เฉพาะในหน้าจัดการใบสั่งของ) */}
                {!isReceivePage && (
                    <button
                        id={`po-view-order-button-${index}`}
                        onClick={() => onViewOrder(order._id)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        title="ดูรายละเอียดใบสั่งซื้อ"
                    >
                        <FaFileAlt />
                    </button>
                )}

                {/* ปุ่มดูรายละเอียดใบรับสินค้า (เฉพาะในหน้ารับสินค้า) */}
                {isReceivePage && (
                    <button
                        id={`po-view-receipt-button-${index}`}
                        onClick={() => onViewReceipt(order._id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        title="ดูรายละเอียดใบรับสินค้า"
                    >
                        <FaReceipt />
                    </button>
                )}

                {/* แสดงปุ่มลบเฉพาะเมื่อยังไม่ส่งมอบครบแล้ว */}
                {!(order.deliveryStatus === 'fully_delivered' || order.status === 'completed') && (
                    <button
                        id={`po-delete-button-${index}`}
                        onClick={() => onDelete(order._id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        title="ลบ"
                    >
                        <FaTrash />
                    </button>
                )}
            </div>
        </div>
    );
};

PurchaseOrderList.propTypes = {
    order: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        orderNumber: PropTypes.number,
        supplierId: PropTypes.oneOfType([
            PropTypes.shape({
                name: PropTypes.string,
                supplierName: PropTypes.string
            }),
            PropTypes.string
        ]),
        products: PropTypes.array,
        status: PropTypes.string,
        deliveryStatus: PropTypes.string
    }).isRequired,
    onViewOrder: PropTypes.func.isRequired,
    onViewReceipt: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    isReceivePage: PropTypes.bool,
    // Optional props for receive page
    onUpdateDelivery: PropTypes.func
};

export default PurchaseOrderList; 