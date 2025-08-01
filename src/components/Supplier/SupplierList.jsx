import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import PropTypes from 'prop-types';

const SupplierList = ({ supplier, onEdit, onDelete, index }) => {
  return (
    <div className="grid grid-cols-4 gap-4 p-4 border-b items-center hover:bg-gray-50">
      <div>{index + 1}</div>
      <div>{supplier.companyName}</div>
      <div>{supplier.phoneNumber}</div>
      <div className="flex justify-center gap-2">
        <button 
          id='edit-supplier-button-<supplier._id>' //เพิ่ม id
          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
          title="แก้ไขซัพพลายเออร์"
          onClick={() => onEdit(supplier)}
        >
          <FaEdit />
        </button>
        <button
          id='delete-supplier-button-<supplier._id>'//เพิ่ม id
          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
          title="ลบซัพพลายเออร์"
          onClick={() => onDelete(supplier._id)}
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

SupplierList.propTypes = {
  supplier: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    companyName: PropTypes.string.isRequired,
    phoneNumber: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired
};

export default SupplierList; 