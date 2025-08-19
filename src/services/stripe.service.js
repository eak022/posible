import api from './api';

class StripeService {
  // สร้างการชำระเงินใหม่ (Payment Intent)
  static async createPaymentIntent(paymentData) {
    try {
      const response = await api.post('/stripe/create-payment-intent', paymentData);
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

  // สร้างข้อมูล Order สำหรับ Stripe
  static createOrderData(cartItems, totalAmount, userName) {
    const products = cartItems.map(item => ({
      productId: item._id,
      image: item.image || item.productImage,
      name: item.productName || item.name, // ใช้ productName เป็นหลัก
      quantity: item.quantity,
      purchasePrice: item.purchasePrice || 0,
      sellingPricePerUnit: item.price,
      pack: item.pack || false,
      packSize: item.packSize,
      lotsUsed: item.lotsUsed || [],
      originalPrice: item.originalPrice || item.price,
      discountAmount: item.discountAmount || 0,
      promotionId: item.promotionId || null, // เพิ่ม promotionId
      // เพิ่มข้อมูลที่จำเป็นสำหรับ backend
      productName: item.productName || item.name // เพิ่ม productName เพื่อความชัดเจน
    }));

    return {
      userName: userName,
      products: products,
      subtotal: totalAmount,
      total: totalAmount,
      promotionId: cartItems
        .filter(item => item.promotionId)
        .map(item => ({
          productId: item.promotionId,
          promotionName: item.promotionName || 'โปรโมชั่น',
          discountedPrice: item.price
        })),
      orderDate: new Date()
    };
  }
}

export default StripeService;
