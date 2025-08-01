import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import PropTypes from 'prop-types';

const CategoryList = ({ category, onEdit, onDelete, index }) => {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 border-b hover:bg-gray-50">
      <div>{index + 1}</div>
      <div>{category.categoryName}</div>
      <div className="flex justify-center gap-2">
        <button
          id={`edit-category-button-${category._id}`} //เพิ่ม id ตาม category._id
          onClick={() => onEdit(category)}
          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
          title="แก้ไขหมวดหมู่"
        >
          <FaEdit />
        </button>
        <button
          id={`delete-category-button-${category._id}`} //เพิ่ม id ตาม category._id
          onClick={() => onDelete(category._id)}
          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
          title="ลบ"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

CategoryList.propTypes = {
  category: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    categoryName: PropTypes.string.isRequired
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired
};

export default CategoryList; 