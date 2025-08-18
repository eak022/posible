import { motion } from "framer-motion";
import Modal from "react-modal";
import { useState } from "react";
import { filter } from "framer-motion/client";

const FilterModal = ({
  isModalOpen,
  setIsModalOpen,
  priceRange,
  setPriceRange,
  stockRange,
  setStockRange,
  handleSort,
  handleReset,
  isCartOpen,
}) => {
  // Temporary states for inputs
  const [tempPriceRange, setTempPriceRange] = useState(priceRange);
  const [tempStockRange, setTempStockRange] = useState(stockRange);

  const applyFilters = () => {
    setPriceRange(tempPriceRange);
    setStockRange(tempStockRange);
    handleSort(); // Call the sort function
    setIsModalOpen(false); // Close the modal
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onRequestClose={() => setIsModalOpen(false)}
      contentLabel="Filter Modal"
      className="relative z-50 flex items-center justify-center"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="relative bg-white p-8 rounded-2xl shadow-xl w-96 transition-all duration-300 z-50"
      >
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          กรองสินค้า
        </h2>
        <div className="space-y-6">
          {/* Filter by price */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              ช่วงราคา (บาท)
            </label>
            <div className="flex space-x-4">
              <input
                type="number"
                placeholder="เช่น 10"
                value={tempPriceRange.min}
                onChange={(e) => setTempPriceRange({ ...tempPriceRange, min: e.target.value })}
                className="w-1/2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                min={0}
              />
              <input
                type="number"
                placeholder="เช่น 1000"
                value={tempPriceRange.max}
                onChange={(e) => setTempPriceRange({ ...tempPriceRange, max: e.target.value })}
                className="w-1/2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                min={0}
              />
            </div>
          </div>
          <hr className="my-2 border-gray-200" />
          {/* Filter by stock */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              จำนวนสินค้า (ชิ้น)
            </label>
            <div className="flex space-x-4">
              <input
                type="number"
                placeholder="เช่น 1"
                value={tempStockRange.min}
                onChange={(e) => setTempStockRange({ ...tempStockRange, min: e.target.value })}
                className="w-1/2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                min={0}
              />
              <input
                type="number"
                placeholder="เช่น 100"
                value={tempStockRange.max}
                onChange={(e) => setTempStockRange({ ...tempStockRange, max: e.target.value })}
                className="w-1/2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                min={0}
              />
            </div>
          </div>
          <hr className="my-2 border-gray-200" />
          {/* Validation message */}
          {(!!tempPriceRange.min && !!tempPriceRange.max && Number(tempPriceRange.min) > Number(tempPriceRange.max)) && (
            <div className="text-xs text-red-500 font-semibold text-center">ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด</div>
          )}
          {(!!tempStockRange.min && !!tempStockRange.max && Number(tempStockRange.min) > Number(tempStockRange.max)) && (
            <div className="text-xs text-red-500 font-semibold text-center">จำนวนต่ำสุดต้องไม่มากกว่าจำนวนสูงสุด</div>
          )}
          {/* ปุ่ม */}
          <button
            onClick={applyFilters}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition duration-300 flex items-center justify-center gap-2 text-lg font-semibold"
            disabled={
              (!!tempPriceRange.min && !!tempPriceRange.max && Number(tempPriceRange.min) > Number(tempPriceRange.max)) ||
              (!!tempStockRange.min && !!tempStockRange.max && Number(tempStockRange.min) > Number(tempStockRange.max))
            }
          >
            <span role="img" aria-label="filter"></span> กรอง
          </button>
          <button
            onClick={() => {
              setTempPriceRange({ min: "", max: "" });
              setTempStockRange({ min: "", max: "" });
              handleReset();
            }}
            className="w-full px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition duration-300 flex items-center justify-center gap-2 text-lg font-semibold"
          >
            <span role="img" aria-label="reset"></span> รีเซ็ตตัวกรอง
          </button>
          <button
            onClick={() => setIsModalOpen(false)}
            className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition duration-300 flex items-center justify-center gap-2 text-lg font-semibold"
          >
            <span role="img" aria-label="close"></span> ปิด
          </button>
        </div>
      </motion.div>
    </Modal>
  );
};

export default FilterModal;
