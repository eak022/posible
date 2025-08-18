import React from "react";
import { FaTags, FaPercent, FaClock } from "react-icons/fa";

const PromotionBanner = ({ promotions }) => {
  if (!promotions || promotions.length === 0) {
    return null;
  }

  const calculateMaxDiscount = () => {
    return Math.max(...promotions.map(p => {
      const originalPrice = p.productId.sellingPricePerUnit;
      const discountPrice = p.discountedPrice;
      return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
    }));
  };

  const maxDiscount = calculateMaxDiscount();

  return (
    <div className="px-10 mb-6">
      <div className="bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <FaTags size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">โปรโมชั่นพิเศษ!</h3>
                <p className="text-sm opacity-90 mb-2">
                  มีสินค้า {promotions.length} รายการที่ลดราคาพิเศษ
                </p>
                <div className="flex items-center gap-2 text-xs opacity-75">
                  <FaClock size={10} />
                  <span>โปรโมชั่นมีจำกัด</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                <div className="text-3xl font-bold flex items-center gap-2">
                  <FaPercent size={20} />
                  <span>{maxDiscount}%</span>
                </div>
                <div className="text-sm opacity-90">ส่วนลดสูงสุด</div>
              </div>
            </div>
          </div>
          
          {/* โปรโมชั่นรายการยอดนิยม */}
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="flex items-center gap-4 text-sm">
              <span className="opacity-90">สินค้าแนะนำ:</span>
              <div className="flex gap-2">
                {promotions.slice(0, 3).map((promo, index) => (
                  <div key={index} className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                    {promo.productId.productName}
                  </div>
                ))}
                {promotions.length > 3 && (
                  <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                    +{promotions.length - 3} รายการ
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionBanner; 