import api from './api';


const cartService = {
    // เพิ่มสินค้าลงตะกร้าด้วยบาร์โค้ด
    addItemWithBarcode: async (barcode, userName) => {
        try {
            // เรียกตรงไปยัง backend ให้ตรวจทั้งโปรฯ และสินค้า ลด 404 noisy logs
            const effectiveUser = userName || localStorage.getItem('username') || 'admin';
            const response = await api.post("/cart/add-with-barcode", {
                barcode,
                quantity: 1,
                userName: effectiveUser
            });
            return response.data;
        } catch (error) {
            console.error("Error adding item with barcode:", error);
            throw new Error(error?.response?.data?.message || 'ไม่สามารถเพิ่มสินค้าด้วยบาร์โค้ดนี้ได้');
        }
    },

    // อัพเดทจำนวนสินค้าในตะกร้า
    updateQuantity: async (itemId, quantity) => {
        try {
            const response = await api.put(`/cart/${itemId}`, {
                quantity,
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'ไม่สามารถอัพเดทจำนวนสินค้าได้');
        }
    },

    // อัพเดทข้อมูลสินค้าในตะกร้า (เช่น เปลี่ยนจากแพ็คเป็นชิ้น)
    updateCartItem: async (itemId, { quantity, pack }) => {
        try {
            const requestData = {
                quantity,
                pack: Boolean(pack)
            };
            const response = await api.put(`/cart/${itemId}`, requestData);
            return response.data;
        } catch (error) {
            console.error('API Error:', error.response?.data || error);
            throw new Error(error.response?.data?.message || 'ไม่สามารถอัพเดทข้อมูลสินค้าได้');
        }
    },

    // ลบสินค้าออกจากตะกร้า
    removeItem: async (itemId) => {
        try {
            const response = await api.delete(`/cart/${itemId}`);
            return response.data;
        } catch (error) {
            console.error("API Error:", error.response?.data);
            throw new Error(error.response?.data?.message || 'ไม่สามารถลบสินค้าออกจากตะกร้าได้');
        }
    },

    // เพิ่มสินค้าลงตะกร้าจากการกด card
    addItemFromCard: async (productId, userName, { pack = false, barcode, promotionId } = {}) => {
        try {
            const body = {
                productId,
                quantity: 1,
                userName,
                pack: Boolean(pack),
                barcode,
                promotionId
            };
            const response = await api.post("/cart", body);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้');
        }
    },

    // ดึงข้อมูลตะกร้าทั้งหมด
    getAllCarts: async () => {
        try {
            const response = await api.get("/cart");
            return response.data.map(item => ({
                _id: item.productId,
                cartItemId: item._id,
                productName: item.name,
                productImage: item.image,
                // ใช้ราคาเดี่ยวจาก backend ตามบรรทัด (pack/unit/promo)
                sellingPricePerUnit: !item.pack ? item.price : undefined,
                sellingPricePerPack: item.pack ? item.price : undefined,
                price: item.price,
                quantity: item.quantity,
                pack: Boolean(item.pack),
                barcode: item.barcode,
                promotionId: item.promotionId || null,
                packSize: item.packSize || 1
            }));
        } catch (error) {
            throw new Error(error.response?.data?.message || "ไม่สามารถดึงข้อมูลตะกร้าได้");
        }
    },

    // ดึงข้อมูลตะกร้าตาม username
    getCartsByUsername: async (username) => {
        try {
            const response = await api.get(`/cart/${username}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "ไม่สามารถดึงข้อมูลตะกร้าได้");
        }
    }
};

export default cartService; 