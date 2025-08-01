import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes, FaClipboardList, FaTags, FaExclamationTriangle } from 'react-icons/fa';
import notificationService from '../services/notification.service';
import { useNavigate } from 'react-router-dom';
import CreatePromotionModal from '../pages/Promotion/CreatePromotionModal';
import orderService from '../services/order.service';
import useAuthStore from '../store/useAuthStore';
import Swal from 'sweetalert2';

const NotificationModal = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState({
        lowStock: [],
        expiring: [],
        expired: []
    });
    const [notificationCounts, setNotificationCounts] = useState({
        total: 0,
        lowStock: 0,
        expiring: 0,
        expired: 0
    });
    const [filter, setFilter] = useState('all'); // 'all', 'lowStock', 'expiring', 'expired'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (isOpen) {
            console.log('Modal is open, fetching notifications...');
            fetchNotifications();

            // ตั้งเวลาอัพเดทข้อมูลทุกๆ 30 วินาที
            const intervalId = setInterval(fetchNotifications, 30000);

            // Cleanup function
            return () => clearInterval(intervalId);
        }
    }, [isOpen]); // ดึงข้อมูลเมื่อ modal เปิด

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await notificationService.getAllNotifications();
            console.log('Notification API response:', response);
            if (response.success) {
                setNotifications(response.notifications);
                setNotificationCounts(response.counts);
                console.log('Notifications state updated:', response.notifications);
                console.log('Notification counts state updated:', response.counts);
            } else {
                setError('ไม่สามารถดึงข้อมูลการแจ้งเตือนได้');
                console.error('API response success is false:', response);
            }
        } catch (error) {
            setError('เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน');
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationIconClick = useCallback(async (notification) => {
        if (notification.status === 'สินค้าใกล้หมด' || notification.status === 'สินค้าหมด') {
            onClose();
            navigate('/purchase-orders');
        } else if (notification.status === 'สินค้าใกล้หมดอายุ') {
            setSelectedProduct(notification);
            setIsPromotionModalOpen(true);
        } else if (notification.status === 'หมดอายุ') {
            // แสดง Swal ถามยืนยัน
            const result = await Swal.fire({
                title: 'สินค้าหมดอายุแล้ว',
                text: 'ต้องการนำออกจากระบบหรือไม่? (จะสร้างออเดอร์ตัดจำหน่ายสินค้า)',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'ตกลง',
                cancelButtonText: 'ยกเลิก',
            });
            if (result.isConfirmed) {
                try {
                    if (!user || !user.username) {
                        Swal.fire('เกิดข้อผิดพลาด', 'กรุณาเข้าสู่ระบบใหม่', 'error');
                        return;
                    }
                    // ดึงจำนวนล่าสุดจาก notification หรือดึงใหม่จาก backend ถ้า notification ไม่มี quantity
                    let quantity = notification.quantity;
                    if (typeof quantity !== 'number') {
                        // fallback: ดึงจาก backend (product service)
                        try {
                            const product = await import('../services/product.service').then(m => m.default.getProductById(notification.productId));
                            quantity = product.quantity;
                        } catch (e) {
                            quantity = 1;
                        }
                    }
                    if (!quantity || quantity <= 0) {
                        Swal.fire('เกิดข้อผิดพลาด', 'ไม่พบจำนวนสินค้าคงเหลือ', 'error');
                        return;
                    }
                    const disposeData = {
                        userName: user.username,
                        orderStatus: 'ตัดจำหน่าย',
                        paymentMethod: 'ตัดจำหน่าย',
                        subtotal: 0,
                        total: 0,
                        products: [
                            {
                                productId: notification.productId,
                                productName: notification.productName,
                                quantity: quantity,
                                purchasePrice: 0,
                                sellingPricePerUnit: 0,
                                pack: false,
                                originalPrice: 0,
                                discountAmount: 0,
                                image: notification.productImage || '',
                            }
                        ]
                    };
                    await orderService.createDisposeOrder(disposeData);
                    Swal.fire('สำเร็จ', 'สร้างออเดอร์ตัดจำหน่ายสินค้าเรียบร้อย', 'success');
                    onClose();
                } catch (err) {
                    Swal.fire('เกิดข้อผิดพลาด', err?.message || 'ไม่สามารถสร้างออเดอร์ตัดจำหน่ายสินค้าได้', 'error');
                }
            }
        }
    }, [onClose, navigate, user]);

    const handlePromotionModalClose = () => {
        setIsPromotionModalOpen(false);
        setSelectedProduct(null);
    };

    const getNotificationIcon = (status) => {
        switch (status) {
            case 'สินค้าใกล้หมด':
            case 'สินค้าหมด':
                return <FaClipboardList className="text-yellow-500" />;
            case 'สินค้าใกล้หมดอายุ':
                return <FaTags className="text-orange-500" />;
            case 'หมดอายุ':
                return <FaExclamationTriangle className="text-red-500" />;
            default:
                return <FaClipboardList className="text-gray-500" />;
        }
    };

    const getFilteredNotifications = () => {
        switch (filter) {
            case 'lowStock':
                return notifications.lowStock;
            case 'expiring':
                return notifications.expiring;
            case 'expired':
                return notifications.expired;
            default:
                return [...notifications.lowStock, ...notifications.expiring, ...notifications.expired];
        }
    };

    const filteredNotifications = getFilteredNotifications();

    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={onClose}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                                            การแจ้งเตือน
                                        </Dialog.Title>
                                        <button 
                                            id="notification-modal-close-button"
                                            onClick={onClose} 
                                            className="text-gray-600 hover:text-gray-900"
                                            aria-label="ปิดการแจ้งเตือน"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>

                                    <div className="flex border-b mb-4">
                                        <button
                                            id="notification-filter-all-button"
                                            className={`px-4 py-2 text-sm ${filter === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                                            onClick={() => setFilter('all')}
                                            aria-label="แสดงการแจ้งเตือนทั้งหมด"
                                        >
                                            ทั้งหมด ({notificationCounts.total})
                                        </button>
                                        <button
                                            id="notification-filter-expired-button"
                                            className={`px-4 py-2 text-sm ${filter === 'expired' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-600'}`}
                                            onClick={() => setFilter('expired')}
                                            aria-label="แสดงการแจ้งเตือนสินค้าหมดอายุ"
                                        >
                                            หมดอายุ ({notificationCounts.expired})
                                        </button>
                                        <button
                                            id="notification-filter-expiring-button"
                                            className={`px-4 py-2 text-sm ${filter === 'expiring' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-600'}`}
                                            onClick={() => setFilter('expiring')}
                                            aria-label="แสดงการแจ้งเตือนสินค้าใกล้หมดอายุ"
                                        >
                                            ใกล้หมดอายุ ({notificationCounts.expiring})
                                        </button>
                                        <button
                                            id="notification-filter-lowstock-button"
                                            className={`px-4 py-2 text-sm ${filter === 'lowStock' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-gray-600'}`}
                                            onClick={() => setFilter('lowStock')}
                                            aria-label="แสดงการแจ้งเตือนสินค้าใกล้หมดสต็อก"
                                        >
                                            ใกล้หมดสต็อก ({notificationCounts.lowStock})
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="text-center">กำลังโหลดการแจ้งเตือน...</div>
                                    ) : error ? (
                                        <div className="text-center text-red-500">{error}</div>
                                    ) : (
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {filteredNotifications.length > 0 ? (
                                                filteredNotifications.map((notification, index) => (
                                                    <div key={index} className="flex items-center p-3 border rounded-md shadow-sm">
                                                        <div className="flex-shrink-0 mr-3 w-12 h-12">
                                                            <img
                                                                src={notification.productImage || '/placeholder.png'}
                                                                alt={notification.productName}
                                                                className="w-full h-full object-cover rounded"
                                                            />
                                                        </div>
                                                        <div className="flex-grow">
                                                            <h4 className="font-medium text-gray-900">{notification.productName}</h4>
                                                            <p className="text-sm text-gray-500">
                                                                {notification.status === 'สินค้าใกล้หมด' && `จำนวนคงเหลือ: ${notification.quantity} ชิ้น`}
                                                                {notification.status === 'สินค้าใกล้หมดอายุ' && `หมดอายุในวันที่: ${new Date(notification.expirationDate).toLocaleDateString('th-TH')}`}
                                                                {notification.status === 'หมดอายุ' && `หมดอายุแล้วเมื่อวันที่: ${new Date(notification.expirationDate).toLocaleDateString('th-TH')}`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            id={`notification-action-button-${index}`}
                                                            onClick={() => handleNotificationIconClick(notification)}
                                                            className="ml-3 p-2 rounded-full hover:bg-gray-100"
                                                        >
                                                            {getNotificationIcon(notification.status)}
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-gray-500">ไม่มีการแจ้งเตือน</p>
                                            )}
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            <CreatePromotionModal 
                isOpen={isPromotionModalOpen} 
                onClose={handlePromotionModalClose}
                initialProduct={selectedProduct}
            />
        </>
    );
};

export default NotificationModal; 