// ฟังก์ชันสำหรับแปลง ID เป็นเลขลำดับ
export const formatOrderId = (id) => {
    // ใช้ 6 ตัวแรกของ ID เพื่อสร้างเลขลำดับ
    const hex = id.substring(0, 6);
    // แปลงจาก hex เป็น decimal
    const decimal = parseInt(hex, 16);
    // เพิ่มเลข 0 ข้างหน้าจนครบ 3 หลัก
    return decimal.toString().padStart(3, '0');
};

// ฟังก์ชันสำหรับสร้างเลขที่คำสั่งซื้อ
export const generateOrderNumber = (orderId) => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sequence = formatOrderId(orderId);

    return `ORD${year}${month}${day}${sequence}`;
};

// ฟังก์ชันสำหรับสร้างเลขที่คำสั่งซื้อแบบชั่วคราว
export const generateTemporaryOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    return `TEMP${year}${month}${day}${random}`;
}; 