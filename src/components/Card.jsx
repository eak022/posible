import React, { useState, useEffect } from "react";
import { FaTags, FaPercent } from "react-icons/fa";
import promotionService from "../services/promotion.service";

const Card = ({ product, handleAddToCart, promotionMap }) => {
  const promotion = promotionMap?.[product._id] || null;

  const handleClick = () => {
    handleAddToCart(product);
  };

  const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(price);
  };

  const getCurrentPrice = () => {
    if (promotion) {
      return promotion.discountedPrice;
    }
    return product.sellingPricePerUnit;
  };

  const getOriginalPrice = () => {
    if (promotion) {
      // ใช้ราคาปกติของสินค้าเป็นราคาเดิม
      return product.sellingPricePerUnit;
    }
    return null;
  };

  const currentPrice = getCurrentPrice();
  const originalPrice = getOriginalPrice();
  const discountPercentage = originalPrice 
    ? calculateDiscountPercentage(originalPrice, currentPrice)
    : 0;

  return (
    <div
      className="relative bg-white rounded-2xl shadow-lg p-4 w-[192px] h-[280px] text-center pb-16 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={handleClick}
    >
      {/* โปรโมชั่น Badge */}
      {promotion && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <FaTags size={10} />
            <span>ลด {discountPercentage}%</span>
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
          {promotion ? (
            <>
              <p className="text-gray-400 text-xs line-through">
                {formatPrice(originalPrice)}
              </p>
              <p className="text-red-500 text-sm font-bold">
                {formatPrice(currentPrice)}
              </p>
            </>
          ) : (
            <p className="text-purple-500 text-sm font-bold">
              {formatPrice(currentPrice)}
            </p>
          )}
        </div>

        {/* สถานะสินค้า */}
        <p className="text-gray-700 text-xs mt-1">
          มีอยู่ {product.quantity} {product.quantity > 0 ? 'ชิ้น' : 'ชิ้น'}
        </p>

        {/* สถานะโปรโมชั่น */}
        {promotion && (
          <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <FaPercent size={8} className="inline mr-1" />
            โปรโมชั่น
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
