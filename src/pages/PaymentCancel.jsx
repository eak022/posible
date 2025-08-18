import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimesCircle, FaHome, FaShoppingCart } from 'react-icons/fa';
import { motion } from 'framer-motion';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {/* Cancel Icon */}
        <div className="mb-6">
          <FaTimesCircle className="text-6xl text-red-500 mx-auto" />
        </div>

        {/* Cancel Message */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          ยกเลิกการชำระเงิน
        </h1>
        
        <p className="text-gray-600 mb-6">
          การชำระเงินถูกยกเลิกแล้ว คุณสามารถลองใหม่อีกครั้งได้
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <FaShoppingCart size={16} />
            กลับไปตะกร้าสินค้า
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <FaHome size={16} />
            กลับหน้าหลัก
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-700">
            สินค้าของคุณยังอยู่ในตะกร้า คุณสามารถชำระเงินใหม่ได้
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCancel;
