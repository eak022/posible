import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaMobileAlt,
  FaCreditCard,
  FaQrcode,
  FaBackspace,
  FaCopy,
  FaCheck,
  FaMoneyBillWave,
  FaTags,
  FaPercent,
} from "react-icons/fa";
import { IoClose, IoRefresh } from "react-icons/io5";
import { productService, promotionService } from "../services";
import StripeQRPayment from "./StripeQRPayment";

// Component แสดงรายการสินค้าและยอดรวม
const OrderSummary = ({ cartItems, onClose }) => {
  const [originalPrices, setOriginalPrices] = useState({}); // productId -> original unit price

  useEffect(() => {
    const loadOriginalPrices = async () => {
      const promoItems = cartItems.filter((it) => Boolean(it.promotionId));
      const missingIds = Array.from(
        new Set(promoItems.map((it) => it._id).filter((pid) => originalPrices[pid] === undefined))
      );
      if (missingIds.length === 0) return;
      try {
        const results = await Promise.all(
          missingIds.map(async (pid) => {
            const product = await productService.getProductById(pid);
            return [pid, product.sellingPricePerUnit];
          })
        );
        const mapUpdate = results.reduce((acc, [pid, price]) => {
          acc[pid] = price;
          return acc;
        }, {});
        setOriginalPrices((prev) => ({ ...prev, ...mapUpdate }));
      } catch (_) {}
    };
    if (cartItems.length > 0) {
      loadOriginalPrices();
    }
  }, [cartItems]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(price);
  };

  const getItemPrice = (item) => {
    // คืนค่าราคาต่อชิ้น (ไม่ใช่ราคารวม)
    return item.price;
  };

  const getItemTotalPrice = (item) => {
    // คำนวณราคารวมของสินค้าแต่ละรายการ (ราคาต่อหน่วย × จำนวน)
    return item.price * item.quantity;
  };

  const getOriginalPrice = (item) => {
    if (item.promotionId) {
      const orig = originalPrices[item._id];
      return typeof orig === 'number' ? orig : item.price;
    }
    return item.price;
  };

  const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotalPrice = getItemTotalPrice(item);
      return total + itemTotalPrice;
    }, 0);
  };

  const calculateOriginalTotal = () => {
    return cartItems.reduce((total, item) => {
      const originalPrice = getOriginalPrice(item);
      return total + (originalPrice * item.quantity);
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return calculateOriginalTotal() - calculateTotal();
  };

  const totalDiscount = calculateTotalDiscount();
  const hasDiscount = totalDiscount > 0;

  return (
    <div className="w-[400px] bg-gray-50 p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">สรุปรายการ</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        >
          <IoClose size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {cartItems.map((item) => {
          const isPromo = Boolean(item.promotionId);
          const currentPrice = getItemPrice(item); // ราคาต่อชิ้น
          const itemTotalPrice = getItemTotalPrice(item); // ราคารวมของรายการ
          const originalPrice = getOriginalPrice(item);
          const discountPercentage = isPromo && originalPrice > currentPrice
            ? calculateDiscountPercentage(originalPrice, currentPrice)
            : 0;

          return (
          <div
            key={item.cartItemId}
            className="flex items-start gap-3 bg-white p-4 rounded-xl"
          >
              <div className="relative">
            <img
              src={item.productImage}
              alt={item.productName}
              className="w-16 h-16 object-cover rounded-lg"
            />
                {isPromo && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                    <FaTags size={8} />
                  </div>
                )}
              </div>
            <div className="flex-1">
              <h3 className="font-medium">{item.productName}</h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-gray-500">
                  {item.quantity} {item.pack ? "แพ็ค" : "ชิ้น"}
                </p>
                  <div className="text-right">
                    {isPromo && originalPrice > currentPrice ? (
                      <div className="flex flex-col items-end">
                        <p className="text-xs line-through text-gray-400">
                          {formatPrice(originalPrice * item.quantity)}
                        </p>
                        <p className="font-medium text-red-500">
                          {formatPrice(itemTotalPrice)}
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <FaPercent size={8} />
                          ลด {discountPercentage}%
                        </p>
                      </div>
                    ) : (
                      <p className="font-medium">
                        {formatPrice(itemTotalPrice)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-gray-50 pt-6 mt-6 border-t space-y-3 z-10">
        <div className="flex justify-between text-gray-600">
          <span>จำนวนสินค้า</span>
          <span>
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)} รายการ
          </span>
        </div>
        
        {hasDiscount && (
          <>
            <div className="flex justify-between text-gray-500">
              <span>ราคารวมปกติ</span>
              <span className="line-through">
                {formatPrice(calculateOriginalTotal())}
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>ส่วนลดรวม</span>
              <span className="font-medium">
                -{formatPrice(totalDiscount)}
              </span>
        </div>
          </>
        )}
        
        <div className="flex justify-between text-xl font-semibold">
          <span>ยอดรวม</span>
          <span className={hasDiscount ? "text-red-500" : ""}>
            {formatPrice(calculateTotal())}
          </span>
        </div>
      </div>
    </div>
  );
};

// Component แสดงปุ่มกดตัวเลข
const NumberPad = ({ onNumberClick, onClear, onBackspace }) => {
  const numberPad = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["C", "0", "⌫"],
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {numberPad.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((num) => (
            <button
              key={num}
              onClick={() => {
                if (num === "C") onClear();
                else if (num === "⌫") onBackspace();
                else onNumberClick(num);
              }}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 text-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {num}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

// Component สำหรับการชำระเงินสด
const CashPayment = ({ totalAmount, onBack, onSubmit }) => {
  const [cashAmount, setCashAmount] = useState("");

  const formatPrice = (price) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(price);
  };

  const handleNumberClick = (number) => {
    if (cashAmount.length < 8) {
      setCashAmount((prev) => prev + number);
    }
  };

  const handleBackspace = () => {
    setCashAmount((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setCashAmount("");
  };

  const changeAmount = cashAmount ? Number(cashAmount) - totalAmount : 0;

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold">ชำระด้วยเงินสด</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          <IoClose size={24} />
        </button>
      </div>

      {/* Amount Display */}
      <div className="bg-gray-50 p-6 rounded-2xl mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">ยอดที่ต้องชำระ</span>
          <span className="text-xl font-semibold text-red-500">
            {formatPrice(totalAmount)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">รับเงิน</span>
          <span className="text-2xl font-semibold text-blue-600">
            {cashAmount ? formatPrice(Number(cashAmount)) : "฿ 0.00"}
          </span>
        </div>
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-gray-600">เงินทอน</span>
          <span
            className={`text-2xl font-semibold ${
              changeAmount >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {changeAmount >= 0 ? formatPrice(changeAmount) : "-"}
          </span>
        </div>
      </div>

      {/* Number Pad */}
      <NumberPad
        onNumberClick={handleNumberClick}
        onClear={handleClear}
        onBackspace={handleBackspace}
      />

      {/* Submit Button */}
      <button
        onClick={() => onSubmit("Cash", Number(cashAmount))}
        disabled={!cashAmount || Number(cashAmount) < totalAmount}
        className={`w-full mt-4 py-4 rounded-xl font-semibold text-white transition-colors
          ${
            Number(cashAmount) >= totalAmount
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gray-300 cursor-not-allowed"
          }`}
      >
        ยืนยันการชำระเงิน
      </button>
    </div>
  );
};

// Component หลัก
const PaymentPage = ({ isOpen, onClose, cartItems, onSubmit }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [promotions, setPromotions] = useState({});

  useEffect(() => {
    const fetchPromotions = async () => {
      const promoData = {};
      for (const item of cartItems) {
        try {
          const promotion = await promotionService.getPromotionByProduct(item._id);
          if (promotion) {
            promoData[item._id] = promotion;
          }
        } catch (error) {
          // ไม่มีโปรโมชั่นสำหรับสินค้านี้
        }
      }
      setPromotions(promoData);
    };

    if (cartItems.length > 0) {
      fetchPromotions();
    }
  }, [cartItems]);

  const paymentMethods = [
    {
      id: "Stripe",
      name: "ชำระด้วย QR Code",
      description: "สแกน QR Code ด้วยแอปธนาคาร (ขั้นต่ำ 10 บาท)",
      icon: FaQrcode,
      color: "purple",
      minAmount: 10, // เพิ่มขั้นต่ำ
    }
  ];

  const getItemPrice = (item) => {
    // คืนค่าราคาต่อชิ้น (ไม่ใช่ราคารวม)
    return item.price;
  };

  const getItemTotalPrice = (item) => {
    // คำนวณราคารวมของสินค้าแต่ละรายการ (ราคาต่อหน่วย × จำนวน)
    return item.price * item.quantity;
  };

  const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotalPrice = getItemTotalPrice(item);
      return total + itemTotalPrice;
    }, 0);
  };

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    if (methodId === "BankTransfer") {
      onSubmit(methodId);
    }
    // Stripe จะแสดง component แยก ไม่ต้องส่งข้อมูลทันที
  };

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-8 bg-white rounded-2xl shadow-2xl overflow-hidden flex"
          >
            {/* Left Side - Order Summary */}
            <OrderSummary cartItems={cartItems} onClose={onClose} />

            {/* Right Side - Payment Methods */}
            <div className="flex-1 p-8 flex flex-col">
              {!selectedMethod ? (
                <>
                  <h2 className="text-2xl font-semibold mb-8">
                    เลือกวิธีการชำระเงิน
                  </h2>
                  <div className="grid grid-cols-2 gap-4 max-w-2xl">
                    {/* Cash Payment Button */}
                    <button
                      onClick={() => handleMethodSelect("Cash")}
                      className="group relative bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 text-left"
                    >
                      <div className="text-green-500 mb-4">
                        <FaMoneyBillWave size={32} />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">เงินสด</h3>
                      <p className="text-gray-500 text-sm">ชำระด้วยเงินสด</p>
                      <div className="absolute inset-0 border-2 border-green-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Other Payment Methods */}
                    {paymentMethods.map((method) => {
                      const isDisabled = method.minAmount && calculateTotal() < method.minAmount;
                      const isQRMethod = method.id === "Stripe";
                      
                      return (
                        <button
                          key={method.id}
                          onClick={() => !isDisabled && handleMethodSelect(method.id)}
                          disabled={isDisabled}
                          className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                            isDisabled 
                              ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' 
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                          }`}
                        >
                          <div className={`mb-4 ${isDisabled ? 'text-gray-400' : `text-${method.color}-500`}`}>
                            <method.icon size={32} />
                          </div>
                          <h3 className={`text-lg font-semibold mb-1 ${isDisabled ? 'text-gray-500' : ''}`}>
                            {method.name}
                          </h3>
                          <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                            {method.description}
                          </p>
                          
                          {/* แสดงข้อความแจ้งเตือนสำหรับ QR Code ที่ถูกปิด */}
                          {isDisabled && isQRMethod && (
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-xs text-yellow-700 font-medium">
                                ยอดรวมต้องไม่ต่ำกว่า ฿{method.minAmount} เพื่อใช้ QR Code
                              </p>
                              <p className="text-xs text-yellow-600 mt-1">
                                ปัจจุบัน: {new Intl.NumberFormat("th-TH", {
                                  style: "currency",
                                  currency: "THB",
                                }).format(calculateTotal())}
                              </p>
                            </div>
                          )}
                          
                          {!isDisabled && (
                            <div className="absolute inset-0 border-2 border-green-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : selectedMethod === "Cash" ? (
                <CashPayment
                  totalAmount={calculateTotal()}
                  onBack={() => setSelectedMethod(null)}
                  onSubmit={onSubmit}
                />
              ) : selectedMethod === "Stripe" ? (
                <StripeQRPayment
                  totalAmount={calculateTotal()}
                  cartItems={cartItems}
                  onBack={() => {
                    // เมื่อกลับจาก QR Payment ให้กลับไปยังหน้าเลือกวิธีการชำระเงินโดยไม่เคลียร์ตะกร้า
                    setSelectedMethod(null);
                  }}
                  onSubmit={(paymentMethod, cashReceived, paymentData) => {
                    // ✅ จัดการการเคลียร์ตะกร้าหลังจาก QR payment สำเร็จเท่านั้น
                    if (paymentMethod === 'banktransfer' && paymentData) {
                      // ถ้าเป็น banktransfer (QR payment สำเร็จ) ให้เคลียร์ตะกร้าและปิดหน้า
                      onSubmit(paymentMethod, cashReceived, paymentData);
                      onClose();
                    } else {
                      // ❌ ไม่ส่งข้อมูลไปยัง onSubmit อีก - ให้ Stripe webhook จัดการเอง
                      console.log('QR Payment initiated, waiting for Stripe webhook...');
                    }
                  }}
                  onClose={() => {
                    // เมื่อปิด QR Payment ให้กลับไปยังหน้าเลือกวิธีการชำระเงินโดยไม่เคลียร์ตะกร้า
                    setSelectedMethod(null);
                  }}
                />
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default PaymentPage;
