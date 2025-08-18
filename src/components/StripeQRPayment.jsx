import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaQrcode, FaMobileAlt, FaCheck, FaTimes, FaSpinner, FaCopy, FaExternalLinkAlt } from 'react-icons/fa';
import { IoClose, IoRefresh } from 'react-icons/io5';
import StripeService from '../services/stripe.service';
import useAuthStore from '../store/useAuthStore';
import Swal from 'sweetalert2';

const StripeQRPayment = ({ totalAmount, cartItems, onBack, onSubmit, onClose }) => {
  const { user } = useAuthStore();
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(price);
  };

  // สร้างการชำระเงินใหม่
  const createPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // สร้างข้อมูล Order
      const orderData = StripeService.createOrderData(cartItems, totalAmount, user?.username || 'Guest');
      
      // สร้าง Stripe Payment Link
      const response = await StripeService.createPaymentIntent({
        amount: totalAmount,
        currency: 'thb',
        orderId: `order_${Date.now()}`,
        description: `การชำระเงินสินค้า ${cartItems.length} รายการ`,
        orderData: orderData
      });

      if (response.success) {
        setCheckoutUrl(response.data.qrCodeUrl);
        setPaymentStatus('pending');
        
        // เริ่มการตรวจสอบสถานะ
        startStatusChecking(response.data.paymentLinkId);
        
        // แสดง QR Code
        showQRCode(response.data.qrCodeUrl);
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน');
      }
    } catch (error) {
      console.error('Create payment error:', error);
      
      // จัดการ error ที่ดีขึ้น
      let errorMessage = 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
      } else if (error.response?.status === 401) {
        errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
      } else if (error.response?.status === 400) {
        errorMessage = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูล';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: errorMessage,
        confirmButtonText: 'ลองใหม่'
      });
    } finally {
      setLoading(false);
    }
  };

  // แสดง QR Code
  const showQRCode = (url) => {
    Swal.fire({
      title: 'สแกน QR Code เพื่อชำระเงิน',
      html: `
        <div class="text-center">
          <div class="mb-4">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" 
                 alt="QR Code" class="mx-auto border-2 border-gray-200 rounded-lg" />
          </div>
          <p class="text-sm text-gray-600 mb-2">สแกนด้วยแอปธนาคารของคุณ</p>
          <p class="text-lg font-semibold text-green-600">${formatPrice(totalAmount)}</p>
          <div class="mt-4">
            <button id="copy-url" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
              <i class="fas fa-copy mr-2"></i>คัดลอกลิงก์
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      allowOutsideClick: false,
      didOpen: () => {
        // เพิ่ม event listener สำหรับปุ่มคัดลอก
        document.getElementById('copy-url').addEventListener('click', () => {
          navigator.clipboard.writeText(url);
          Swal.showValidationMessage('คัดลอกลิงก์แล้ว!');
        });
      }
    });
  };

  // เริ่มการตรวจสอบสถานะ
  const startStatusChecking = (paymentLinkId) => {
    const interval = setInterval(async () => {
      try {
        const response = await StripeService.checkPaymentStatus(paymentLinkId);
        
        if (response.success) {
          const status = response.data.status;
          setPaymentStatus(status);
          
          if (status === 'paid') {
            clearInterval(interval);
            handlePaymentSuccess(response.data);
          } else if (status === 'unpaid' || status === 'expired') {
            clearInterval(interval);
            handlePaymentFailure(status);
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 3000); // ตรวจสอบทุก 3 วินาที

    setStatusCheckInterval(interval);
  };

  // จัดการการชำระเงินสำเร็จ
  const handlePaymentSuccess = (paymentData) => {
    Swal.fire({
      icon: 'success',
      title: 'ชำระเงินสำเร็จ!',
      text: `การชำระเงิน ${formatPrice(totalAmount)} สำเร็จแล้ว`,
      confirmButtonText: 'เสร็จสิ้น'
    }).then(() => {
      // ส่งข้อมูลกลับไปยัง parent component
      onSubmit('Stripe', 0, paymentData);
    });
  };

  // จัดการการชำระเงินล้มเหลว
  const handlePaymentFailure = (status) => {
    const statusText = status === 'unpaid' ? 'ล้มเหลว' : 'หมดอายุ';
    
    Swal.fire({
      icon: 'error',
      title: `การชำระเงิน${statusText}`,
      text: `ไม่สามารถชำระเงินได้ กรุณาลองใหม่อีกครั้ง`,
      confirmButtonText: 'ลองใหม่'
    });
  };

  // เปิด Stripe Checkout ในแท็บใหม่ (สำหรับกรณีต้องการดูหน้าเต็ม)
  const openCheckout = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  // Cleanup เมื่อ component unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // สร้างการชำระเงินเมื่อ component mount
  useEffect(() => {
    createPayment();
  }, []);

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full text-center">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">ชำระด้วย QR Code</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoClose size={24} />
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
          <p className="text-gray-600">กำลังสร้างการชำระเงิน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full text-center">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">ชำระด้วย QR Code</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoClose size={24} />
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <FaTimes className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={createPayment}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
        
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          กลับไปเลือกวิธีอื่น
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold">ชำระด้วย QR Code</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <IoClose size={24} />
        </button>
      </div>

      {/* Payment Info */}
      <div className="bg-gray-50 p-6 rounded-2xl mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">ยอดที่ต้องชำระ</span>
          <span className="text-xl font-semibold text-red-500">
            {formatPrice(totalAmount)}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">สถานะ</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
            paymentStatus === 'unpaid' ? 'bg-red-100 text-red-800' :
            paymentStatus === 'expired' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {paymentStatus === 'paid' ? 'สำเร็จ' :
             paymentStatus === 'unpaid' ? 'ล้มเหลว' :
             paymentStatus === 'expired' ? 'หมดอายุ' :
             'รอชำระเงิน'}
          </span>
        </div>
      </div>

      {/* QR Code Display */}
      {checkoutUrl && (
        <div className="bg-white p-6 rounded-2xl mb-6 text-center">
          <div className="mb-4">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkoutUrl)}`}
              alt="QR Code"
              className="mx-auto border-2 border-gray-200 rounded-lg"
            />
          </div>
          
          <p className="text-sm text-gray-600 mb-2">สแกนด้วยแอปธนาคารของคุณ</p>
          <p className="text-lg font-semibold text-green-600 mb-4">{formatPrice(totalAmount)}</p>
          
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(checkoutUrl);
                Swal.fire({
                  icon: 'success',
                  title: 'คัดลอกลิงก์แล้ว!',
                  text: 'ลิงก์การชำระเงินถูกคัดลอกไปยัง clipboard แล้ว',
                  timer: 2000,
                  showConfirmButton: false
                });
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <FaCopy size={14} />
              คัดลอกลิงก์
            </button>
            
            <button
              onClick={openCheckout}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <FaExternalLinkAlt size={14} />
              ดูหน้าเต็ม
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => {
            if (statusCheckInterval) {
              clearInterval(statusCheckInterval);
            }
            createPayment();
          }}
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <IoRefresh size={20} />
          รีเฟรช QR Code
        </button>
        
        <button
          onClick={onBack}
          className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
        >
          กลับไปเลือกวิธีอื่น
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <h4 className="font-semibold text-blue-800 mb-2">วิธีการชำระเงิน:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. เปิดแอปธนาคารของคุณ</li>
          <li>2. เลือก "สแกน QR Code"</li>
          <li>3. สแกน QR Code ข้างต้น</li>
          <li>4. ยืนยันการชำระเงิน</li>
          <li>5. รอการยืนยันจากระบบ</li>
        </ol>
      </div>
    </div>
  );
};

export default StripeQRPayment;
