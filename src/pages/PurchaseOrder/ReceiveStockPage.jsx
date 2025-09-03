import { useState, useEffect, useContext } from 'react';
import purchaseOrderService from '../../services/purchaseOrder.service';
import supplierService from '../../services/supplier.service';
import productService from '../../services/product.service';
import { FaArrowLeft, FaTruck, FaCheckDouble } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import PurchaseOrderList from '../../components/PurchaseOrder/PurchaseOrderList';
import PurchaseOrderDetail from '../../components/PurchaseOrder/PurchaseOrderDetail';
import ReceiptDetail from '../../components/PurchaseOrder/ReceiptDetail';
import { usePurchaseOrder } from "../../context/PurchaseOrderContext";
import { ProductContext } from "../../context/ProductContext";

const ReceiveStockPage = () => {
    const { purchaseOrders, setPurchaseOrders } = usePurchaseOrder();
    const { updateProduct } = useContext(ProductContext);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedReceiptId, setSelectedReceiptId] = useState(null);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);
    const [filter, setFilter] = useState('pending'); // 'pending', 'delivered', 'completed', 'all'

    useEffect(() => {
        fetchPurchaseOrders();
    }, []);

    const fetchPurchaseOrders = async () => {
        try {
            const response = await purchaseOrderService.getAllPurchaseOrders();
            const orders = Array.isArray(response) ? response : response.purchaseOrders || [];
            
            // ดึงข้อมูลซัพพลายเออร์สำหรับทุกใบสั่งของ
            const ordersWithSupplier = await Promise.all(
                orders.map(async (order) => {
                    if (order.supplierId) {
                        try {
                            // ตรวจสอบว่า supplierId เป็น object หรือ string
                            const supplierId = typeof order.supplierId === 'object' 
                                ? order.supplierId._id 
                                : order.supplierId;
                            
                            const supplierData = await supplierService.getSupplierById(supplierId);
                            return {
                                ...order,
                                supplierId: supplierData
                            };
                        } catch (error) {
                            console.error(`Error fetching supplier for order ${order._id}:`, error);
                            return order;
                        }
                    }
                    return order;
                })
            );

            setPurchaseOrders(ordersWithSupplier);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            Swal.fire({ icon: 'error', title: 'ไม่สามารถโหลดข้อมูลใบสั่งของได้' });
            setPurchaseOrders([]);
            setLoading(false);
        }
    };



    const handleUpdateDeliveryInfo = async (id) => {
        try {
            // ดึงข้อมูลใบสั่งซื้อปัจจุบัน
            const currentOrder = purchaseOrders.find(order => order._id === id);
            if (!currentOrder) {
                Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อมูลใบสั่งซื้อ', 'error');
                return;
            }

            // ตรวจสอบสถานะใบสั่งซื้อ
            const isCompleted = currentOrder.status === 'completed';
            const modalTitle = isCompleted ? 'แก้ไขข้อมูลการรับสินค้า' : 'อัพเดทข้อมูลการส่งมอบและรับสินค้า';
            const confirmButtonText = isCompleted ? 'บันทึกการแก้ไข' : 'อัพเดตและรับสินค้า';

            // สร้างฟอร์มสำหรับอัพเดทข้อมูลการส่งมอบ
            const { value: formValues } = await Swal.fire({
                title: modalTitle,
                html: `
                    <div class="text-left max-h-[70vh] overflow-y-auto">
                        <p class="mb-4 text-sm text-gray-600">กรอกข้อมูลการส่งมอบจริงสำหรับแต่ละสินค้า:</p>
                        <div class="space-y-4">
                            ${currentOrder.products.map((product, index) => `
                                <div class="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div class="flex items-center justify-between mb-2">
                                        <h3 class="font-medium text-gray-800">${product.productName}</h3>
                                    </div>
                                    <div class="grid grid-cols-12 gap-4">
                                        <div class="col-span-3">
                                            <label class="block text-sm text-black mb-1">จำนวนที่ส่งมอบ</label>
                                            <div class="flex items-center gap-2">
                                                <div class="flex items-center bg-gray-50 rounded-lg border border-gray-300">
                                                    <button type="button" id="minus-btn-${index}" class="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">-</button>
                                                    <input id="delivered-${index}" type="number" min="0" max="${product.orderedQuantity}" 
                                                           value="${product.deliveredQuantity || 0}" 
                                                           class="w-12 text-center text-sm bg-transparent border-none focus:outline-none focus:ring-0">
                                                    <button type="button" id="plus-btn-${index}" class="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">+</button>
                                                </div>
                                                <div class="flex items-center gap-4">
                                                    <span class="text-xs text-gray-600 whitespace-nowrap">ชิ้น</span>
                                                    <button type="button" id="pack-toggle-${index}" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${product.pack ? 'bg-green-500' : 'bg-gray-300'}">
                                                        <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.pack ? 'translate-x-6' : 'translate-x-1'}"></span>
                                                    </button>
                                                    <span class="text-xs text-gray-600 whitespace-nowrap">แพ็ค</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-span-3 ml-4">
                                            <label class="block text-sm text-black mb-1 ">ราคาจริง/หน่วย</label>
                                            <input id="actual-price-${index}" type="number" min="0" step="0.01" 
                                                   value="${product.actualPrice || product.estimatedPrice || 0}" 
                                                   class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <p class="text-xs text-gray-500 mt-1">
                                                ${product.pack ? 'ราคาต่อแพ็ค' : 'ราคาต่อชิ้น'}
                                            </p>
                                        </div>
                                        <div class="col-span-3">
                                            <label class="block text-sm text-black mb-1">วันที่ส่งมอบ</label>
                                            <input id="delivery-date-${index}" type="date" 
                                                   value="${new Date().toISOString().split('T')[0]}" 
                                                   class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        </div>
                                        <div class="col-span-3">
                                            <label class="block text-sm text-black mb-1">วันหมดอายุ <span class="text-gray-500">(ไม่บังคับ)</span></label>
                                            <input id="expiration-date-${index}" type="date" 
                                                   value="${product.expirationDate ? new Date(product.expirationDate).toISOString().split('T')[0] : ''}" 
                                                   class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <p class="text-xs text-gray-500 mt-1">💡 ถ้าไม่กรอก จะแสดงเป็น "ไม่มีวันหมดอายุ"</p>
                                        </div>
                                        <div class="col-span-12">
                                            <div class="text-right font-medium text-black">
                                                สั่งซื้อ: ${product.orderedQuantity} ${product.pack ? 'แพ็ค' : 'ชิ้น'} | ส่งมอบ: <span id="delivered-display-${index}">${product.deliveredQuantity || 0}</span> <span id="unit-display-${index}">${product.pack ? 'แพ็ค' : 'ชิ้น'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: confirmButtonText,
                cancelButtonText: 'ยกเลิก',
                width: '900px',
                didOpen: () => {
                    // เพิ่ม event listeners หลังจาก SweetAlert2 เปิด
                    currentOrder.products.forEach((product, index) => {
                        const minusBtn = document.getElementById(`minus-btn-${index}`);
                        const plusBtn = document.getElementById(`plus-btn-${index}`);
                        const input = document.getElementById(`delivered-${index}`);
                        const packToggle = document.getElementById(`pack-toggle-${index}`);
                        const unitDisplay = document.getElementById(`unit-display-${index}`);

                        // ปุ่มลบ
                        minusBtn.addEventListener('click', () => {
                            const currentValue = parseInt(input.value) || 0;
                            const newValue = Math.max(0, currentValue - 1);
                            input.value = newValue;
                            // อัปเดตการแสดงผล
                            document.getElementById(`delivered-display-${index}`).textContent = newValue;
                        });

                        // ปุ่มบวก
                        plusBtn.addEventListener('click', () => {
                            const currentValue = parseInt(input.value) || 0;
                            const maxValue = parseInt(input.getAttribute('max')) || 0;
                            const newValue = Math.min(currentValue + 1, maxValue);
                            input.value = newValue;
                            // อัปเดตการแสดงผล
                            document.getElementById(`delivered-display-${index}`).textContent = newValue;
                        });

                        // อัปเดตการแสดงผลเมื่อพิมพ์ค่าโดยตรง
                        input.addEventListener('input', () => {
                            const value = parseInt(input.value) || 0;
                            document.getElementById(`delivered-display-${index}`).textContent = value;
                        });

                        // ท็อกเกิลแพ็ค
                        packToggle.addEventListener('click', () => {
                            const isPack = packToggle.classList.contains('bg-green-500');
                            const actualPriceInput = document.getElementById(`actual-price-${index}`);
                            const currentPrice = parseFloat(actualPriceInput.value) || 0;
                            const priceLabel = actualPriceInput.parentElement.querySelector('p');
                            
                            if (isPack) {
                                // เปลี่ยนจากแพ็คเป็นชิ้น
                                packToggle.classList.remove('bg-green-500');
                                packToggle.classList.add('bg-gray-300');
                                packToggle.querySelector('span').classList.remove('translate-x-6');
                                packToggle.querySelector('span').classList.add('translate-x-1');
                                unitDisplay.textContent = 'ชิ้น';
                                
                                // คำนวณราคาต่อชิ้น (หารด้วย packSize)
                                const packSize = product.packSize || 1;
                                const pricePerUnit = currentPrice / packSize;
                                actualPriceInput.value = pricePerUnit.toFixed(2);
                                
                                // อัปเดตข้อความราคา
                                if (priceLabel) {
                                    priceLabel.textContent = 'ราคาต่อชิ้น';
                                }
                            } else {
                                // เปลี่ยนจากชิ้นเป็นแพ็ค
                                packToggle.classList.remove('bg-gray-300');
                                packToggle.classList.add('bg-green-500');
                                packToggle.querySelector('span').classList.remove('translate-x-1');
                                packToggle.querySelector('span').classList.add('translate-x-6');
                                unitDisplay.textContent = 'แพ็ค';
                                
                                // คำนวณราคาต่อแพ็ค (คูณด้วย packSize)
                                const packSize = product.packSize || 1;
                                const pricePerPack = currentPrice * packSize;
                                actualPriceInput.value = pricePerPack.toFixed(2);
                                
                                // อัปเดตข้อความราคา
                                if (priceLabel) {
                                    priceLabel.textContent = 'ราคาต่อแพ็ค';
                                }
                            }
                        });
                    });
                },
                preConfirm: () => {
                    const updatedProducts = currentOrder.products.map((product, index) => {
                        const deliveredInput = document.getElementById(`delivered-${index}`);
                        const actualPriceInput = document.getElementById(`actual-price-${index}`);
                        const deliveryDateInput = document.getElementById(`delivery-date-${index}`);
                        const expirationDateInput = document.getElementById(`expiration-date-${index}`);
                        const packToggle = document.getElementById(`pack-toggle-${index}`);
                        
                        return {
                            productId: product.productId,
                            productName: product.productName,
                            orderedQuantity: product.orderedQuantity,
                            estimatedPrice: product.estimatedPrice,
                            deliveredQuantity: parseInt(deliveredInput.value) || 0,
                            actualPrice: parseFloat(actualPriceInput.value) || 0,
                            deliveryDate: deliveryDateInput.value || null,
                            expirationDate: expirationDateInput.value || null,
                            sellingPricePerUnit: product.sellingPricePerUnit,
                            subtotal: product.subtotal,
                            pack: packToggle.classList.contains('bg-green-500'),
                            packSize: product.packSize
                        };
                    });

                    return {
                        supplierId: currentOrder.supplierId._id || currentOrder.supplierId,
                        purchaseOrderDate: currentOrder.purchaseOrderDate,
                        products: updatedProducts
                    };
                }
            });

            if (formValues) {
                console.log('Sending update data:', formValues);
                
                let updatedOrder;
                if (isCompleted) {
                    // ถ้าเป็นใบสั่งซื้อที่เสร็จแล้ว ให้ลบล็อตเดิมและสร้างใหม่
                    updatedOrder = await purchaseOrderService.updatePurchaseOrderAndRecreateLots(id, formValues);
                    await Swal.fire('สำเร็จ', 'แก้ไขข้อมูลการรับสินค้าเรียบร้อยแล้ว', 'success');
                } else {
                    // ถ้าเป็นใบสั่งซื้อใหม่ ให้อัพเดตและรับสินค้า
                    let stockResponse = null;
                    let updateSuccess = false;
                    
                    try {
                        // ✅ อัพเดตข้อมูลการส่งมอบ
                        updatedOrder = await purchaseOrderService.updatePurchaseOrder(id, formValues);
                        updateSuccess = true;
                        console.log('Update purchase order successful');
                    } catch (updateError) {
                        console.error('Error updating purchase order:', updateError);
                        await Swal.fire('ข้อผิดพลาด', 'ไม่สามารถอัพเดทข้อมูลการส่งมอบได้: ' + (updateError.response?.data?.message || updateError.message), 'error');
                        return; // หยุดการทำงานต่อ
                    }
                    
                    try {
                        // ✅ รับสินค้า
                        stockResponse = await purchaseOrderService.receiveStock(id);
                        
                        // ✅ ตรวจสอบว่า stockResponse มี error หรือไม่
                        if (stockResponse && !stockResponse.error) {
                            await Swal.fire('สำเร็จ', 'อัพเดตข้อมูลการส่งมอบและรับสินค้าเรียบร้อยแล้ว', 'success');
                        } else {
                            // ถ้ามี error ให้แสดง error message
                            await Swal.fire('ข้อผิดพลาด', stockResponse?.message || 'ไม่สามารถรับสินค้าได้', 'error');
                            return; // หยุดการทำงานต่อ
                        }
                    } catch (stockError) {
                        console.error('Error in stock receiving process:', stockError);
                        await Swal.fire('ข้อผิดพลาด', 'ไม่สามารถรับสินค้าได้: ' + (stockError.response?.data?.message || stockError.message), 'error');
                        return; // หยุดการทำงานต่อ
                    }
                    
                    // ✅ อัพเดท ProductContext เมื่อรับสต็อกสำเร็จ
                    if (stockResponse && stockResponse.addedProducts) {
                        console.log('Stock received, updating ProductContext:', stockResponse.addedProducts);
                        
                        // ✅ ดึงข้อมูลสินค้าล่าสุดจาก API และอัพเดท ProductContext
                        for (const addedProduct of stockResponse.addedProducts) {
                            try {
                                // หา productId จากชื่อสินค้า
                                const product = purchaseOrders.find(po => 
                                    po.products.some(p => p.productName === addedProduct.productName)
                                );
                                
                                if (product) {
                                    const productItem = product.products.find(p => p.productName === addedProduct.productName);
                                    if (productItem) {
                                        const productId = productItem.productId._id || productItem.productId;
                                        
                                        // ✅ ดึงข้อมูลสินค้าล่าสุดจาก API
                                        const latestProduct = await productService.getProductById(productId);
                                        
                                        // ✅ อัพเดท ProductContext ด้วยข้อมูลล่าสุด
                                        updateProduct(productId, {
                                            quantity: latestProduct.totalQuantity || latestProduct.quantity,
                                            totalQuantity: latestProduct.totalQuantity || latestProduct.quantity,
                                            lots: latestProduct.lots
                                        });
                                        
                                        console.log(`Updated product ${addedProduct.productName} to ${latestProduct.totalQuantity || latestProduct.quantity}`);
                                    }
                                }
                            } catch (error) {
                                console.error(`Error updating product ${addedProduct.productName}:`, error);
                            }
                        }
                    }
                }
                
                // ✅ อัพเดท PurchaseOrderContext แทนการเรียก fetchPurchaseOrders
                if (updatedOrder) {
                    // อัพเดท purchaseOrders ใน state โดยตรง
                    setPurchaseOrders(prevOrders => 
                        prevOrders.map(order => 
                            order._id === id ? { ...order, ...updatedOrder } : order
                        )
                    );
                } else {
                    fetchPurchaseOrders();
                }
            }
        } catch (error) {
            console.error('Error updating delivery info:', error);
            // ✅ ตรวจสอบว่า error นี้ไม่ได้มาจาก update หรือ stock receiving process
            if (!error.message?.includes('stock receiving process') && 
                !error.message?.includes('updating purchase order')) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถอัพเดทข้อมูลการส่งมอบได้', 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            const result = await Swal.fire({
                title: 'ยืนยันการลบ',
                text: 'คุณต้องการลบใบสั่งของนี้ใช่หรือไม่?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'ลบ',
                cancelButtonText: 'ยกเลิก'
            });

            if (result.isConfirmed) {
                await purchaseOrderService.deletePurchaseOrder(id);
                await Swal.fire('สำเร็จ', 'ลบใบสั่งของเรียบร้อยแล้ว', 'success');
                fetchPurchaseOrders();
            }
        } catch (error) {
            console.error('Error deleting purchase order:', error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบใบสั่งของได้', 'error');
        }
    };

    const handleViewOrder = (id) => {
        setSelectedOrderId(id);
    };

    const handleViewReceipt = (id) => {
        setSelectedReceiptId(id);
    };

    const handleCloseOrderModal = () => {
        setSelectedOrderId(null);
    };

    const handleCloseReceiptModal = () => {
        setSelectedReceiptId(null);
    };

    // กรองข้อมูลตามสถานะ
    const getFilteredOrders = () => {
        let filtered = purchaseOrders;
        
        switch (filter) {
            case 'pending':
                filtered = purchaseOrders.filter(order => order.status === 'pending');
                break;
            case 'delivered':
                filtered = purchaseOrders.filter(order => order.status === 'delivered');
                break;
            case 'completed':
                filtered = purchaseOrders.filter(order => order.status === 'completed');
                break;
            default:
                filtered = purchaseOrders;
        }

        // กรองตามคำค้นหา
        return filtered.filter(order => 
            order?.supplierId?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order?.supplierId?.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order?.orderNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    const filteredPurchaseOrders = getFilteredOrders();

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPurchaseOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPurchaseOrders.length / itemsPerPage);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl text-black">กำลังโหลด...</div>
            </div>
        );
    }

    return (
        <div className="p-6 text-black">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-black">รับสินค้า</h1>
                        <p className="text-gray-500 mt-1">จัดการการรับสินค้าจากใบสั่งซื้อ</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="search-filter-container">
                            <input
                                type="text"
                                placeholder="ค้นหาตามเลขใบสั่งของ หรือ ชื่อซัพพลายเออร์"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input w-80 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/purchase-orders')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-500 focus:outline-none"
                        >
                            <FaArrowLeft />
                            กลับไปใบสั่งซื้อ
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                    <div className="flex space-x-4 border-b">
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                filter === 'pending'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            รอรับสินค้า ({purchaseOrders.filter(order => order.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setFilter('delivered')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                filter === 'delivered'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            ส่งมอบแล้ว ({purchaseOrders.filter(order => order.status === 'delivered').length})
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                filter === 'completed'
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            เสร็จสิ้น ({purchaseOrders.filter(order => order.status === 'completed').length})
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                                filter === 'all'
                                    ? 'border-gray-500 text-gray-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            ทั้งหมด ({purchaseOrders.length})
                        </button>
                    </div>
                </div>



                {/* Purchase Orders Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="grid grid-cols-5 gap-4 p-4 bg-purple-500 text-white font-semibold items-center">
                        <div>เลขใบสั่งของ</div>
                        <div>ซัพพลายเออร์</div>
                        <div>จำนวนรายการสินค้า</div>
                        <div>สถานะการส่งมอบ</div>
                        <div className="text-center">จัดการ</div>
                    </div>

                    {currentItems.map((order, index) => (
                        <PurchaseOrderList
                            key={order._id}
                            order={order}
                            index={index}
                            onUpdateDelivery={handleUpdateDeliveryInfo}
                            onViewOrder={handleViewOrder}
                            onViewReceipt={handleViewReceipt}
                            onDelete={handleDelete}
                            isReceivePage={true}
                        />
                    ))}

                    {filteredPurchaseOrders.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            ไม่พบรายการใบสั่งของ
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-end items-center gap-2 p-4">
                        <button
                            className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            ก่อนหน้า
                        </button>
                        <span className="text-sm text-gray-700">
                            หน้า {currentPage} / {totalPages}
                        </span>
                        <button
                            className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            ถัดไป
                        </button>
                    </div>
                )}
            </div>

            {/* Modal ใบสั่งซื้อ */}
            {selectedOrderId && (
                <PurchaseOrderDetail
                    id={selectedOrderId}
                    onClose={handleCloseOrderModal}
                    isReceivePage={true}
                />
            )}

            {/* Modal ใบรับสินค้า */}
            {selectedReceiptId && (
                <ReceiptDetail
                    id={selectedReceiptId}
                    onClose={handleCloseReceiptModal}
                />
            )}
        </div>
    );
};

export default ReceiveStockPage; 