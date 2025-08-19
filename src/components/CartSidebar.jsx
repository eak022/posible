import React, { useState, useEffect, useRef } from "react";
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
  // ใช้สถานะโปรจากแต่ละแถวใน cart โดยตรง (item.promotionId)
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const scanQueueRef = useRef([]);
  const isProcessingScanRef = useRef(false);
  const [originalPrices, setOriginalPrices] = useState({}); // productId -> original unit price

  // เพิ่มการเก็บข้อมูลตะกร้าใน localStorage เพื่อป้องกันการสูญเสียข้อมูลเมื่อรีเฟรชหน้า
  useEffect(() => {
    // เมื่อ cartItems เปลี่ยน ให้เก็บใน localStorage
    if (cartItems && cartItems.length > 0) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } else {
      localStorage.removeItem('cartItems');
    }
  }, [cartItems]);

  // โหลดข้อมูลตะกร้าจาก localStorage เมื่อ component mount
  useEffect(() => {
    const savedCartItems = localStorage.getItem('cartItems');
    if (savedCartItems && (!cartItems || cartItems.length === 0)) {
      try {
        const parsedCartItems = JSON.parse(savedCartItems);
        // ตรวจสอบว่าข้อมูลยังคงถูกต้อง
        if (Array.isArray(parsedCartItems) && parsedCartItems.length > 0) {
          setCartItems(parsedCartItems);
        }
      } catch (error) {
        console.error('Error parsing saved cart items:', error);
        localStorage.removeItem('cartItems');
      }
    }
  }, []);

  // เตรียมราคาเดิมสำหรับแถวโปรโมชั่น (ดึงจาก product.sellingPricePerUnit)
  useEffect(() => {
    const loadOriginalPrices = async () => {
      // เลือกเฉพาะสินค้าที่เป็นโปรฯ และยังไม่เคยดึงราคาเดิม
      const promoItems = cartItems.filter((it) => Boolean(it.promotionId));
      const missingIds = Array.from(new Set(
        promoItems
          .map((it) => it._id)
          .filter((pid) => originalPrices[pid] === undefined)
      ));
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
      } catch (e) {
        // ignore errors; fallback จะใช้ราคา current
      }
    };
    if (cartItems && cartItems.length > 0) {
      loadOriginalPrices();
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
    // คำนวณราคารวมของสินค้าแต่ละรายการ (ราคาต่อหน่วย × จำนวน)
    return item.price * item.quantity;
  };

  // ราคาเดิม: ถ้าเป็นโปรฯ ใช้ราคาหน่วยตามสินค้า (sellingPricePerUnit), ไม่ใช่ราคา promo
  const getOriginalPrice = (item) => {
    if (item.promotionId) {
      const orig = originalPrices[item._id];
      return typeof orig === 'number' ? orig : item.price;
    }
    return item.price;
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = getItemPrice(item);
      return total + itemPrice; // ไม่ต้องคูณด้วย quantity อีกครั้ง เพราะ getItemPrice คำนวณแล้ว
    }, 0);
  };

  const calculateOriginalTotal = () => {
    return cartItems.reduce((total, item) => {
      const originalPrice = getOriginalPrice(item);
      return total + (originalPrice * item.quantity); // ยังต้องคูณด้วย quantity เพราะ getOriginalPrice ยังไม่ได้คูณ
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

      // ตรวจสอบจำนวนสินค้าที่มีอยู่ (คิดเป็นหน่วยจริง) ด้วย lots
      // คำนวณหน่วยพร้อมขายจริง
      const availableUnitsBase = (productData.totalQuantity ?? productData.quantity ?? 0);
      let availableUnits = availableUnitsBase;
      // ถ้าเป็นแถวโปรฯ และโปรฯ ผูกกับล็อต ให้จำกัดตามล็อตโปรฯ เท่านั้น
      if (item.promotionId) {
        try {
          const promo = await promotionService.getPromotionById(item.promotionId);
          if (promo && Array.isArray(promo.appliedLots) && promo.appliedLots.length > 0) {
            const eligibleLots = (productData.lots || []).filter(l => l.status === 'active' && l.quantity > 0 && new Date(l.expirationDate) > new Date() && promo.appliedLots.includes(l.lotNumber));
            availableUnits = eligibleLots.reduce((sum, l) => sum + l.quantity, 0);
          }
        } catch (_) {}
      }

      // ตรวจสอบจำนวนรวมของสินค้าชิ้นเดียวกันในตะกร้า (รวมทั้งแพ็คและชิ้น)
      const otherCartItemsForProduct = cartItems.filter(cartItem => 
        cartItem._id === item._id && 
        cartItem.cartItemId !== id && 
        cartItem.promotionId === item.promotionId
      );
      
      // คำนวณจำนวนชิ้นรวมที่อยู่ในตะกร้าอื่นๆ แล้ว
      const otherCartQuantity = otherCartItemsForProduct.reduce((sum, cartItem) => {
        return sum + (cartItem.pack ? cartItem.quantity * cartItem.packSize : cartItem.quantity);
      }, 0);
      
      // คำนวณจำนวนชิ้นรวมที่จะมีในตะกร้าหลังอัปเดต
      const totalRequestedUnits = otherCartQuantity + (item.pack ? newQuantity * (productData.packSize ?? 1) : newQuantity);
      
      if (amount > 0 && totalRequestedUnits > availableUnits) {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถเพิ่มสินค้าได้",
          text: `จำนวนสินค้าคงเหลือ ${availableUnits} ชิ้น (ในตะกร้ามี ${otherCartQuantity} ชิ้นแล้ว)`,
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
      const isPromo = Boolean(item.promotionId);
      // ถ้าเป็นแถวโปรฯ และกำลังจะเปลี่ยนเป็นแพ็ค ให้บล็อก
      if (isPromo && !item.pack) {
        Swal.fire({
          icon: "warning",
          title: "ไม่สามารถเปลี่ยนเป็นแพ็คได้",
          text: "สินค้านี้มีโปรโมชั่น ไม่สามารถเลือกแพ็คได้",
          confirmButtonText: "ตกลง",
        });
        return;
      }
      const newPack = !item.pack;

      // อนุญาตให้สินค้า 1 อย่าง เป็นแพ็คได้เพียงแถวเดียวในตะกร้า
      if (newPack === true) {
        const existsAnotherPackForSameProduct = cartItems.some(
          (ci) => ci._id === item._id && ci.cartItemId !== itemId && ci.pack === true
        );
        if (existsAnotherPackForSameProduct) {
          Swal.fire({
            icon: "warning",
            title: "ไม่สามารถเปลี่ยนเป็นแพ็คได้",
            text: "สินค้านี้ถูกเปลี่ยนเป็นแพ็คแล้วในตะกร้า (อนุญาตได้เพียงหนึ่งแถวต่อสินค้า)",
            confirmButtonText: "ตกลง",
          });
          return;
        }
      }
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
              price: response.price, // ใช้ราคาใหม่จาก backend
              barcode: response.barcode, // ใช้บาร์โค้ดใหม่จาก backend
              packSize: response.packSize || item.packSize, // ใช้ packSize จาก backend
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
      await cartService.addItemWithBarcode(barcode, user?.username);
      // รีเฟรชตะกร้าจาก backend เพื่อป้องกันการเพิ่มซ้ำซ้อน
      const refreshed = await cartService.getAllCarts();
      setCartItems(refreshed);
      // ไม่ปิด modal เพื่อให้สแกนต่อได้ทันที
    } catch (error) {
      console.error("Error adding product to cart:", error);
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถเพิ่มสินค้าลงตะกร้าได้",
        text: error.response?.data?.message || "ไม่สามารถเพิ่มสินค้าได้ กรุณาตรวจสอบจำนวนสินค้าในสต็อก",
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
    const isPromo = Boolean(item.promotionId);
    const currentPrice = getItemPrice(item);
    const originalPrice = getOriginalPrice(item);
    const showStrikethrough = isPromo && originalPrice && originalPrice > currentPrice;

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
            {isPromo && (
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
              {item.pack && item.packSize > 1 && (
                <div className="text-xs text-blue-600 mt-0.5">
                  แพ็ค {item.packSize} ชิ้น
                </div>
              )}
                <div className="text-sm text-gray-500 mt-0.5">
                  {showStrikethrough ? (
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
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600 whitespace-nowrap">ชิ้น</span>
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
              <span className="text-xs text-gray-600 whitespace-nowrap">แพ็ค</span>
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
              onBarcodeDetected={(code) => {
                // คิวสแกน: รับทุกการสแกนและประมวลผลทีละรายการ
                scanQueueRef.current.push(code);
                if (!isProcessingScanRef.current) {
                  const processNext = async () => {
                    if (scanQueueRef.current.length === 0) {
                      isProcessingScanRef.current = false;
                      setLoading(false);
                      return;
                    }
                    isProcessingScanRef.current = true;
                    setLoading(true);
                    const nextCode = scanQueueRef.current.shift();
                    try {
                      await handleBarcodeDetected(nextCode);
                    } catch (_) {}
                    // ดำเนินการตัวถัดไป
                    processNext();
                  };
                  processNext();
                }
              }}
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
                <div className="flex justify-between text-gray-600">
                  <span>จำนวนชิ้นรวม</span>
                  <span className="font-medium">
                    {cartItems.reduce((sum, item) => {
                      const itemTotal = item.pack ? item.quantity * item.packSize : item.quantity;
                      return sum + itemTotal;
                    }, 0)}{" "}
                    ชิ้น
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
        onClose={() => {
          // เมื่อปิดหน้าชำระเงิน ให้กลับไปยังตะกร้าสินค้าโดยไม่เคลียร์
          setShowPaymentMethods(false);
        }}
        cartItems={cartItems}
        onSubmit={(paymentMethod, cashReceived, paymentData) => {
          // ✅ จัดการการเคลียร์ตะกร้าหลังจาก QR payment สำเร็จเท่านั้น
          if (paymentMethod === 'banktransfer' && paymentData) {
            // ถ้าเป็น banktransfer (QR payment สำเร็จ) ให้เคลียร์ตะกร้าและปิดหน้า
            setCartItems([]); // เคลียร์ตะกร้า
            setIsCartOpen(false); // ปิดตะกร้า
            refetchData(); // รีเฟรชข้อมูล
          } else if (paymentMethod === 'Cash') {
            // ถ้าเป็นเงินสด ให้ส่งต่อไปยัง handleCreateOrder ปกติ
            handleCreateOrder(paymentMethod, cashReceived);
          } else {
            // ❌ สำหรับ QR Code ไม่ต้องทำอะไร - ให้ Stripe webhook จัดการเอง
            console.log('QR Payment initiated, waiting for Stripe webhook...');
          }
        }}
      />
    </>
  );
};

export default CartSidebar;
