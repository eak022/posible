import React, { useState, useEffect } from "react";
import { orderService } from "../../services";
import { generateOrderNumber } from "../../utils/orderUtils";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { th } from "date-fns/locale";
import { AiOutlineCalendar, AiOutlineCheck, AiOutlineDollar, AiOutlineClose, AiOutlineEdit, AiOutlinePrinter, AiOutlineMinus, AiOutlinePlus, AiOutlineSearch } from "react-icons/ai";
import { FiCreditCard } from "react-icons/fi";
import { FaMoneyBillWave, FaBox } from "react-icons/fa";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [paymentFilter, setPaymentFilter] = useState("ทั้งหมด");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [statusOptions, setStatusOptions] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateRange]);

  useEffect(() => {
    // กรองข้อมูลตามเงื่อนไขต่างๆ
    let result = orders;

    // กรองตามสถานะ
    if (statusFilter !== "ทั้งหมด") {
      result = result.filter(order => order.orderStatus === statusFilter);
    }

    // กรองตามวันที่
    if (startDate && endDate) {
      result = result.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // กรองตามวิธีการชำระเงิน
    if (paymentFilter !== "ทั้งหมด") {
      result = result.filter(order => order.paymentMethod === paymentFilter);
    }

    // กรองตามคำค้นหา
    if (searchTerm) {
      result = result.filter(order => 
        generateOrderNumber(order._id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(result);
    setCurrentPage(1); // reset page เมื่อ filter เปลี่ยน
  }, [orders, statusFilter, dateRange, paymentFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders();
      
      // ดึงสถานะและวิธีการชำระเงินที่ไม่ซ้ำกัน
      const uniqueStatuses = [...new Set(response.map(order => order.orderStatus))];
      const uniquePayments = [...new Set(response.map(order => order.paymentMethod))];
      
      setStatusOptions(uniqueStatuses);
      setPaymentOptions(uniquePayments);
      setOrders(response);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลคำสั่งซื้อได้",
        confirmButtonText: "ตกลง",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  
  // ฟังก์ชันกดคลิกสินค้า
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setEditingProduct(null);
  };

  const handleEditProduct = (product) => {
    //ตรวจสอบว่าสินค้ามี lot หรือไม่
    if (product.lotsUsed && product.lotsUsed.length > 0) {
      Swal.fire({
        icon: "info",
        title: "ข้อมูลสำคัญ",
        html: `
          <div class="text-left">
            <p class="mb-3"><strong>สินค้านี้มีการใช้ล็อตแล้ว</strong></p>
            <p class="mb-2">• การแก้ไขจำนวนหรือราคาจะส่งผลต่อสต็อกสินค้า</p>
            <p class="mb-2">• ระบบจะจัดการสต็อกอัตโนมัติตามการเปลี่ยนแปลง</p>
            <p class="mb-2">• ข้อมูลล็อตจะถูกอัพเดทตามการแก้ไข</p>
            <p class="text-sm text-gray-600 mt-3">ต้องการดำเนินการต่อหรือไม่?</p>
          </div>
        `,
        confirmButtonText: "ดำเนินการต่อ",
        cancelButtonText: "ยกเลิก",
        showCancelButton: true
      }).then((result) => {
        if (result.isConfirmed) {
          setEditingProduct(product);
        }
      });
    } else {
      Swal.fire({
        icon: "info",
        title: "แก้ไขสินค้า",
        text: "คุณสามารถแก้ไขจำนวนและราคาของสินค้าได้ การเปลี่ยนแปลงจะส่งผลต่อสต็อกสินค้าอัตโนมัติ",
        confirmButtonText: "เข้าใจแล้ว",
        showCancelButton: true,
        cancelButtonText: "ยกเลิก"
      }).then((result) => {
        if (result.isConfirmed) {
          setEditingProduct(product);
        }
      });
    }
  };

  const handleUpdateProduct = async (productId, updates) => {
    try {
      // หาข้อมูลสินค้าเดิมเพื่อดึงค่า pack
      const oldProduct = selectedOrder.products.find(p => p.productId === productId);
      if (!oldProduct) {
        throw new Error("ไม่พบสินค้าในคำสั่งซื้อ");
      }

      const response = await orderService.updateOrderDetail(selectedOrder._id, {
        productId,
        quantity: updates.quantity,
        sellingPricePerUnit: updates.sellingPricePerUnit,
        pack: oldProduct.pack // ใช้ค่า pack เดิม
      });

      if (response) {
        // อัปเดตข้อมูลในหน้าจอ
        const updatedOrders = orders.map((order) => {
          if (order._id === selectedOrder._id) {
            return {
              ...order,
              products: order.products.map((product) => {
                if (product.productId === productId) {
                  return { 
                    ...product, 
                    quantity: updates.quantity,
                    sellingPricePerUnit: updates.sellingPricePerUnit,
                    lotsUsed: response.order.products.find(p => p.productId === productId)?.lotsUsed || product.lotsUsed
                  };
                }
                return product;
              }),
              total: response.order.total,
              subtotal: response.order.subtotal
            };
          }
          return order;
        });
        setOrders(updatedOrders);
        setSelectedOrder(updatedOrders.find((order) => order._id === selectedOrder._id));
        setEditingProduct(null);

        // แสดงข้อความแจ้งเตือนสำเร็จพร้อมรายละเอียด
        let successMessage = "อัพเดทรายละเอียดสินค้าเรียบร้อยแล้ว";
        let stockMessage = "";
        
        if (response.quantityDiff > 0) {
          stockMessage = `\n\n📦 ตัดสต็อกเพิ่ม: ${response.quantityDiff} ${oldProduct.pack ? "แพ็ค" : "ชิ้น"}`;
        } else if (response.quantityDiff < 0) {
          stockMessage = `\n\n📦 คืนสต็อก: ${Math.abs(response.quantityDiff)} ${oldProduct.pack ? "แพ็ค" : "ชิ้น"}`;
        }

        Swal.fire({
          icon: "success",
          title: "แก้ไขสำเร็จ",
          text: successMessage + stockMessage,
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      console.error("Error updating product:", error);
      
      // แสดงข้อความ error ที่เฉพาะเจาะจงมากขึ้น
      let errorMessage = "ไม่สามารถแก้ไขรายละเอียดสินค้าได้";
      
      if (error.response?.data?.message) {
        if (error.response.data.message.includes("Not enough stock")) {
          errorMessage = "สต็อกสินค้าไม่เพียงพอสำหรับการแก้ไขนี้";
        } else if (error.response.data.message.includes("Cannot reduce quantity")) {
          errorMessage = "ไม่สามารถลดจำนวนสินค้าได้ เนื่องจากไม่มีประวัติการใช้ล็อต";
        } else if (error.response.data.message.includes("Failed to return stock")) {
          errorMessage = "ไม่สามารถคืนสต็อกได้ครบถ้วน";
        } else {
          errorMessage = error.response.data.message;
        }
      }
      
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorMessage,
        confirmButtonText: "ตกลง",
      });
    }
  };

  //ฟังก์ชันเปลี่ยนสถานะคำสั่งซื้อ
  const handleStatusChange = async (newStatus) => {
    try {
      // แสดงข้อความยืนยัน
      const result = await Swal.fire({
        title: "ยืนยันการเปลี่ยนสถานะ",
        text: `ต้องการเปลี่ยนสถานะเป็น "${newStatus}" หรือไม่?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
      });

      if (result.isConfirmed) {
        const response = await orderService.updateOrderStatus(selectedOrder._id, newStatus);
        
        if (response) {
          // อัปเดตข้อมูลในหน้าจอ
          const updatedOrders = orders.map((order) => {
            if (order._id === selectedOrder._id) {
              return { ...order, orderStatus: newStatus };
            }
            return order;
          });
          setOrders(updatedOrders);
          setSelectedOrder(updatedOrders.find((order) => order._id === selectedOrder._id));

          Swal.fire({
            icon: "success",
            title: "เปลี่ยนสถานะสำเร็จ",
            text: `อัปเดตสถานะเป็น "${newStatus}" เรียบร้อยแล้ว`,
            confirmButtonText: "ตกลง",
          });
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะได้",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // ฟังก์ชันสำหรับสร้างใบเสร็จและสั่งปริ้น
  const printReceipt = (order) => {
    // รวมส่วนลดจาก promotionId
    const totalDiscount = order.promotionId?.reduce((sum, promo) => sum + (promo.discountedPrice || 0), 0) || 0;

    // ✅ สร้างข้อมูลล็อตสำหรับใบเสร็จ
    const lotsInfo = order.products?.map(product => {
      if (product.lotsUsed && product.lotsUsed.length > 0) {
        // รวมล็อตเดียวกันเข้าด้วยกัน
        const groupedLots = {};
        product.lotsUsed.forEach(lot => {
          const key = `${lot.lotNumber}-${lot.purchasePrice}-${lot.expirationDate}`;
          if (!groupedLots[key]) {
            groupedLots[key] = {
              productName: product.productName,
              lotNumber: lot.lotNumber,
              quantityTaken: 0,
              purchasePrice: lot.purchasePrice,
              expirationDate: lot.expirationDate
            };
          }
          groupedLots[key].quantityTaken += lot.quantityTaken;
        });
        return Object.values(groupedLots);
      }
      return [];
    }).flat();

    const receiptDiv = document.createElement('div');
    receiptDiv.id = 'print-area';
    receiptDiv.style.width = '80mm';
    receiptDiv.style.minHeight = '100mm';
    receiptDiv.style.margin = '0 auto';
    receiptDiv.style.background = '#fff';
    receiptDiv.style.padding = '8px';
    receiptDiv.style.fontFamily = 'Tahoma, Arial, sans-serif';
    receiptDiv.style.color = '#222';
    receiptDiv.style.fontSize = '12px';
    receiptDiv.innerHTML = `
      <div style="text-align: center;">
        <img src="/LOGO.png" style="width: 60px; display: block; margin: 0 auto 8px;" />
      </div>
      <div style="border-top: 1px solid #222; margin: 4px 0 6px;"></div>
      <div style="font-size: 12px;">
        <div>ชื่อร้านค้า : Possible</div>
        <div>เลขที่ใบเสร็จ : ${generateOrderNumber(order._id)}</div>
        <div>วันที่ ${new Date(order.orderDate).toLocaleDateString('th-TH')}</div>
        <div>ระบบ PossiblePOS</div>
      </div>
      <div style="border-top: 1px dotted #222; margin: 6px 0;"></div>
      <table style="width: 100%; font-size: 11px; margin-bottom: 4px;">
        <thead>
          <tr>
            <th style='text-align: left;'>รายการ</th>
            <th style='text-align: center;'>จำนวน</th>
            <th style='text-align: right;'>ราคา</th>
          </tr>
        </thead>
        <tbody>
          ${order.products.map(p => `
            <tr>
              <td>${p.productName}</td>
              <td style='text-align: center;'>${p.quantity} ${p.pack ? "แพ็ค" : "ชิ้น"}</td>
              <td style='text-align: right;'>${(p.quantity * p.sellingPricePerUnit)?.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="border-top: 1px dotted #222; margin: 6px 0;"></div>
      <div style="font-size: 11px;">
        <div>ยอดรวม <span style='float: right;'>${order.total?.toFixed(2)}</span></div>
        ${totalDiscount > 0 ? `
        <div>ส่วนลด <span style='float: right;'>-${totalDiscount.toFixed(2)}</span></div>
        ` : ''}
        <div>ยอดสุทธิ ${order.products.length} รายการ <span style='float: right;'>${(order.total - totalDiscount).toFixed(2)}</span></div>
        <div>เงินสด <span style='float: right;'>${order.cash_received?.toFixed(2) || order.total?.toFixed(2)}</span></div>
      </div>
      <div style="border-top: 1px dotted #222; margin: 6px 0;"></div>
      <div style="font-size: 11px;">พนักงาน : ${order.userName || "ไม่ระบุ"}</div>
      <div style="text-align: center; margin-top: 8px; font-weight: bold; font-size: 11px;">
        ****ขอบคุณที่ใช้บริการนะคะ****
      </div>
    `;
    document.body.appendChild(receiptDiv);
    window.print();
    document.body.removeChild(receiptDiv);
  };

  function statusColor(status) {
    switch (status) {
      case "ขายสำเร็จ": return "text-green-600";
      case "ยกเลิก": return "text-red-500";
      case "คืนสินค้า": return "text-yellow-500";
      case "ตัดจำหน่าย": return "text-gray-500";
      default: return "";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">ประวัติคำสั่งซื้อ</h1>
          <p className="text-gray-600 mt-2">จัดการและดูประวัติการขายทั้งหมด</p>
        </div>

        {/* ส่วนค้นหาและกรอง - เรียบง่าย */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่คำสั่งซื้อ"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ทั้งหมด">ชำระเงิน: ทั้งหมด</option>
              {paymentOptions.map((payment) => (
                <option key={payment} value={payment}>
                  {payment}
                </option>
              ))}
            </select>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              locale={th}
              dateFormat="dd/MM/yyyy"
              placeholderText="เลือกช่วงวันที่"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              isClearable={true}
            />
          </div>
        </div>

        {/* ตารางแสดงรายการคำสั่งซื้อ - เรียบง่าย */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เลขที่คำสั่งซื้อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รายการ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดรวม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order) => {
                  return (
                    <tr
                      key={order._id}
                      onClick={() => handleOrderClick(order)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {generateOrderNumber(order._id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString("th-TH")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {order.products?.length || 0} รายการ
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.total?.toLocaleString("th-TH") || "0"} บาท
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor(order.orderStatus)}`}>
                          {order.orderStatus || "รอดำเนินการ"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls - แบบหน้าจัดการ */}
          {totalPages > 1 && (
            <div className="flex justify-end items-center gap-2 p-4">
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ก่อนหน้า
              </button>
              <span className="text-sm text-gray-700">
                หน้า {currentPage} / {totalPages}
              </span>
              <button
                className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>

        {/* Modal แสดงรายละเอียดสินค้า - เรียบง่าย */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    รายละเอียดคำสั่งซื้อ
                  </h2>
                  <p className="text-blue-600 font-medium mt-1">
                    {generateOrderNumber(selectedOrder._id)}
                  </p>
                </div>
                <button 
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>

              {/* Order Info - เรียบง่าย */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">ข้อมูลคำสั่งซื้อ</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">วันที่:</span>
                        <span className="font-medium">{new Date(selectedOrder.orderDate).toLocaleDateString("th-TH")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">สถานะ:</span>
                        <span className={`font-medium ${statusColor(selectedOrder.orderStatus)}`}>
                          {selectedOrder.orderStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ยอดรวม:</span>
                        <span className="font-medium">{selectedOrder.total?.toLocaleString("th-TH")} บาท</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">จำนวนรายการ:</span>
                        <span className="font-medium">{selectedOrder.products?.length || 0} รายการ</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">การชำระเงิน</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">วิธีชำระ:</span>
                        <span className="font-medium">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">เงินที่รับ:</span>
                        <span className="font-medium">{selectedOrder.cash_received?.toLocaleString("th-TH")} บาท</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">เงินทอน:</span>
                        <span className="font-medium">{selectedOrder.change?.toLocaleString("th-TH")} บาท</span>
                      </div>
                    </div>
                  </div>

                  {/* ✅ แสดงสรุปข้อมูลล็อต - เรียบง่าย */}
                  {selectedOrder.products && selectedOrder.products.some(product => product.lotsUsed && product.lotsUsed.length > 0) && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                        <FaBox className="mr-2" />
                        ข้อมูลล็อต
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">สินค้าที่มีล็อต:</span>
                          <span className="font-medium text-blue-900">
                            {selectedOrder.products.filter(product => product.lotsUsed && product.lotsUsed.length > 0).length} รายการ
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">จำนวนล็อต:</span>
                          <span className="font-medium text-blue-900">
                            {selectedOrder.products.reduce((sum, product) => sum + (product.lotsUsed?.length || 0), 0)} ล็อต
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">จำนวนชิ้น:</span>
                          <span className="font-medium text-blue-900">
                            {selectedOrder.products.reduce((sum, product) => {
                              if (product.lotsUsed) {
                                return sum + product.lotsUsed.reduce((lotSum, lot) => lotSum + lot.quantityTaken, 0);
                              }
                              return sum;
                            }, 0)} ชิ้น
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product List - เรียบง่าย */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">รายการสินค้า</h3>
                    <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      💡 คลิกปุ่ม "แก้ไข" เพื่อปรับจำนวนหรือราคา
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedOrder.products?.map((product, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <img 
                            src={product.image} 
                            alt={product.productName} 
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {product.productName}
                            </h4>
                            <div className="mt-1 space-y-1 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>จำนวน:</span>
                                <span className="font-medium">{product.quantity} {product.pack ? "แพ็ค" : "ชิ้น"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>ราคา/หน่วย:</span>
                                <span className="font-medium">{product.sellingPricePerUnit?.toLocaleString("th-TH")} บาท</span>
                              </div>
                              <div className="flex justify-between">
                                <span>รวม:</span>
                                <span className="font-medium text-gray-900">
                                  {(product.sellingPricePerUnit * product.quantity)?.toLocaleString("th-TH")} บาท
                                </span>
                              </div>
                              
                              {/* ✅ แสดงข้อมูลล็อต - เรียบง่าย */}
                              {product.lotsUsed && product.lotsUsed.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <div className="text-xs text-blue-600 font-medium mb-1">ล็อตที่ใช้:</div>
                                  {(() => {
                                    // รวมล็อตเดียวกันเข้าด้วยกัน
                                    const groupedLots = {};
                                    product.lotsUsed.forEach(lot => {
                                      const key = `${lot.lotNumber}-${lot.purchasePrice}-${lot.expirationDate}`;
                                      if (!groupedLots[key]) {
                                        groupedLots[key] = {
                                          lotNumber: lot.lotNumber,
                                          purchasePrice: lot.purchasePrice,
                                          expirationDate: lot.expirationDate,
                                          quantityTaken: 0
                                        };
                                      }
                                      groupedLots[key].quantityTaken += lot.quantityTaken;
                                    });
                                    
                                    return Object.values(groupedLots).map((lot, lotIndex) => (
                                      <div key={lotIndex} className="text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-300 mb-1">
                                        <div className="flex justify-between text-blue-700">
                                          <span>ล็อต {lot.lotNumber}</span>
                                          <span>{lot.quantityTaken} ชิ้น</span>
                                        </div>
                                        <div className="text-blue-600 text-xs mt-1">
                                          ราคาซื้อ: ฿{lot.purchasePrice?.toLocaleString("th-TH")} | 
                                          หมดอายุ: {new Date(lot.expirationDate).toLocaleDateString("th-TH")}
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              )}
                              
                              {/* ✅ ปุ่มแก้ไข */}
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <button 
                                  onClick={() => handleEditProduct(product)} 
                                  className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 transition-colors"
                                >
                                  <AiOutlineEdit className="w-3 h-3" />
                                  แก้ไข
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                  {/* ปุ่มเปลี่ยนสถานะ */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">สถานะ:</span>
                    <select
                      value={selectedOrder.orderStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ขายสำเร็จ">ขายสำเร็จ</option>
                      <option value="ยกเลิก">ยกเลิก</option>
                      <option value="คืนสินค้า">คืนสินค้า</option>
                      <option value="ตัดจำหน่าย">ตัดจำหน่าย</option>
                    </select>
                  </div>
                  
                  {/* ปุ่มพิมพ์ใบเสร็จ */}
                  <button 
                    onClick={() => printReceipt(selectedOrder)} 
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <AiOutlinePrinter className="w-5 h-5" />
                    <span>พิมพ์ใบเสร็จ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal แก้ไขสินค้า */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">แก้ไขสินค้า</h3>
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {/* ข้อมูลสินค้า */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{editingProduct.productName}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>จำนวนปัจจุบัน:</span>
                      <span className="font-medium">{editingProduct.quantity} {editingProduct.pack ? "แพ็ค" : "ชิ้น"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ราคาปัจจุบัน:</span>
                      <span className="font-medium">{editingProduct.sellingPricePerUnit?.toLocaleString("th-TH")} บาท</span>
                    </div>
                    {editingProduct.lotsUsed && editingProduct.lotsUsed.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs text-blue-600 font-medium mb-1">
                          ล็อตที่ใช้: {(() => {
                            // นับจำนวนล็อตที่ไม่ซ้ำกัน
                            const uniqueLots = new Set();
                            editingProduct.lotsUsed.forEach(lot => {
                              uniqueLots.add(lot.lotNumber);
                            });
                            return uniqueLots.size;
                          })()} ล็อต
                        </div>
                        <div className="text-xs text-gray-500">
                          {(() => {
                            // รวมล็อตเดียวกันเข้าด้วยกัน
                            const groupedLots = {};
                            editingProduct.lotsUsed.forEach(lot => {
                              if (!groupedLots[lot.lotNumber]) {
                                groupedLots[lot.lotNumber] = 0;
                              }
                              groupedLots[lot.lotNumber] += lot.quantityTaken;
                            });
                            
                            return Object.entries(groupedLots).map(([lotNumber, totalQuantity], index) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded mr-1 mb-1">
                                {lotNumber}({totalQuantity})
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ฟอร์มแก้ไข */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนใหม่</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => editingProduct.quantity > 1 && setEditingProduct({ ...editingProduct, quantity: editingProduct.quantity - 1 })}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <AiOutlineMinus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={editingProduct.quantity}
                      onChange={e => setEditingProduct({ ...editingProduct, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-20 text-center border border-gray-300 rounded-lg py-2"
                    />
                    <button
                      onClick={() => setEditingProduct({ ...editingProduct, quantity: editingProduct.quantity + 1 })}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <AiOutlinePlus className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600">{editingProduct.pack ? 'แพ็ค' : 'ชิ้น'}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ราคา/หน่วย (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingProduct.sellingPricePerUnit}
                    onChange={e => setEditingProduct({ ...editingProduct, sellingPricePerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3"
                  />
                </div>

                {/* แสดงการเปลี่ยนแปลง */}
                <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">สรุปการเปลี่ยนแปลง</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div className="flex justify-between">
                      <span>จำนวน:</span>
                      <span className="font-medium">
                        {selectedOrder.products.find(p => p.productId === editingProduct.productId)?.quantity || 0} 
                        → {editingProduct.quantity} {editingProduct.pack ? "แพ็ค" : "ชิ้น"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ราคา/หน่วย:</span>
                      <span className="font-medium">
                        {(selectedOrder.products.find(p => p.productId === editingProduct.productId)?.sellingPricePerUnit || 0).toLocaleString("th-TH")} 
                        → {editingProduct.sellingPricePerUnit?.toLocaleString("th-TH")} บาท
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-1 mt-2">
                      <span>รวมใหม่:</span>
                      <span className="font-semibold text-blue-900">
                        {(editingProduct.quantity * editingProduct.sellingPricePerUnit).toLocaleString('th-TH')} บาท
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => handleUpdateProduct(editingProduct.productId, {
                      quantity: editingProduct.quantity,
                      sellingPricePerUnit: editingProduct.sellingPricePerUnit,
                    })}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    บันทึกการเปลี่ยนแปลง
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
