import React from "react";
import { FaTags } from "react-icons/fa";

const Card = ({ product, handleAddToCart, promotionMap }) => {
  const hasPromotion = Boolean(promotionMap?.[product._id]);

  const handleClick = () => {
    handleAddToCart(product);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(price);
  };

  const currentPrice = product.sellingPricePerUnit;

  return (
    <div
      className="relative bg-white rounded-2xl shadow-lg p-4 w-[192px] h-[280px] text-center pb-16 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={handleClick}
    >
      {/* แสดงตัวบ่งชี้ว่ามีโปร (เล็ก กระชับ ไม่นำเสนอราคา) */}
      {hasPromotion && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <FaTags size={10} />
            <span>โปรโมชั่น</span>
          </div>
        </div>
      )}

      <div className="relative -mt-16">
        <img
          src={product.productImage}
          alt={product.productName}
          className="w-40 h-40 mx-auto object-cover rounded-lg"
        />
      </div>

      <h2 
        className="text-sm mt-10 font-semibold text-black  break-words whitespace-nowrap px-2 overflow-hidden text-ellipsis truncates" 
        title={product.productName}
      >
        {product.productName}
      </h2>

      <div className="mt-auto w-full">
        {/* ราคา */}
        <div className="flex flex-col items-center gap-1 mt-1">
          <p className="text-purple-500 text-sm font-bold">
            {formatPrice(currentPrice)}
          </p>
        </div>

        {/* สถานะสินค้า */}
        <p className="text-gray-700 text-xs mt-1">
          มีอยู่ {product.totalQuantity || product.quantity || 0} {product.totalQuantity || product.quantity > 0 ? 'ชิ้น' : 'ชิ้น'}
        </p>

        {/* ไม่แสดงสถานะโปรโมชั่น */}
      </div>
    </div>
  );
};

export default Card;
