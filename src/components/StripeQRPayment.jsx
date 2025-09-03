import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaQrcode, FaMobileAlt, FaCheck, FaTimes, FaSpinner, FaCopy, FaExternalLinkAlt } from 'react-icons/fa';
import { IoClose, IoRefresh } from 'react-icons/io5';
import StripeService from '../services/stripe.service';
import useAuthStore from '../store/useAuthStore';
import Swal from 'sweetalert2';
import api from '../services/api'; // เพิ่ม import api

const StripeQRPayment = ({ totalAmount, cartItems, onBack, onSubmit, onClose }) => {
  const { user } = useAuthStore();
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [paymentData, setPaymentData] = useState(null); // เพิ่ม state สำหรับเก็บข้อมูลการชำระเงิน

  const formatPrice = (price) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(price);
  };

  // ใช้ QR ของ Stripe โดยตรง - ไม่ต้องใช้ไลบรารี
  const generateQRCode = async (qrUrl) => {
    try {
      // ตรวจสอบว่า URL ถูกต้องหรือไม่
      if (!qrUrl || !qrUrl.startsWith('https://')) {
        throw new Error('URL ไม่ถูกต้อง');
      }

      // ใช้ QR ของ Stripe โดยตรง - แค่ set URL
      setQrCodeDataUrl(qrUrl);
      
    } catch (error) {
      console.error('QR Code generation error:', error);
      setError('ไม่สามารถดึง QR Code ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // ✅ สร้างการชำระเงินใหม่ - เพิ่มการจัดการ error ที่ดีขึ้น
  const createPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Reset payment data และ retry count
      setPaymentData(null);
      setRetryCount(0);
      
      // ✅ ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วน
      if (!cartItems || cartItems.length === 0) {
        throw new Error('ไม่มีสินค้าในตะกร้า');
      }
      
      if (!totalAmount || totalAmount <= 0) {
        throw new Error('ยอดเงินไม่ถูกต้อง');
      }
      
      if (!user?.username) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนทำรายการ');
      }

      // สร้างข้อมูล Order
      const orderData = StripeService.createOrderData(cartItems, totalAmount, user.username);
      
      // ✅ สร้าง Stripe Payment Intent พร้อม timeout
      const paymentPromise = StripeService.createPaymentIntent({
        amount: totalAmount,
        currency: 'thb',
        description: `การชำระเงินสินค้า ${cartItems.length} รายการ`,
        orderData: orderData,
        cartItems: cartItems,
        userName: user.username
      });
      
      // เพิ่ม timeout 30 วินาทีสำหรับการสร้าง Payment Intent
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('การสร้างการชำระเงินใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง')), 30000);
      });
      
      const response = await Promise.race([paymentPromise, timeoutPromise]);

      if (response.success) {
        const { qrCodeUrl, promptPayUrl, paymentIntentId } = response.data;
        
        // เก็บข้อมูลการชำระเงินไว้ใน state
        const newPaymentData = {
          qrCodeUrl,
          promptPayUrl,
          paymentIntentId,
          amount: totalAmount,
          status: 'pending'
        };
        
        setPaymentData(newPaymentData);
        
        // เก็บข้อมูลการชำระเงินใน localStorage เพื่อป้องกันการสูญเสียเมื่อรีเฟรชหน้า
        localStorage.setItem('stripePaymentData', JSON.stringify(newPaymentData));
        
        // ตรวจสอบว่า URL ที่ได้จาก Stripe ถูกต้องหรือไม่
        if (!qrCodeUrl || !qrCodeUrl.startsWith('https://')) {
          throw new Error('ไม่สามารถสร้าง QR Code ได้ กรุณาลองใหม่อีกครั้ง');
        }

        setCheckoutUrl(qrCodeUrl);
        setPaymentStatus('pending');
        
        // สร้าง QR Code จาก URL ที่ได้จาก Stripe
        await generateQRCode(qrCodeUrl);
        
        // ❌ ลบการสร้าง Order ใน Frontend - รอให้ Stripe webhook ส่งข้อมูลกลับมา
        // if (onSubmit) {
        //   onSubmit('Stripe', 0, newPaymentData);
        // }
        
        // เริ่มการตรวจสอบสถานะ
        if (paymentIntentId) {
          startStatusChecking(paymentIntentId);
        }
        
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน');
      }
          } catch (error) {
        // ✅ จัดการ error ที่ดีขึ้น - เพิ่มการจัดการ API ไม่พร้อมใช้งาน
        let errorMessage = 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน';
        let errorType = 'unknown';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 500) {
          errorMessage = 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
          errorType = 'server_error';
        } else if (error.response?.status === 401) {
          errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
          errorType = 'auth_error';
        } else if (error.response?.status === 400) {
          errorMessage = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูล';
          errorType = 'validation_error';
        } else if (error.response?.status === 429) {
          errorMessage = 'เกินขีดจำกัดการเรียกใช้ API กรุณาลองใหม่อีกครั้งในภายหลัง';
          errorType = 'rate_limit';
        } else if (error.response?.status === 503) {
          errorMessage = 'บริการไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง';
          errorType = 'service_unavailable';
        } else if (error.response?.status === 0 || error.code === 'NETWORK_ERROR') {
          errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
          errorType = 'network_error';
        } else if (error.message) {
          errorMessage = error.message;
          if (error.message.includes('timeout')) {
            errorType = 'timeout_error';
          }
        }
        
        setError(errorMessage);
        
        // ✅ เพิ่มการ log error เพื่อ debug
        console.error('Payment creation error:', {
          error: error,
          response: error.response,
          status: error.response?.status,
          message: error.response?.data?.message,
          errorType: errorType,
          timestamp: new Date().toISOString()
        });
        
        // ✅ แสดง error message ที่เหมาะสมตามประเภทของ error
        let icon = 'error';
        let title = 'เกิดข้อผิดพลาด';
        
        if (errorType === 'network_error') {
          icon = 'warning';
          title = 'ปัญหาการเชื่อมต่อ';
        } else if (errorType === 'timeout_error') {
          icon = 'warning';
          title = 'การเชื่อมต่อช้า';
        } else if (errorType === 'service_unavailable') {
          icon = 'warning';
          title = 'บริการไม่พร้อมใช้งาน';
        }
        
        Swal.fire({
          icon: icon,
          title: title,
          text: errorMessage,
          confirmButtonText: 'ลองใหม่',
          showCancelButton: errorType === 'network_error' || errorType === 'timeout_error',
          cancelButtonText: 'ปิด',
          confirmButtonColor: errorType === 'network_error' || errorType === 'timeout_error' ? '#f59e0b' : '#ef4444'
        }).then((result) => {
          if (result.isConfirmed && (errorType === 'network_error' || errorType === 'timeout_error')) {
            // ลองใหม่สำหรับ network error
            setTimeout(() => {
              createPayment();
            }, 2000); // รอ 2 วินาทีก่อนลองใหม่
          }
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
            <img src="${qrCodeDataUrl}" 
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

  // ✅ เพิ่ม state สำหรับจัดการ webhook timeout
  const [webhookTimeout, setWebhookTimeout] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3; // จำนวนครั้งสูงสุดที่จะลองใหม่
  const WEBHOOK_TIMEOUT = 60000; // 60 วินาที รอ webhook

  // เริ่มการตรวจสอบสถานะ
  const startStatusChecking = (paymentIntentId) => {
    const interval = setInterval(async () => {
      try {
        const response = await StripeService.checkPaymentStatus(paymentIntentId);
        
        if (response.success) {
          const status = response.data.status;
          
          // อัปเดต paymentData เมื่อสถานะเปลี่ยน
          setPaymentData(prev => prev ? { ...prev, status } : null);
          
                    if (status === 'succeeded') {
            // รอให้ webhook สร้าง Order ก่อน
            setPaymentStatus('processing');
            
            // ✅ เริ่ม webhook timeout
            startWebhookTimeout(paymentIntentId);
            
            // ✅ ตรวจสอบ Order ในฐานข้อมูล
            try {
              await checkOrderCreation(paymentIntentId);
            } catch (error) {
              console.error('Error checking order creation:', error);
              // ไม่ต้องแสดง error ให้ user เพราะยังอยู่ในขั้นตอนการตรวจสอบ
            }
            
          } else if (status === 'processing') {
            setPaymentStatus('processing');
          } else if (status === 'requires_action') {
            // เพิ่มการจัดการ requires_action status
            setPaymentStatus('requires_action');
            
            // ไม่แสดง error message เพราะเป็นสถานะปกติ - แค่รอ user ยืนยัน
            setError(null);
            
            // เริ่มการตรวจสอบสถานะถัดไป
            setTimeout(() => {
              // ไม่ต้อง clear interval เพราะต้องการตรวจสอบต่อ
            }, 10000); // รอ 10 วินาทีแล้วลองใหม่
            
          } else if (status === 'failed' || status === 'canceled' || status === 'expired') {
            clearInterval(interval);
            clearWebhookTimeout();
            handlePaymentFailure(status);
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
        clearInterval(interval);
        clearWebhookTimeout();
        setError('ไม่สามารถตรวจสอบสถานะการชำระเงินได้');
        
        // ✅ แสดง error message ให้ user ทราบ
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถตรวจสอบสถานะการชำระเงินได้ กรุณาลองใหม่อีกครั้ง',
          confirmButtonText: 'ตกลง'
        });
      }
    }, 5000); // ✅ ลดเป็น 5 วินาที เพื่อตรวจสอบ Order เร็วขึ้น

    setStatusCheckInterval(interval);
  };

  // ✅ เพิ่มฟังก์ชันจัดการ webhook timeout
  const startWebhookTimeout = (paymentIntentId) => {
    const timeout = setTimeout(async () => {
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        
        // ลองตรวจสอบ Order อีกครั้ง
        await checkOrderCreation(paymentIntentId);
      } else {
        // เกินจำนวนครั้งที่กำหนด - แสดง error และให้ user จัดการเอง
        setError('ระบบไม่สามารถสร้าง Order อัตโนมัติได้ กรุณาติดต่อเจ้าหน้าที่');
        
        Swal.fire({
          icon: 'warning',
          title: 'แจ้งเตือน',
          text: 'การชำระเงินสำเร็จแล้ว แต่ระบบไม่สามารถสร้าง Order อัตโนมัติได้ กรุณาติดต่อเจ้าหน้าที่เพื่อตรวจสอบ',
          confirmButtonText: 'ตกลง'
        }).then(() => {
          // ปิดหน้าและกลับไปหน้าขาย
          if (onClose) onClose();
        });
      }
    }, WEBHOOK_TIMEOUT);
    
    setWebhookTimeout(timeout);
  };

  // ✅ เพิ่มฟังก์ชันเคลียร์ webhook timeout
  const clearWebhookTimeout = () => {
    if (webhookTimeout) {
      clearTimeout(webhookTimeout);
      setWebhookTimeout(null);
    }
  };

  // ✅ เพิ่มฟังก์ชันตรวจสอบ Order creation - ใช้ API ที่มีอยู่จริงใน backend
  const checkOrderCreation = async (paymentIntentId) => {
    try {
      // ใช้ API ที่มีอยู่จริงใน backend
      const response = await api.get(`/order/check-stripe-payment/${paymentIntentId}`);
      
      if (response.data.success && response.data.order) {
        // Order ถูกสร้างแล้ว
        clearInterval(statusCheckInterval);
        
        // อัปเดต paymentData ด้วย orderId และ order object
        setPaymentData(prev => prev ? { 
          ...prev, 
          orderId: response.data.order._id,
          order: response.data.order, // ✅ เพิ่ม order object
          status: 'succeeded'
        } : null);
        
        handlePaymentSuccess({
          ...response.data,
          orderId: response.data.order._id,
          order: response.data.order // ✅ เพิ่ม order object
        });
              } else {
          // ยังไม่สร้าง Order ให้รอต่อไป
        }
    } catch (error) {
      // จัดการ error - ตรวจสอบว่าเป็น 404 (ไม่พบ order) หรือ error อื่น
      if (error.response?.status === 404) {
        // ยังไม่สร้าง Order ให้รอต่อไป
      } else {
        // ถ้าเป็น error อื่น ให้แสดง error message
        setError('ไม่สามารถตรวจสอบการสร้าง Order ได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // จัดการการชำระเงินสำเร็จ
  const handlePaymentSuccess = (paymentData) => {
    // ลบข้อมูลการชำระเงินจาก localStorage เมื่อสำเร็จ
    localStorage.removeItem('stripePaymentData');
    
    Swal.fire({
      icon: 'success',
      title: 'ชำระเงินสำเร็จ! 🎉',
      html: `
        <div class="text-center">
          <p class="text-lg text-green-600 mb-3">การชำระเงิน ${formatPrice(totalAmount)} สำเร็จแล้ว</p>
          <div class="space-y-2 text-sm text-gray-600">
            <p>✅ สร้างออร์เดอร์เรียบร้อย</p>
            <p>✅ เคลียร์ตะกร้าเรียบร้อย</p>
            <p>✅ กลับมาหน้าขาย</p>
          </div>
        </div>
      `,
      confirmButtonText: 'เสร็จสิ้น',
      confirmButtonColor: '#10b981',
      timer: 3000,
      timerProgressBar: true
    }).then(() => {
      // ✅ เคลียร์ตะกร้าหลังจากชำระเงินสำเร็จเท่านั้น
      if (onSubmit) {
        // ส่งข้อมูลกลับไปยัง parent component - เปลี่ยนจาก 'Stripe' เป็น 'banktransfer'
        onSubmit('banktransfer', 0, paymentData);
      }
    });
  };

  // จัดการการชำระเงินล้มเหลว
  const handlePaymentFailure = (status) => {
    // ลบข้อมูลการชำระเงินจาก localStorage เมื่อล้มเหลว
    localStorage.removeItem('stripePaymentData');
    
    // ไม่แสดง alert ที่ไม่ต้องการ
    // แค่ log ข้อมูลเพื่อ debug
    
    // อัปเดตสถานะใน state เท่านั้น
    setPaymentStatus(status);
  };

  // จัดการเมื่อออกจากหน้าชำระเงิน
  const handleClose = () => {
    // ✅ ยกเลิก Payment Intent เมื่อออกจากหน้าจอ (ถ้ายังไม่ชำระเงิน)
    if (paymentData?.paymentIntentId) {
      handleCancelPayment();
    }
    
    // ลบข้อมูลการชำระเงินจาก localStorage
    localStorage.removeItem('stripePaymentData');
    
    // เรียก onClose
    if (onClose) {
      onClose();
    }
  };

  // ✅ จัดการการยกเลิก Payment Intent เมื่อ User ออกจากหน้าจอ
  const handleCancelPayment = async () => {
    try {
      // ✅ ยกเลิก Payment Intent ใน Stripe แทนการยกเลิก Order
      if (paymentData?.paymentIntentId) {
        try {
          await StripeService.cancelPayment(paymentData.paymentIntentId);
          console.log('Payment canceled in Stripe');
        } catch (error) {
          console.error('Error canceling payment in Stripe:', error);
        }
      }
    } catch (error) {
      console.error('Error canceling payment:', error);
    }
  };

  // เปิด Stripe Checkout ในแท็บใหม่ (สำหรับกรณีต้องการดูหน้าเต็ม)
  const openCheckout = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  // ✅ เพิ่มการจัดการ timeout และ cleanup ที่ดีขึ้น
  useEffect(() => {
    // ✅ เริ่ม timeout สำหรับการตรวจสอบสถานะทั้งหมด
    const overallTimeout = setTimeout(() => {
      console.log('Overall payment timeout - stopping all checks');
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
      clearWebhookTimeout();
      
      // แสดง error message
      setError('การตรวจสอบสถานะเกินเวลาที่กำหนด กรุณาลองใหม่อีกครั้ง');
      
      Swal.fire({
        icon: 'warning',
        title: 'แจ้งเตือน',
        text: 'การตรวจสอบสถานะเกินเวลาที่กำหนด กรุณาลองใหม่อีกครั้ง',
        confirmButtonText: 'ตกลง',
        showCancelButton: true,
        cancelButtonText: 'ลองใหม่'
      }).then((result) => {
        if (result.isConfirmed) {
          if (onClose) onClose();
        } else {
          // ลองใหม่
          setError(null);
          if (paymentData?.paymentIntentId) {
            startStatusChecking(paymentData.paymentIntentId);
          }
        }
      });
    }, 300000); // 5 นาที timeout ทั้งหมด

    return () => {
      // ✅ Cleanup ทั้งหมดเมื่อ component unmount
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
      clearWebhookTimeout();
      clearTimeout(overallTimeout);
      
      // ลบข้อมูลการชำระเงินจาก localStorage เมื่อ component unmount
      localStorage.removeItem('stripePaymentData');
    };
  }, [statusCheckInterval, paymentData?.paymentIntentId]);

  // เพิ่มการจัดการเมื่อรีเฟรชหน้า
  useEffect(() => {
    // เมื่อรีเฟรชหน้า ให้ตรวจสอบว่ามีการชำระเงินที่กำลังดำเนินการอยู่หรือไม่
    const checkExistingPayment = () => {
      const existingPayment = localStorage.getItem('stripePaymentData');
      if (existingPayment) {
        try {
          const paymentData = JSON.parse(existingPayment);
          // ตรวจสอบว่าการชำระเงินยังคงมีผลหรือไม่
          if (paymentData.paymentIntentId && paymentData.status === 'pending') {
            setPaymentData(paymentData);
            setCheckoutUrl(paymentData.qrCodeUrl);
            setPaymentStatus('pending');
            // เริ่มการตรวจสอบสถานะใหม่
            startStatusChecking(paymentData.paymentIntentId);
          } else {
            // ลบข้อมูลการชำระเงินที่หมดอายุ
            localStorage.removeItem('stripePaymentData');
          }
        } catch (error) {
          console.error('Error parsing existing payment data:', error);
          localStorage.removeItem('stripePaymentData');
        }
      }
    };

    checkExistingPayment();
  }, []);

  // สร้างการชำระเงินเมื่อ component mount
  useEffect(() => {
    createPayment();
  }, []);

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full text-center">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">ชำระด้วย QR Code</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
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
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
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
          onClick={handleClose}
          className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
        >
          กลับไปเลือกวิธีอื่น
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full overflow-y-auto max-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold">ชำระด้วย QR Code</h2>
        
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
            paymentStatus === 'paid' || paymentStatus === 'succeeded' ? 'bg-green-100 text-green-800' :
            paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
            paymentStatus === 'requires_action' ? 'bg-orange-100 text-orange-800' :
            paymentStatus === 'unpaid' || paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
            paymentStatus === 'expired' || paymentStatus === 'canceled' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {paymentStatus === 'paid' || paymentStatus === 'succeeded' ? 'สำเร็จ' :
             paymentStatus === 'processing' ? 'กำลังประมวลผล' :
             paymentStatus === 'requires_action' ? 'รอยืนยันการชำระเงิน' :
             paymentStatus === 'unpaid' || paymentStatus === 'failed' ? 'ล้มเหลว' :
             paymentStatus === 'expired' || paymentStatus === 'canceled' ? 'หมดอายุ' :
             'รอชำระเงิน'}
          </span>
        </div>
        
        {/* แสดงข้อความสถานะพื้นฐาน */}
        <div className="text-center text-sm text-gray-500">
          {paymentStatus === 'pending' && (
            <p>กรุณาสแกน QR Code เพื่อชำระเงิน</p>
          )}
          {paymentStatus === 'processing' && (
            <p className="text-blue-600">กำลังประมวลผลการชำระเงิน...</p>
          )}
          {paymentStatus === 'requires_action' && (
            <p className="text-orange-600">กรุณายืนยันการชำระเงินในแอปธนาคาร</p>
          )}
          {paymentStatus === 'paid' || paymentStatus === 'succeeded' && (
            <p className="text-green-600">การชำระเงินสำเร็จแล้ว!</p>
          )}
          {(paymentStatus === 'failed' || paymentStatus === 'canceled' || paymentStatus === 'expired') && (
            <p className="text-red-600">การชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง</p>
          )}
        </div>
      </div>

      {/* QR Code Display */}
      {checkoutUrl && qrCodeDataUrl && (
        <div className="bg-white p-6 rounded-2xl mb-6 text-center">
          <div className="mb-4">
            <img 
              src={qrCodeDataUrl}
              alt="QR Code จาก Stripe"
              className="mx-auto w-64 h-64 object-contain border-2 border-gray-200 rounded-lg"
              style={{ maxWidth: '256px', maxHeight: '256px' }}
              onError={(e) => {
                setError('QR Code ไม่สามารถแสดงผลได้ กรุณาลองใหม่อีกครั้ง');
              }}
            />
          </div>
          
          <div className="text-sm text-gray-600 space-y-2 mb-4">
            <p>สแกน QR Code ด้วยแอปธนาคาร</p>
            <p>เลือก PromptPay หรือ Mobile Banking</p>
          </div>
          
          <p className="text-lg font-semibold text-green-600 mb-4">{formatPrice(totalAmount)}</p>
          
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                if (paymentData?.paymentIntentId) {
                  // ตรวจสอบสถานะทันที
                  StripeService.checkPaymentStatus(paymentData.paymentIntentId)
                    .then(response => {
                      if (response.success) {
                        const status = response.data.status;
                        setPaymentStatus(status);
                        setPaymentData(prev => prev ? { ...prev, status } : null);
                        
                        if (status === 'paid') {
                          handlePaymentSuccess({
                            ...response.data,
                            order: response.data.order // ✅ เพิ่ม order object
                          });
                        } else {
                          // แสดงสถานะปัจจุบันโดยไม่จัดการล้มเหลว
                          Swal.fire({
                            icon: 'info',
                            title: 'สถานะปัจจุบัน',
                            text: `สถานะ: ${status === 'pending' ? 'รอชำระเงิน' : status === 'processing' ? 'กำลังประมวลผล' : status === 'unpaid' ? 'ยังไม่ชำระเงิน' : status === 'expired' ? 'หมดอายุ' : status}`,
                            confirmButtonText: 'ตกลง'
                          });
                        }
                      }
                    })
                    .catch(error => {
                      console.error('Manual status check error:', error);
                      Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: 'ไม่สามารถตรวจสอบสถานะได้ กรุณาลองใหม่อีกครั้ง',
                        confirmButtonText: 'ตกลง'
                      });
                    });
                }
              }}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <IoRefresh size={14} />
              ตรวจสอบสถานะ
            </button>
          </div>
        </div>
      )}

      {/* แสดงข้อความถ้ายังไม่มี QR Code */}
      {checkoutUrl && !qrCodeDataUrl && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6 text-center">
          <FaSpinner className="animate-spin text-yellow-500 text-4xl mx-auto mb-4" />
          <p className="text-yellow-700">กำลังดึง QR Code...</p>
        </div>
      )}

      {/* แสดงข้อความถ้าไม่มี checkout URL */}
      {!checkoutUrl && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 text-center">
          <FaQrcode className="text-gray-400 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">รอการสร้างการชำระเงิน...</p>
        </div>
      )}

      {/* แสดง Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
          <FaTimes className="text-red-500 text-2xl mx-auto mb-2" />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => {
            if (statusCheckInterval) {
              clearInterval(statusCheckInterval);
            }
            // ลบข้อมูลการชำระเงินเก่าจาก localStorage
            localStorage.removeItem('stripePaymentData');
            createPayment();
          }}
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <IoRefresh size={20} />
          รีเฟรช QR Code
        </button>
        
        <button
          onClick={() => {
            // ✅ ยกเลิก Payment Intent เมื่อกดปุ่มกลับ
            if (paymentData?.paymentIntentId) {
              handleCancelPayment();
            }
            
            // หยุดการตรวจสอบสถานะ
            if (statusCheckInterval) {
              clearInterval(statusCheckInterval);
            }
            
            // ลบข้อมูลการชำระเงินจาก localStorage
            localStorage.removeItem('stripePaymentData');
            
            // เรียก onBack เพื่อกลับไปยังหน้าเลือกวิธีการชำระเงิน
            if (onBack) {
              onBack();
            } else {
              onClose();
            }
          }}
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
