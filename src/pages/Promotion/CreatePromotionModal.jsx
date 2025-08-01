import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import productService from "../../services/product.service";
import promotionService from "../../services/promotion.service";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns"; // นำเข้า format จาก date-fns
import { th } from "date-fns/locale"; // นำเข้า locale ภาษาไทย
import { Combobox } from '@headlessui/react';
import { FaChevronDown } from 'react-icons/fa';

const CreatePromotionModal = ({ isOpen, onClose, initialProduct }) => {
  if (!isOpen) return null;

  const [promotionName, setPromotionName] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await productService.getAllProducts();
        setProducts(productsData);
        
        // ถ้ามี initialProduct ให้ตั้งค่า selectedProduct
        if (initialProduct) {
          const product = productsData.find(p => p._id === initialProduct.productId);
          if (product) {
            setSelectedProduct(product);
            // ตั้งชื่อโปรโมชั่นเริ่มต้น
            setPromotionName(`โปรโมชั่น ${product.productName}`);
            // ตั้งราคาเริ่มต้น (ลด 20% จากราคาปกติ)
            const discountPrice = Math.floor(product.price * 0.8);
            setDiscountedPrice(discountPrice.toString());
            setOriginalPrice(product.sellingPricePerUnit);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, initialProduct]);

  const formatDate = (date) => format(date, "yyyy-MM-dd"); // ฟังก์ชันแปลงวันที่

  const handleConfirm = async () => {
    if (!promotionName || !startDate || !endDate || !discountedPrice || !selectedProduct) {
      Swal.fire({
        icon: "error",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        showConfirmButton: true,
      });
      return;
    }
  
    setLoading(true);
  
    try {
      const promotionData = {
        promotionName,
        validityStart: formatDate(startDate), // ใช้ formatDate
        validityEnd: formatDate(endDate),     // ใช้ formatDate
        discountedPrice,
        productId: selectedProduct._id,
      };
      await promotionService.createPromotion(promotionData);
      Swal.fire({
        icon: "success",
        title: "สร้างโปรโมชั่นสำเร็จ",
        showConfirmButton: false,
        timer: 1500,
      });
      onClose();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถสร้างโปรโมชั่นได้",
      });
    }
    setLoading(false);
  };

  // ฟิลเตอร์สินค้าตาม query
  const filteredProducts =
    query === ""
      ? products
      : products.filter((product) =>
          product.productName.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-3/4 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-black">จัดโปรโมชั่น</h2>
        <div className="space-y-4">
          <input 
            id="create-promotion-name-input" //เพิ่ม id
            type="text"
            placeholder="ชื่อโปรโมชั่น"
            value={promotionName}
            onChange={(e) => setPromotionName(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
         <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm mb-1 text-black">วันที่เริ่มโปรโมชั่น</label>
              <DatePicker 
                id="create-promotion-start-date" //เพิ่ม id
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="w-full p-2 border rounded-md"
                dateFormat="dd MMM yyyy"
                placeholderText="เลือกวันที่เริ่ม"
                locale={th}
                isClearable
                showTimeSelect={false}
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm mb-1 text-black">วันที่สิ้นสุดโปรโมชั่น</label>
              <DatePicker
                id="create-promotion-end-date" //เพิ่ม id
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="w-full p-2 border rounded-md"
                dateFormat="dd MMM yyyy"
                placeholderText="เลือกวันที่สิ้นสุด"
                locale={th}
                isClearable
                showTimeSelect={false}
              />
            </div>
          </div>
          {originalPrice && (
            <p className="text-sm text-gray-500 mt-1">
              ราคาเดิม: ฿{originalPrice}
            </p>
          )}
          {/* Product Combobox */}
          <div>
            <label className="block text-sm mb-1 text-black">เลือกสินค้า</label>
            <Combobox value={selectedProduct} onChange={(product) => {
              setSelectedProduct(product);
              setOriginalPrice(product ? product.sellingPricePerUnit : null);
            }}>
              <div className="relative">
                <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <Combobox.Input 
                    id="create-promotion-product-combobox" //เพิ่ม id
                    className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                    displayValue={(product) => product?.productName || ""}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ค้นหาหรือเลือกสินค้า..."
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </Combobox.Button>
                </div>
                {filteredProducts.length > 0 && (
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredProducts.map((product) => (
                      <Combobox.Option
                        key={product._id}
                        value={product}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-purple-100 text-purple-900' : 'text-gray-900'}`
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {product.productName}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
                                ✓
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                )}
                {filteredProducts.length === 0 && query !== "" && (
                  <div className="absolute z-10 mt-1 w-full bg-white py-2 px-4 text-gray-500 rounded-md shadow-lg">
                    ไม่พบสินค้า
                  </div>
                )}
              </div>
            </Combobox>
          </div>
          <input 
            id="create-promotion-discounted-price-input" //เพิ่ม id
            type="number"
            placeholder="ราคา"
            value={discountedPrice}
            onChange={(e) => setDiscountedPrice(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div className="mt-4 flex justify-between">
          <button 
          id="create-promotion-cancel-button" //เพิ่ม id
          className="p-2 bg-red-500 text-white rounded-md" 
          onClick={onClose}>
            ยกเลิก
            </button>
          <button 
          id="create-promotion-submit-button" //เพิ่ม id
          className="p-2 bg-green-500 text-white rounded-md" 
          onClick={handleConfirm} 
          disabled={loading}>
            {loading ? "กำลังบันทึก..." : "ยืนยัน"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePromotionModal;