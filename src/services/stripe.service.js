import api from './api';

class StripeService {
  // สร้างการชำระเงินใหม่ (Payment Link)
  static async createPaymentIntent(paymentData) {
    try {
      const response = await api.post('/stripe/create-payment-intent', paymentData);
      return response.data;
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  // ตรวจสอบสถานะการชำระเงินจาก Payment Link
  static async checkPaymentStatus(paymentLinkId) {
    try {
      const response = await api.get(`/stripe/payment-status/${paymentLinkId}`);
      return response.data;
    } catch (error) {
      console.error('Check payment status error:', error);
      throw error;
    }
  }

  // ยกเลิกการชำระเงิน
  static async cancelPayment(paymentLinkId) {
    try {
      const response = await api.post(`/stripe/cancel-payment/${paymentLinkId}`, {});
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
      image: item.productImage,
      productName: item.productName,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice || 0,
      sellingPricePerUnit: item.price,
      pack: item.pack || false,
      packSize: item.packSize,
      lotsUsed: item.lotsUsed || [],
      originalPrice: item.originalPrice || item.price,
      discountAmount: item.discountAmount || 0
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
