import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdWarning, MdAccessTime, MdError, MdHourglassEmpty, MdInfo } from 'react-icons/md';
import { AiOutlineEdit } from 'react-icons/ai';
import { FaBox } from 'react-icons/fa';

const CardProduct = ({ product }) => {
  const navigate = useNavigate();
  const [originalStatuses, setOriginalStatuses] = useState([]);

  // ฟังก์ชันสำหรับกำหนดสี, ไอคอน, gradient ตามสถานะ (modern badge)
  const getStatusStyle = (statusName) => {
    switch (statusName) {
      case 'สินค้าใกล้หมด':
        return {
          bg: 'linear-gradient(90deg, #FFD600 0%, #FFF176 100%)',
          text: '#222',
          icon: <MdWarning style={{ color: '#222', fontSize: '1.2em', marginRight: 6 }} />
        };
      case 'สินค้าใกล้หมดอายุ':
        return {
          bg: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
          text: '#fff',
          icon: <MdAccessTime style={{ color: '#fff', fontSize: '1.2em', marginRight: 6 }} />
        };
      case 'สินค้าหมด':
        return {
          bg: 'linear-gradient(90deg, #D32F2F 0%, #FF5252 100%)',
          text: '#fff',
          icon: <MdError style={{ color: '#fff', fontSize: '1.2em', marginRight: 6 }} />
        };
      case 'หมดอายุ':
        return {
          bg: 'linear-gradient(90deg, #7B1FA2 0%, #B39DDB 100%)',
          text: '#fff',
          icon: <MdHourglassEmpty style={{ color: '#fff', fontSize: '1.2em', marginRight: 6 }} />
        };
      default:
        return {
          bg: 'linear-gradient(90deg, #BDBDBD 0%, #EEEEEE 100%)',
          text: '#222',
          icon: <MdInfo style={{ color: '#222', fontSize: '1.2em', marginRight: 6 }} />
        };
    }
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-lg p-4 w-[192px] h-[250px] text-center pb-16">
      <div className="relative -mt-16">
        <img
          src={product.productImage}
          alt={product.productName}
          className="w-40 h-40 mx-auto"
        />
      </div>
      <h2
        className="text-sm font-semibold text-black mt-2 break-words whitespace-nowrap px-2 overflow-hidden text-ellipsis"
        style={{
          maxWidth: '100%',
          cursor: 'pointer'
        }}
        title={product.productName}
      >
        {product.productName}
      </h2>
      <div className="mt-auto w-full">
        <p className="text-purple-500 text-sm font-bold">
          ฿ {product.sellingPricePerUnit}
        </p>
        <p className="text-gray-700 text-xs">มีอยู่ {(() => {
          // ✅ คำนวณจำนวนที่ขายได้ (เฉพาะล็อตที่ยังไม่หมดอายุ)
          if (product.lots && Array.isArray(product.lots)) {
            const currentDate = new Date();
            const sellableQuantity = product.lots
              .filter(lot => 
                lot.status === 'active' && 
                lot.quantity > 0 && 
                (!lot.expirationDate || new Date(lot.expirationDate) > currentDate)
              )
              .reduce((total, lot) => total + lot.quantity, 0);
            return sellableQuantity;
          }
          return product.totalQuantity || product.quantity;
        })()}</p>
        {/* Minimal Badges: แสดงทุกสถานะในบรรทัดเดียวกัน */}
        {product.productStatuses && Array.isArray(product.productStatuses) && product.productStatuses.length > 0 && (
          <div className="flex flex-row flex-nowrap justify-center items-center gap-1 mt-1 mb-1 overflow-x-auto max-w-full">
            {product.productStatuses
              .filter((status, idx, arr) =>
                ['สินค้าใกล้หมด', 'สินค้าใกล้หมดอายุ', 'สินค้าหมด'].includes(status.statusName) &&
                arr.findIndex(s => s.statusName === status.statusName) === idx
              )
              .map((status, index) => {
                const style = getStatusStyle(status.statusName);
                return (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold truncate"
                    style={{
                      background: style.bg,
                      color: style.text,
                      maxWidth: 110,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={status.statusName}
                  >
                    {style.icon}
                    <span className="truncate">{status.statusName}</span>
                  </span>
                );
              })}
          </div>
        )}
      </div>
      {/* Footer  */}
      <div className="absolute bottom-0 left-0 w-full flex">
        <button
          className="flex-1 bg-orange-50 text-orange-600 font-semibold text-center py-2 transition-all duration-300 hover:bg-orange-100 rounded-bl-2xl flex items-center justify-center gap-1 border border-orange-200"
          onClick={() => navigate(`/products/edit-product/${product._id}`)}
        >
          <AiOutlineEdit className="w-4 h-4" />
          Edit
        </button>
        <button
          className="flex-1 bg-blue-50 text-blue-600 font-semibold text-center py-2 transition-all duration-300 hover:bg-blue-100 rounded-br-2xl flex items-center justify-center gap-1 border border-blue-200"
          onClick={() => navigate(`/products/lots/${product._id}`)}
        >
          <FaBox className="w-4 h-4" />
          Lots
        </button>
      </div>
    </div>
  );
};

export default CardProduct;
