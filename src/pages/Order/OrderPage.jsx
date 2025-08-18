import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Card from "../../components/Card";
import FilterModal from "../../components/FilterModal";
import CartSidebar from "../../components/CartSidebar";
import useFilter from "../../hooks/useFilter";
import { FaFilter, FaShoppingCart, FaTags } from "react-icons/fa";
import useAuthStore from "../../store/useAuthStore";
import { productService, categoryService, cartService, promotionService } from "../../services";
import Swal from "sweetalert2";
import { useProduct } from "../../context/ProductContext";

const OrderPage = () => {
  const { category } = useParams();
  const { user } = useAuthStore();
  const { products, setProducts } = useProduct();
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [stockRange, setStockRange] = useState({ min: "", max: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [activePromotions, setActivePromotions] = useState([]);
  const [promotionCount, setPromotionCount] = useState(0);
  const [promotionMap, setPromotionMap] = useState({});
  const [barcode, setBarcode] = useState("");
  const barcodeInputRef = useRef(null);

  // ฟังก์ชันกรองสินค้าที่หมดอายุ (ใช้ข้อมูลจาก lots)
  const filterExpiredProducts = (products) => {
    const currentDate = new Date();
    return products.filter(product => {
      // ใช้ nearestExpirationDate จาก virtual field
      if (product.nearestExpirationDate) {
        const expirationDate = new Date(product.nearestExpirationDate);
        return expirationDate > currentDate;
      }
      // Fallback สำหรับสินค้าเก่าที่ไม่มี lots
      if (product.expirationDate) {
        const expirationDate = new Date(product.expirationDate);
        return expirationDate > currentDate;
      }
      // ✅ ถ้าไม่มีข้อมูลวันหมดอายุ (ไม่มี lots หรือไม่มีวันหมดอายุ) ให้แสดง
      return true;
    });
  };

  const refetchData = async () => {
    try {
      setLoading(true);
      let response;

      // ดึงข้อมูลหมวดหมู่
      if (category) {
        const categoryResponse = await categoryService.getCategoryById(
          category
        );
        setCategoryName(categoryResponse.categoryName);
      } else {
        setCategoryName("");
      }

      // ดึงข้อมูลสินค้าทั้งหมด
      response = await productService.getAllProducts();
      let products = response.data || response;

      // กรองสินค้าที่หมดอายุออก
      products = filterExpiredProducts(products);

      // กรองสินค้าตามหมวดหมู่
      if (category) {
        products = products.filter(
          (product) => product.categoryId._id === category
        );
      }

      setProducts(products);

      // ดึงข้อมูล cart items
      const cartResponse = await cartService.getAllCarts();
      setCartItems(cartResponse);

      // ดึงข้อมูลโปรโมชั่นที่ใช้งานได้
      try {
        const promotionsResponse = await promotionService.getActivePromotions();
        setActivePromotions(promotionsResponse || []);
        const promoMap = {};
        (promotionsResponse || []).forEach(promo => {
          if (promo.productId && promo.productId._id) {
            promoMap[promo.productId._id] = promo;
          }
        });
        setPromotionMap(promoMap);
        
        // นับจำนวนสินค้าที่มีโปรโมชั่น (เฉพาะสินค้าที่ไม่หมดอายุ)
        const productsWithPromotions = products.filter(product => 
          promotionsResponse.some(promo => promo.productId._id === product._id)
        );
        setPromotionCount(productsWithPromotions.length);
      } catch (error) {
        console.error("Error fetching promotions:", error);
        setActivePromotions([]);
        setPromotionCount(0);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchData();
  }, [category]);

  const filteredProducts = useFilter(
    products,
    categoryName,
    searchTerm,
    priceRange,
    stockRange
  );

  // เรียงสินค้าที่ totalQuantity = 0 ให้อยู่ล่างสุด (ใช้ข้อมูลจาก lots)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aQuantity = a.totalQuantity || a.quantity || 0;
    const bQuantity = b.totalQuantity || b.quantity || 0;
    if (aQuantity === 0 && bQuantity !== 0) return 1;
    if (aQuantity !== 0 && bQuantity === 0) return -1;
    return 0;
  });

  // ฟังก์ชันเพิ่มสินค้าลงตะกร้า
  const handleAddToCart = async (product, isPack = false) => {
    try {
      if (!user?.username) {
        Swal.fire({
          icon: "error",
          title: "กรุณาเข้าสู่ระบบ",
          text: "กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า",
          confirmButtonText: "ตกลง",
        });
        return;
      }

      // เพิ่มสินค้าแบบชิ้นเท่านั้น (ไม่มีโปร)
      await cartService.addItemFromCard(
        product._id,
        user.username,
        { pack: false, barcode: product.barcodeUnit, promotionId: null }
      );

      // รีเฟรชตะกร้าจาก backend เพื่อความถูกต้อง
      const refreshed = await cartService.getAllCarts();
      setCartItems(refreshed);

      // เปิด CartSidebar
      setIsCartOpen(true);

    } catch (error) {
      console.error("Error adding product to cart:", error);
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถเพิ่มสินค้าลงตะกร้าได้",
        text: error.message,
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleSort = () => setIsModalOpen(false);
  const handleReset = () => {
    setPriceRange({ min: "", max: "" });
    setStockRange({ min: "", max: "" });
    setSearchTerm("");
    setIsModalOpen(false);
  };

  // ฟังก์ชัน handle barcode scan
  const handleBarcodeInput = async (e) => {
    if (e.key === "Enter" && barcode.trim() !== "") {
      try {
        const data = await cartService.addItemWithBarcode(barcode.trim(), user?.username);
        // อัปเดต cart ใหม่
        const cartResponse = await cartService.getAllCarts();
        setCartItems(cartResponse);
        
        // เปิด CartSidebar ทันทีหลัง scan barcode สำเร็จ
        setIsCartOpen(true);
        
        Swal.fire({
          icon: "success",
          title: "เพิ่มสินค้าด้วยบาร์โค้ดสำเร็จ",
          text: `เพิ่ม ${data.productName || "สินค้า"} ลงตะกร้าแล้ว`,
          timer: 1200,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "ผิดพลาด",
          text: error.message || "ไม่สามารถเพิ่มสินค้าด้วยบาร์โค้ดนี้ได้",
        });
      }
      setBarcode("");
    }
  };

  // auto focus input ซ่อนนี้เสมอ
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  });

  // CardSkeleton component (ใช้ daisyUI skeleton)
  const CardSkeleton = () => (
    <div className="flex justify-center">
      <div className="w-64 h-72 rounded-xl shadow bg-base-200 flex flex-col items-center p-4">
        <div className="skeleton w-32 h-32 mb-4 rounded-lg" />
        <div className="skeleton w-24 h-4 mb-2 rounded" />
        <div className="skeleton w-16 h-4 mb-2 rounded" />
        <div className="skeleton w-20 h-6 rounded" />
      </div>
    </div>
  );

  if (loading) {
    // ถ้ามีข้อมูลสินค้าแล้ว ให้ skeleton เท่ากับจำนวนสินค้า ถ้ายังไม่มี ให้ default 8
    const skeletonCount = sortedProducts.length > 0 ? sortedProducts.length : 8;
    return (
      <div className="bg-gray-100 h-screen overflow-auto py-10">
        <div className="bg-gray-100 p-10 w-full">
          <div className="flex justify-between items-center px-10 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="skeleton h-8 w-40 rounded-xl" />
                <div className="skeleton h-8 w-32 rounded-xl" />
              </div>
              <div className="skeleton h-6 w-32 rounded-full" />
            </div>
            <div className="search-filter-container flex gap-2">
              <div className="skeleton h-10 w-48 rounded-xl" />
              <div className="skeleton h-10 w-32 rounded-xl" />
            </div>
          </div>
          <div className="grid gap-x-10 gap-y-20 px-10 mt-16 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">เกิดข้อผิดพลาด: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 h-screen overflow-auto py-10">
      {/* input ซ่อนสำหรับยิงบาร์โค้ด */}
      <input
        ref={barcodeInputRef}
        type="text"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
        onKeyDown={handleBarcodeInput}
        style={{ position: "absolute", left: "-9999px" }}
        tabIndex={-1}
        aria-hidden="true"
        autoFocus
      />
      {/* Order Page Content */}
      <div
        className={`bg-gray-100 p-10 transition-all duration-300 ${
          isCartOpen ? "w-3/4" : "w-full"
        }`}
      >
        {/* Search and Filter button */}
        <div className="flex justify-between items-center px-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-gray-800">
                สินค้าทั้งหมด
              </div>
              {categoryName && (
                <>
                  <div className="text-2xl font-bold text-gray-400">:</div>
                  <div className="text-2xl font-bold text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl shadow-sm border border-blue-100">
                    {categoryName}
                  </div>
                </>
              )}
            </div>
            {promotionCount > 0 && (
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                <FaTags size={12} />
                <span>{promotionCount} สินค้าโปรโมชั่น</span>
              </div>
            )}
          </div>
          <div className="search-filter-container">
            <input
              type="text"
              placeholder="ค้นหาสินค้า"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
              id="search-input"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="filter-button"
              id="filter-button"
            >
              <FaFilter />
              <span>กรองสินค้า</span>
            </button>
          </div>
        </div>

        {/* Filter Modal */}
        <FilterModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          stockRange={stockRange}
          setStockRange={setStockRange}
          handleSort={handleSort}
          handleReset={handleReset}
          isCartOpen={isCartOpen}
        />

        {/* Product Cards */}
        <div
          className={`grid gap-x-10 gap-y-20 px-10 transition-all duration-300 mt-16 ${
            isCartOpen
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          }`}
        >
          {sortedProducts.length > 0 ? (
            sortedProducts.map((product, index) => (
              <div key={index} className="flex justify-center">
                <Card product={product} handleAddToCart={handleAddToCart} promotionMap={promotionMap} />
              </div>
            ))
          ) : (
            <div className="text-center col-span-full text-gray-500">
              {categoryName 
                ? `ไม่มีสินค้าในหมวดหมู่ ${categoryName} หรือสินค้าทั้งหมดหมดอายุแล้ว`
                : "ไม่มีสินค้าที่ใช้งานได้หรือสินค้าทั้งหมดหมดอายุแล้ว"
              }
            </div>
          )}
        </div>

        {/* ปุ่มรถเข็น */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-10 right-10 p-4 bg-white text-green-500 rounded-full shadow-lg hover:bg-green-100 transition duration-300"
          id="open-cart-btn"
          data-tip="สร้างคำสั่งซื้อ"
        >
          <FaShoppingCart size={24} />
          {cartItems.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <CartSidebar
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
          cartItems={cartItems}
          setCartItems={setCartItems}
          handleAddToCart={handleAddToCart}
          user={user}
          refetchData={refetchData}
        />
      )}
    </div>
  );
};

export default OrderPage;
