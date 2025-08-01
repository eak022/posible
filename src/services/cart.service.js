import api from './api';


const cartService = {
    // เพิ่มสินค้าลงตะกร้าด้วยบาร์โค้ด
    addItemWithBarcode: async (barcode) => {
        try {
            // ตรวจสอบว่า barcode เป็นของ pack หรือ unit
            const productResponse = await api.get(`/product/barcode/${barcode}`);
            const product = productResponse.data;

            // ตรวจสอบว่าเป็นบาร์โค้ดแพ็คหรือชิ้น
            const isPack = product.barcodePack === barcode;
            const isUnit = product.barcodeUnit === barcode;

            if (!isPack && !isUnit) {
                throw new Error('ไม่พบบาร์โค้ดนี้ในระบบ');
            }

            const requestBody = {
                barcode,
                quantity: 1,
                userName: "admin",
                pack: isPack
            };

            const response = await api.post("/cart/add-with-barcode", requestBody);

            return response.data;
        } catch (error) {
            console.error("Error adding item with barcode:", error);
            throw error;
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
    addItemFromCard: async (productId, userName) => {
        try {
            const response = await api.post("/cart", {
                productId,
                quantity: 1,
                userName,
                pack: false
            });
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
                sellingPricePerUnit: item.pack ? item.price / item.quantity : item.price,
                sellingPricePerPack: item.pack ? item.price : item.price * item.quantity,
                quantity: item.quantity,
                pack: item.pack || false
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