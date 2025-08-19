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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [paymentData, setPaymentData] = useState(null); // เพิ่ม state สำหรับเก็บข้อมูลการชำระเงิน

  const formatPrice = (price) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(price);
  };

  // ดึง QR Code จาก PromptPay.io โดยตรง
  const generateQRCode = async (url) => {
    try {
      // ตรวจสอบว่า URL ถูกต้องหรือไม่
      if (!url || !url.startsWith('https://')) {
        throw new Error('URL ไม่ถูกต้อง');
      }

      // ดึงรูป QR Code จาก PromptPay.io โดยตรง
      // ใช้ URL ที่ได้จาก backend ที่มี format: https://promptpay.io/merchantId/amount
      setQrCodeDataUrl(url);
      
    } catch (error) {
      // Fallback: ใช้ external service อื่นๆ ถ้า PromptPay.io ไม่ทำงาน
      try {
        const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&margin=3&ecc=H`;
        setQrCodeDataUrl(fallbackUrl);
      } catch (fallbackError) {
        // Fallback ที่ 2: ใช้ Google Charts API
        try {
          const googleQRUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(url)}&choe=UTF-8&chld=H`;
          setQrCodeDataUrl(googleQRUrl);
        } catch (googleError) {
          // Fallback ที่ 3: ใช้ QR Server ที่เสถียรกว่า
          try {
            const stableQRUrl = `https://qr.ae/api/v1/create?text=${encodeURIComponent(url)}&size=250&margin=3&ecc=H`;
            setQrCodeDataUrl(stableQRUrl);
          } catch (stableError) {
            // แสดงข้อความ error ให้ user ทราบ
            setError('ไม่สามารถดึง QR Code ได้ กรุณาลองใหม่อีกครั้ง');
          }
        }
      }
    }
  };

  // สร้างการชำระเงินใหม่
  const createPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Reset payment data
      setPaymentData(null);

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
        const { qrCodeUrl, promptPayUrl, paymentIntentId } = response.data;
        
        // เก็บข้อมูลการชำระเงินไว้ใน state
        setPaymentData({
          qrCodeUrl,
          promptPayUrl,
          paymentIntentId,
          amount: totalAmount,
          status: 'pending'
        });
        
        // ตรวจสอบว่า URL ที่ได้จาก Stripe ถูกต้องหรือไม่
        if (!qrCodeUrl || !qrCodeUrl.startsWith('https://')) {
          throw new Error('URL การชำระเงินไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        }

        setCheckoutUrl(qrCodeUrl);
        setPaymentStatus('pending');
        
        // สร้าง QR Code จาก URL ที่ได้จาก Stripe (PromptPay โดยตรง)
        await generateQRCode(qrCodeUrl);
        
        // เริ่มการตรวจสอบสถานะ
        if (paymentIntentId) {
          startStatusChecking(paymentIntentId);
        }
        
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน');
      }
    } catch (error) {
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

  // เริ่มการตรวจสอบสถานะ
  const startStatusChecking = (paymentIntentId) => {
    const interval = setInterval(async () => {
      try {
        const response = await StripeService.checkPaymentStatus(paymentIntentId);
        
        if (response.success) {
          const status = response.data.status;
          
          // อัปเดต paymentData เมื่อสถานะเปลี่ยน
          setPaymentData(prev => prev ? { ...prev, status } : null);
          
          if (status === 'paid') {
            clearInterval(interval);
            handlePaymentSuccess(response.data);
          }
          // ไม่ต้องอัปเดตสถานะเป็นล้มเหลวหรือหมดอายุอัตโนมัติ
          // ให้สถานะคงที่จนกว่าจะสำเร็จหรือออกจากหน้าชำระเงิน
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 5000); // ตรวจสอบทุก 5 วินาที

    setStatusCheckInterval(interval);
  };

  // จัดการการชำระเงินสำเร็จ
  const handlePaymentSuccess = (paymentData) => {
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
      // ส่งข้อมูลกลับไปยัง parent component - เปลี่ยนจาก 'Stripe' เป็น 'banktransfer'
      onSubmit('banktransfer', 0, paymentData);
    });
  };

  // จัดการการชำระเงินล้มเหลว
  const handlePaymentFailure = (status) => {
    // ไม่แสดง alert ที่ไม่ต้องการ
    // แค่ log ข้อมูลเพื่อ debug
    
    // อัปเดตสถานะใน state เท่านั้น
    setPaymentStatus(status);
  };

  // จัดการเมื่อออกจากหน้าชำระเงิน
  const handleClose = () => {
    // ตรวจสอบสถานะสุดท้ายก่อนออก
    if (paymentData?.paymentIntentId) {
      StripeService.checkPaymentStatus(paymentData.paymentIntentId)
        .then(response => {
          if (response.success) {
            const status = response.data.status;
            
            if (status === 'paid') {
              // ถ้าชำระเงินสำเร็จ ให้สร้างออร์เดอร์ก่อนออก
              handlePaymentSuccess(response.data);
            } else if (status === 'unpaid' || status === 'expired') {
              // ถ้าชำระเงินล้มเหลว ให้จัดการล้มเหลว
              handlePaymentFailure(status);
            } else {
              // สถานะอื่นๆ ให้ออกไปเลย
              onClose();
            }
          } else {
            // ถ้าไม่สามารถตรวจสอบได้ ให้ออกไปเลย
            onClose();
          }
        })
        .catch(error => {
          console.error('Final status check error:', error);
          // ถ้าเกิด error ให้ออกไปเลย
          onClose();
        });
    } else {
      // ถ้าไม่มี paymentIntentId ให้ออกไปเลย
      onClose();
    }
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
    <div className="max-w-md mx-auto w-full">
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
        
        {/* แสดงข้อความสถานะเพิ่มเติม */}
        <div className="text-center text-sm text-gray-500">
          {paymentStatus === 'pending' && (
            <div>
              <p>ระบบจะตรวจสอบสถานะอัตโนมัติทุก 5 วินาที</p>
              <p className="text-xs text-gray-400 mt-1">สถานะล่าสุด: {paymentData?.status || 'รอชำระเงิน'}</p>
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 หลังจากโอนเงินสำเร็จ ระบบจะแสดงแจ้งเตือนและกลับมาหน้าขายอัตโนมัติ
                </p>
              </div>
            </div>
          )}
          {paymentStatus === 'paid' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 font-medium">การชำระเงินสำเร็จแล้ว! 🎉</p>
              <p className="text-xs text-green-600 mt-1">กำลังสร้างออร์เดอร์และเคลียร์ตะกร้า...</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Display */}
      {checkoutUrl && qrCodeDataUrl && (
        <div className="bg-white p-6 rounded-2xl mb-6 text-center">
          <div className="mb-4">
            <img 
              src={qrCodeDataUrl}
              alt="QR Code จาก PromptPay.io"
              className="mx-auto border-2 border-gray-200 rounded-lg"
              onError={(e) => {
                setError('QR Code ไม่สามารถแสดงผลได้ กรุณาลองใหม่อีกครั้ง');
              }}
            />
          </div>
          
          <p className="text-sm text-gray-600 mb-2">สแกนด้วยแอปธนาคารของคุณ</p>
          <p className="text-lg font-semibold text-green-600 mb-4">{formatPrice(totalAmount)}</p>
          <p className="text-xs text-gray-500 mb-4">หลังจากสแกนแล้ว สามารถกดปุ่ม "ตรวจสอบสถานะ" เพื่อดูผลการชำระเงิน</p>
          
          {/* แสดงข้อมูลการทำงานของระบบ */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-2">ระบบจะทำงานอัตโนมัติ:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>🔄 ตรวจสอบสถานะทุก 5 วินาที</p>
              <p>✅ เมื่อสำเร็จ: แจ้งเตือน + สร้างออร์เดอร์ + เคลียร์ตะกร้า + กลับหน้าขาย</p>
              <p>📱 หรือกดปุ่ม "ตรวจสอบสถานะ" เพื่อตรวจสอบทันที</p>
            </div>
          </div>

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
                          handlePaymentSuccess(response.data);
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
          <p className="text-yellow-700">กำลังดึง QR Code จาก PromptPay.io...</p>
          <button
            onClick={() => generateQRCode(checkoutUrl)}
            className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 transition-colors"
          >
            ลองดึง QR Code อีกครั้ง
          </button>
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
            createPayment();
          }}
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <IoRefresh size={20} />
          รีเฟรช QR Code
        </button>
        
        <button
          onClick={handleClose}
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
          <li>3. สแกน QR Code ข้างต้องการ</li>
          <li>4. ยืนยันการชำระเงิน</li>
          <li>5. รอการยืนยันจากระบบ</li>
        </ol>
      </div>
    </div>
  );
};

export default StripeQRPayment;
