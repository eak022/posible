import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import PropTypes from 'prop-types';

const ProductStatusList = ({ status, onEdit, onDelete, index }) => {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 border-b items-center hover:bg-gray-50">
      <div>{index + 1}</div>
      <div>{status.statusName}</div>
      <div className="flex justify-center gap-2">
        <button
          id='edit-status-button-<status._id>'//เพิ่ม id
          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
          title="แก้ไขสถานะสินค้า"
          onClick={() => onEdit(status)}
        >
          <FaEdit />
        </button>
        <button
           id='delete-status-button-<status._id>'//เพิ่ม id
          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
          title="ลบสถานะสินค้า"
          onClick={() => onDelete(status._id)}
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

ProductStatusList.propTypes = {
  status: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    statusName: PropTypes.string.isRequired
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired
};

export default ProductStatusList; 