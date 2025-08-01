import { useState, useEffect } from "react";
import promotionService from "../../services/promotion.service";
import productService from "../../services/product.service"; // นำเข้า productService
import DatePicker from "react-datepicker"; // นำเข้า react-datepicker
import "react-datepicker/dist/react-datepicker.css"; // สไตล์ของ Datepicker
import Swal from "sweetalert2"; // นำเข้า Swal

const EditPromotionModal = ({ promotion, onClose }) => {
  const [formData, setFormData] = useState({
    promotionName: "",
    validityStart: new Date(),  // ให้เริ่มต้นเป็นวันที่ปัจจุบัน
    validityEnd: new Date(),    // ให้เริ่มต้นเป็นวันที่ปัจจุบัน
    sellingPricePerUnit: "",
    discountedPrice: "",
    productId: "", // เพิ่มการเก็บ productId
  });

  const [products, setProducts] = useState([]); // เก็บข้อมูลสินค้าทั้งหมด

  useEffect(() => {
    if (promotion) {
      setFormData({
        promotionName: promotion.promotionName || "",
        validityStart: new Date(promotion.validityStart) || new Date(), // ใช้ Date constructor เพื่อแปลงเป็นวันที่
        validityEnd: new Date(promotion.validityEnd) || new Date(),     // ใช้ Date constructor เพื่อแปลงเป็นวันที่
        sellingPricePerUnit: promotion.sellingPricePerUnit || "",
        discountedPrice: promotion.discountedPrice || "",
        productId: promotion.productId || "", // ใช้ค่า productId ที่มีอยู่แล้ว
      });
    }

    // ดึงข้อมูลสินค้าทั้งหมด
    const fetchProducts = async () => {
      try {
        const allProducts = await productService.getAllProducts(); // เรียก API
        setProducts(allProducts); // ตั้งค่ารายการสินค้าที่ได้
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts(); // เรียกใช้ฟังก์ชันนี้เมื่อมีการโหลดคอมโพเนนต์
  }, [promotion]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date, name) => {
    setFormData({ ...formData, [name]: date });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ตรวจสอบว่าราคาหลังลดต้องน้อยกว่าราคาก่อนลด
    if (parseFloat(formData.discountedPrice) >= parseFloat(formData.sellingPricePerUnit)) {
      alert("ราคาหลังลดต้องน้อยกว่าราคาก่อนลด!");
      return;
    }

    // ตรวจสอบว่าช่วงเวลาถูกต้อง
    if (formData.validityStart >= formData.validityEnd) {
      alert("วันที่สิ้นสุดต้องมากกว่าวันที่เริ่ม!");
      return;
    }

    try {
      // ส่งข้อมูลไปอัพเดตโปรโมชั่น
      await promotionService.updatePromotion(promotion._id, formData);

      // แสดง swal ว่าแก้ไขสำเร็จ
      Swal.fire({
        icon: 'success',
        title: 'แก้ไขโปรโมชั่นสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });

      // ปิด modal หลังจากแสดง swal
      onClose();
    } catch (error) {
      console.error("Error updating promotion:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-semibold mb-4 text-black">แก้ไขโปรโมชั่น</h2>
        <form onSubmit={handleSubmit}>
          {/* ชื่อโปรโมชั่น */}
          <label className="block mb-2 text-black">ชื่อโปรโมชั่น</label>
          <input 
            id="edit-promotion-name-input" //เพิ่ม id
            type="text"
            name="promotionName"
            value={formData.promotionName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          
          {/* ระยะเวลาโปรโมชั่น */}
          <label className="block mt-3 mb-2 text-black">ระยะเวลาโปรโมชั่น</label>
          <div className="flex space-x-4">
            <div className="w-1/2">
              <DatePicker 
                id="edit-promotion-start-date" //เพิ่ม id
                selected={formData.validityStart}
                onChange={(date) => handleDateChange(date, "validityStart")}
                selectsStart
                startDate={formData.validityStart}
                endDate={formData.validityEnd}
                className="w-full p-2 border rounded"
                dateFormat="yyyy-MM-dd"
                placeholderText="เลือกวันที่เริ่ม"
              />
            </div>
            <div className="w-1/2">
              <DatePicker 
                id="edit-promotion-end-date" //เพิ่ม id
                selected={formData.validityEnd}
                onChange={(date) => handleDateChange(date, "validityEnd")}
                selectsEnd
                startDate={formData.validityStart}
                endDate={formData.validityEnd}
                minDate={formData.validityStart} // วันที่สิ้นสุดต้องไม่ต่ำกว่าวันที่เริ่ม
                className="w-full p-2 border rounded"
                dateFormat="yyyy-MM-dd"
                placeholderText="เลือกวันที่สิ้นสุด"
              />
            </div>
          </div>

          {/* ราคาหลังลด */}
          <label className="block mt-3 mb-2 text-black">ราคา</label>
          {promotion?.productId?.sellingPricePerUnit && (
            <p className="text-sm text-gray-500 mb-1">
              ราคาเดิม: ฿{promotion.productId.sellingPricePerUnit}
            </p>
          )}
          <input 
            id="edit-promotion-discounted-price-input " //เพิ่ม id
            type="number"
            name="discountedPrice"
            value={formData.discountedPrice}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            min="0"
          />

          {/* ปุ่ม */}
          <div className="flex justify-between mt-4">
            <button 
            id="edit-promotion-cancel-button" //เพิ่ม id
            type="button" 
            className="px-4 py-2 bg-red-500 text-white rounded" 
            onClick={onClose}>
              ยกเลิก
            </button>
            <button 
            id="edit-promotion-submit-button" //เพิ่ม id
            type="submit" 
            className="px-4 py-2 bg-green-500 text-white rounded">
              ยืนยัน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPromotionModal;
