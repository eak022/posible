import React from 'react';
import { FaCheck, FaEye, FaTrash, FaEdit, FaBoxOpen } from 'react-icons/fa';
import PropTypes from 'prop-types';

const PurchaseOrderList = ({ order, onReceive, onView, onDelete, onEdit, onAddStock, index }) => {
    // ตรวจสอบโครงสร้างข้อมูลซัพพลายเออร์
    const supplierName = order.supplierId?.name || order.supplierId?.companyName || 'ไม่ระบุ';

    return (
        <div className="grid grid-cols-4 gap-4 p-4 border-b hover:bg-gray-50">
            <div>{order.orderNumber || index + 1}</div>
            <div>{supplierName}</div>
            <div>{order.products?.length || 0}</div>
            <div className="flex justify-center gap-2">
                {order.status === 'pending' && (
                    <button
                        id={`po-receive-button-${order._id}`}
                        onClick={() => onReceive(order._id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                        title="รับสินค้า"
                    >
                        <FaCheck />
                    </button>
                )}
                <button
                    id={`po-edit-button-${order._id}`}
                    onClick={() => onEdit(order._id)}
                    className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                    title="แก้ไขใบสั่งซื้อ"
                >
                    <FaEdit />
                </button>
                <button
                    id={`po-view-button-${order._id}`}
                    onClick={() => onView(order._id)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                    title="ดูรายละเอียด"
                >
                    <FaEye />
                </button>
                <button
                    id={`po-delete-button-${order._id}`}
                    onClick={() => onDelete(order._id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    title="ลบ"
                >
                    <FaTrash />
                </button>
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
        status: PropTypes.string
    }).isRequired,
    onReceive: PropTypes.func.isRequired,
    onView: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onAddStock: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired
};

export default PurchaseOrderList; 