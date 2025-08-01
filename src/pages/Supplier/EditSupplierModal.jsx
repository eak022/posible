import React, { useState, useEffect } from 'react';
import supplierService from "../../services/supplier.service";  // import service
import Swal from 'sweetalert2';  // Import Swal

const EditSupplierModal = ({ supplierId, isOpen, onClose, updateSupplier }) => {
    const [supplierData, setSupplierData] = useState({
        companyName: '',
        sellerName: '',
        phoneNumber: '',
        address: '',
    });

    // ดึงข้อมูลซัพพลายเออร์จาก API
    const fetchSupplierData = async () => {
        try {
            const data = await supplierService.getSupplierById(supplierId);
            setSupplierData({
                companyName: data.companyName,
                sellerName: data.sellerName,
                phoneNumber: data.phoneNumber,
                address: data.address,
            });
        } catch (error) {
            console.error("Failed to fetch supplier data", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSupplierData({ ...supplierData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // เรียกใช้ฟังก์ชัน updateSupplier จาก props
            await updateSupplier(supplierId, supplierData);
            Swal.fire({
                title: 'แก้ไขซัพพลายเออร์สำเร็จ',
                icon: 'success',
                confirmButtonText: 'ยืนยัน',
            });
            onClose(); // Close modal after successful update
        } catch (error) {
            console.error('Failed to update supplier', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด!',
                text: 'ไม่สามารถอัปเดตข้อมูลซัพพลายเออร์ได้',
                icon: 'error',
                confirmButtonText: 'ลองใหม่',
            });
        }
    };

    useEffect(() => {
        if (isOpen && supplierId) {
            fetchSupplierData(); // Fetch supplier data when modal opens
        }
    }, [isOpen, supplierId]);

    return isOpen ? (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
            <div className="bg-white p-6 rounded-md shadow-md w-96">
                <h2 className="text-2xl font-bold mb-4">แก้ไขข้อมูลซัพพลายเออร์</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">ชื่อซัพพลายเออร์</label>
                        <input
                            id="edit-supplier-name-input" //เพิ่ม id
                            type="text"
                            name="companyName"
                            value={supplierData.companyName}
                            onChange={handleInputChange}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="sellerName" className="block text-sm font-medium text-gray-700">ชื่อผู้ติดต่อ</label>
                        <input
                            id="edit-supplier-contact-input" //เพิ่ม id
                            type="text"
                            name="sellerName"
                            value={supplierData.sellerName}
                            onChange={handleInputChange}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                        <input 
                            id="edit-supplier-phone-input" //เพิ่ม id
                            type="text"
                            name="phoneNumber"
                            value={supplierData.phoneNumber}
                            onChange={handleInputChange}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                        <input 
                            id="edit-supplier-address-input" //เพิ่ม id
                            type="text"
                            name="address"
                            value={supplierData.address}
                            onChange={handleInputChange}
                            className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                            required
                        />
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                        <button 
                            id="edit-supplier-cancel-button" //เพิ่ม id
                            type="button"
                            onClick={onClose}
                            className="p-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition"
                        >
                            ยกเลิก
                        </button>
                        <button
                            id="edit-supplier-submit-button" //เพิ่ม id
                            type="submit"
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                        >
                           บันทึกข้อมูล
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;
};

export default EditSupplierModal;
