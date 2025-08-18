import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaHome, FaReceipt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // TODO: ดึงข้อมูล Order จาก session_id
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <div className="mb-6">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          ชำระเงินสำเร็จ!
        </h1>
        
        <p className="text-gray-600 mb-6">
          ขอบคุณที่ใช้บริการ ระบบได้บันทึกการชำระเงินของคุณแล้ว
        </p>

        {/* Session ID */}
        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">รหัสการชำระเงิน</p>
            <p className="font-mono text-sm text-gray-700 break-all">
              {sessionId}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <FaHome size={16} />
            กลับหน้าหลัก
          </button>
          
          <button
            onClick={() => navigate('/orders')}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <FaReceipt size={16} />
            ดูรายการคำสั่งซื้อ
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            ระบบจะส่งอีเมลยืนยันการชำระเงินไปยังอีเมลที่ลงทะเบียน
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
