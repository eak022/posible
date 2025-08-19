import api from './api';

class StripeService {
  // สร้างการชำระเงินใหม่ (Payment Intent)
  static async createPaymentIntent(paymentData) {
    try {
      // ❌ ไม่ส่ง orderId ที่ไม่ถูกต้อง - ระบบจะสร้างเอง
      const { orderId, ...cleanPaymentData } = paymentData;
      
      const response = await api.post('/stripe/create-payment-intent', cleanPaymentData);
      return response.data;
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  // ตรวจสอบสถานะการชำระเงินจาก Payment Intent
  static async checkPaymentStatus(paymentIntentId) {
    try {
      const response = await api.get(`/stripe/payment-status/${paymentIntentId}`);
      return response.data;
    } catch (error) {
      console.error('Check payment status error:', error);
      throw error;
    }
  }

  // ยกเลิกการชำระเงิน
  static async cancelPayment(paymentIntentId) {
    try {
      const response = await api.post(`/stripe/cancel-payment/${paymentIntentId}`, {});
      return response.data;
    } catch (error) {
      console.error('Cancel payment error:', error);
      throw error;
    }
  }

  // ✅ สร้างข้อมูล Order สำหรับ Stripe - แก้ไขให้ส่งข้อมูลที่กระชับ
  static createOrderData(cartItems, totalAmount, userName) {
    // ✅ ส่งเฉพาะข้อมูลที่จำเป็น เพื่อไม่ให้ metadata เกิน 500 ตัวอักษร
    return {
      userName: userName,
      cartItems: cartItems.length, // ส่งจำนวนรายการแทนข้อมูลทั้งหมด
      total: totalAmount,
      orderDate: new Date()
    };
  }
}

export default StripeService;
