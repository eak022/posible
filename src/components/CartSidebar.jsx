import React, { useState, useEffect } from "react";
import { FaTrashAlt, FaBarcode, FaTags, FaPercent } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { cartService, orderService, productService, promotionService } from "../services/";
import { generateOrderNumber } from "../utils/orderUtils";
import Swal from "sweetalert2";
import BarcodeScanner from "./BarcodeScanner";
import PaymentPage from "./PaymentPage";

const CartSidebar = ({
  isCartOpen,
  setIsCartOpen,
  cartItems,
  setCartItems,
  handleAddToCart,
  user,
  refetchData,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [promotions, setPromotions] = useState({});
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

  // ดึงข้อมูลโปรโมชั่นสำหรับสินค้าในตะกร้า
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

  // Utility functions
  const formatPrice = (price) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(price);
  };

  const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  };

  const getItemPrice = (item) => {
    const promotion = promotions[item._id];
    if (promotion) {
      return item.pack ? promotion.discountedPrice : promotion.discountedPrice;
    }
    return item.pack ? item.sellingPricePerPack : item.sellingPricePerUnit;
  };

  const getOriginalPrice = (item) => {
    return item.pack ? item.sellingPricePerPack : item.sellingPricePerUnit;
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = getItemPrice(item);
      return total + (itemPrice * item.quantity);
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

  // Cart operations
  const updateQuantity = async (id, amount, updatedItem = null) => {
    try {
      const item = cartItems.find((item) => item.cartItemId === id);
      if (!item) return;

      // ดึงข้อมูลสินค้าจาก backend
      const productData = await productService.getProductById(item._id);

      const newQuantity = Math.max(0, item.quantity + amount);

      // ตรวจสอบจำนวนสินค้าที่มีอยู่
      if (amount > 0 && newQuantity > productData.quantity) {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถเพิ่มสินค้าได้",
          text: `จำนวนสินค้าคงเหลือ ${productData.quantity} ชิ้น`,
          confirmButtonText: "ตกลง",
        });
        return;
      }

      // ถ้าจำนวนเป็น 0 ให้ลบออก
      if (newQuantity === 0) {
        await removeItem(id);
        return;
      }

      await cartService.updateCartItem(id, {
        quantity: newQuantity,
        pack: item.pack,
      });

      setCartItems((prevCart) => {
        return prevCart.map((item) => {
          if (item.cartItemId === id) {
            if (updatedItem) {
              return updatedItem;
            }
            return {
              ...item,
              quantity: newQuantity,
            };
          }
          return item;
        });
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถเพิ่มสินค้าลงตะกร้าได้",
        text: error.response?.data?.message || "ไม่สามารถเพิ่มสินค้าได้ กรุณาตรวจสอบจำนวนสินค้าในสต็อก",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const removeItem = async (id) => {
    try {
      await cartService.removeItem(id);
      setCartItems((prevCart) =>
        prevCart.filter((item) => item.cartItemId !== id)
      );
    } catch (error) {
      console.error("Error removing item:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text:
          error.response?.data?.message || "ไม่สามารถลบสินค้าออกจากตะกร้าได้",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleTogglePack = async (itemId) => {
    try {
      const item = cartItems.find((item) => item.cartItemId === itemId);
      if (!item) return;
      const promotion = promotions[item._id];
      // ถ้ามีโปรโมชั่นและกำลังจะเปลี่ยนเป็นแพ็ค
      if (promotion && !item.pack) {
        Swal.fire({
          icon: "warning",
          title: "ไม่สามารถเปลี่ยนเป็นแพ็คได้",
          text: "สินค้านี้มีโปรโมชั่น ไม่สามารถเลือกแพ็คได้",
          confirmButtonText: "ตกลง",
        });
        return;
      }
      const newPack = !item.pack;
      const response = await cartService.updateCartItem(item.cartItemId, {
        quantity: item.quantity,
        pack: newPack,
      });
      setCartItems((prevCart) => {
        return prevCart.map((item) => {
          if (item.cartItemId === itemId) {
            return {
              ...item,
              pack: newPack,
              sellingPricePerUnit: response.price,
              sellingPricePerPack: response.price,
            };
          }
          return item;
        });
      });
    } catch (error) {
      console.error("Error toggling pack:", error);
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถเพิ่มสินค้าลงตะกร้าได้",
        text: error.response?.data?.message || "ไม่สามารถเพิ่มสินค้าได้ กรุณาตรวจสอบจำนวนสินค้าในสต็อก",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // Barcode operations
  const handleBarcodeDetected = async (barcode) => {
    try {
      const data = await cartService.addItemWithBarcode(barcode);
      handleAddToCart({
        _id: data.productId,
        cartItemId: data._id,
        productName: data.name,
        productImage: data.image,
        sellingPricePerUnit: data.price,
        quantity: 1,
        pack: data.pack || false,
      });
      setIsScanning(false);
    } catch (error) {
      console.error("Error adding product to cart:", error);
      Swal.fire({
        icon: "error",
        title: "ไม่พบสินค้า",
        text: error.response?.data?.message || "ไม่พบสินค้าที่มีบาร์โค้ดนี้",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // ฟังก์ชันสำหรับกรอกบาร์โค้ดด้วยคีย์บอร์ด
  const handleBarcodeInput = async (e) => {
    if (e.key === "Enter" && barcodeInput.trim() !== "") {
      await handleBarcodeDetected(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  // Order operations
  const handleCreateOrder = async (paymentMethod, cashReceived = 0) => {
    try {
      if (!user?.username) {
        Swal.fire({
          icon: "error",
          title: "กรุณาเข้าสู่ระบบ",
          text: "กรุณาเข้าสู่ระบบก่อนสร้างคำสั่งซื้อ",
          confirmButtonText: "ตกลง",
        });
        return;
      }

      const orderData = {
        userName: user.username,
        paymentMethod,
        cash_received: paymentMethod === "Cash" ? cashReceived : 0,
        items: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          price: getItemPrice(item),
          pack: item.pack,
        })),
      };

      const response = await orderService.createOrder(orderData);
      const newOrderNumber = generateOrderNumber(response.order._id);

      Swal.fire({
        icon: "success",
        title: "สร้างคำสั่งซื้อสำเร็จ",
        text: `เลขที่คำสั่งซื้อ: ${newOrderNumber}`,
        confirmButtonText: "ตกลง",
      }).then(() => {
        setIsCartOpen(false);
        refetchData();
      });
    } catch (error) {
      console.error("Error creating order:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text:
          error.response?.data?.message || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // ฟังก์ชันเคลียร์ตะกร้าทั้งหมด
  const clearAllCartItems = async () => {
    if (cartItems.length === 0) return;
    const result = await Swal.fire({
      title: 'ลบสินค้าทั้งหมดออกจากตะกร้า?',
      text: 'คุณต้องการลบสินค้าทั้งหมดออกจากตะกร้าหรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบทั้งหมด',
      cancelButtonText: 'ยกเลิก',
    });
    if (result.isConfirmed) {
      try {
        // ลบทุกชิ้นใน cart
        await Promise.all(cartItems.map(item => cartService.removeItem(item.cartItemId)));
        setCartItems([]);
        Swal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ',
          text: 'ลบสินค้าทั้งหมดออกจากตะกร้าแล้ว',
          timer: 1200,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.response?.data?.message || 'ไม่สามารถลบสินค้าได้',
        });
      }
    }
  };

  // Render functions
  const renderCartItem = (item) => {
    const promotion = promotions[item._id];
    const currentPrice = getItemPrice(item);
    const originalPrice = getOriginalPrice(item);
    const discountPercentage = promotion 
      ? calculateDiscountPercentage(originalPrice, currentPrice)
      : 0;

    return (
    <div
      key={item.cartItemId}
      className="bg-white rounded-lg border p-4 hover:border-gray-300 transition-colors mt-2"
    >
      <div className="flex items-start gap-4">
          <div className="relative">
        <img
          src={item.productImage}
          alt={item.productName}
          className="w-16 h-16 object-cover rounded-lg border"
        />
            {promotion && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                <FaTags size={8} />
              </div>
            )}
          </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 
                className="font-medium truncate max-w-[120px] block" 
                title={item.productName}
              >
                {item.productName}
              </h3>
                <div className="text-sm text-gray-500 mt-0.5">
                  {promotion ? (
                    <div className="flex flex-col">
                      <span className="line-through text-gray-400">
                        {formatPrice(originalPrice)}
                      </span>
                      <span className="text-red-500 font-medium">
                        {formatPrice(currentPrice)}
                      </span>
                      
                    </div>
                  ) : (
                    <span>{formatPrice(currentPrice)}</span>
                  )}
                </div>
            </div>
            <p className="font-medium whitespace-nowrap">
                {formatPrice(currentPrice * item.quantity)}
            </p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">ชิ้น</span>
              <button
                onClick={() => handleTogglePack(item.cartItemId)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  item.pack ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    item.pack ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs text-gray-600">แพ็ค</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center bg-gray-50 rounded-full">
                <button
                  onClick={() => updateQuantity(item.cartItemId, -1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.cartItemId, 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.cartItemId)}
                className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <FaTrashAlt size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderEmptyCart = () => (
    <div className="flex flex-col items-center justify-center h-[calc(100%-3rem)] text-gray-400">
      <svg
        className="w-16 h-16 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      <p>ไม่มีสินค้าในตะกร้า</p>
    </div>
  );

  const totalDiscount = calculateTotalDiscount();
  const hasDiscount = totalDiscount > 0;

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-16 right-0 h-[calc(100%-4rem)] w-[380px] bg-white shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">ตะกร้าสินค้า</h2>
                {hasDiscount && (
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <FaTags size={10} />
                    <span>โปรโมชั่น</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="บาร์โค้ด"
                  className="w-32 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeInput}
                  style={{ minWidth: 0 }}
                />
                <button
                  onClick={() => setIsScanning(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-full transition-colors"
                  title="สแกนบาร์โค้ด"
                >
                  <FaBarcode size={18} />
                </button>
              </div>
            </div>

            {/* Barcode Scanner */}
            <BarcodeScanner
              isOpen={isScanning}
              onClose={() => setIsScanning(false)}
              onBarcodeDetected={handleBarcodeDetected}
            />

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4">
              <div className="sticky top-0 bg-white py-3 grid grid-cols-3 gap-2 text-sm font-medium text-gray-500 z-10">
                <div className="text-center">รายการสินค้า</div>
                <div className="text-right">จำนวน</div>
                <div className="text-right">ราคา</div>
              </div>
              {cartItems.length === 0 ? (
                renderEmptyCart()
              ) : (
                <div className="space-y-4 py-2">
                  {cartItems.map(renderCartItem)}
                </div>
              )}
            </div>

            {/* Summary and Actions */}
            <div className="border-t bg-white px-6 pt-4 pb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>จำนวนสินค้า</span>
                  <span className="font-medium">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    รายการ
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
                
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>ยอดรวม</span>
                  <span className={hasDiscount ? "text-red-500" : ""}>
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 text-red-600 bg-red-50 rounded-xl font-medium hover:bg-red-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => setShowPaymentMethods(true)}
                  className="px-6 py-3 text-white bg-green-500 rounded-xl font-medium hover:bg-green-600 transition-colors"
                >
                  ชำระเงิน
                </button>
              </div>
              {/* ปุ่มเคลียร์ตะกร้าทั้งหมด */}
              {cartItems.length > 0 && (
                <button
                  onClick={clearAllCartItems}
                  className="w-full flex items-center justify-center gap-2 mt-3 py-2 rounded-xl text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-all font-medium shadow-sm"
                  title="ลบสินค้าทั้งหมดออกจากตะกร้า"
                >
                  <FaTrashAlt />
                  เคลียร์ตะกร้าทั้งหมด
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PaymentPage
        isOpen={showPaymentMethods}
        onClose={() => setShowPaymentMethods(false)}
        cartItems={cartItems}
        onSubmit={handleCreateOrder}
      />
    </>
  );
};

export default CartSidebar;
