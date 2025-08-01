import React, { useState, useEffect } from "react";
import { orderService } from "../../services";
import { generateOrderNumber } from "../../utils/orderUtils";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { th } from "date-fns/locale";
import { AiOutlineCalendar, AiOutlineCheck, AiOutlineDollar, AiOutlineClose, AiOutlineEdit, AiOutlinePrinter, AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { FiCreditCard } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";

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
  const ORDERS_PER_PAGE = 7;
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
    setEditingProduct(product);
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
                    sellingPricePerUnit: updates.sellingPricePerUnit
                  };
                }
                return product;
              }),
            };
          }
          return order;
        });
        setOrders(updatedOrders);
        setSelectedOrder(updatedOrders.find((order) => order._id === selectedOrder._id));
        setEditingProduct(null);

        // แสดงข้อความแจ้งเตือนสำเร็จ
        Swal.fire({
          icon: "success",
          title: "แก้ไขสำเร็จ",
          text: "อัพเดทรายละเอียดสินค้าเรียบร้อยแล้ว",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      console.error("Error updating product:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.response?.data?.message || "ไม่สามารถแก้ไขรายละเอียดสินค้าได้",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // ฟังก์ชันสำหรับสร้างใบเสร็จและสั่งปริ้น
  const printReceipt = (order) => {
    // รวมส่วนลดจาก promotionId
    const totalDiscount = order.promotionId?.reduce((sum, promo) => sum + (promo.discountedPrice || 0), 0) || 0;

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
    return <div>กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ประวัติคำสั่งซื้อ</h1>

      {/* ส่วนค้นหาและกรอง */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ค้นหา
            </label>
            <input
              type="text"
              placeholder="ค้นหาตามเลขที่คำสั่งซื้อ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              สถานะ
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วิธีการชำระเงิน
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="form-select"
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              {paymentOptions.map((payment) => (
                <option key={payment} value={payment}>
                  {payment}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่
            </label>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              locale={th}
              dateFormat="dd/MM/yyyy"
              placeholderText="เลือกช่วงวันที่"
              className="w-full p-2 border rounded"
              isClearable={true}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
        </div>
      </div>

      {/* ตารางแสดงรายการคำสั่งซื้อ */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left  text-sm font-semibold text-black-500 uppercase tracking-wider">
                เลขที่คำสั่งซื้อ
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-black-500 uppercase tracking-wider">
                วันที่
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-black-500 uppercase tracking-wider">
                รายการสินค้า
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-black-500 uppercase tracking-wider">
                ยอดรวม
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-black-500 uppercase tracking-wider">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedOrders.map((order) => (
              <tr
                key={order._id}
                onClick={() => handleOrderClick(order)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {generateOrderNumber(order._id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.orderDate).toLocaleDateString("th-TH")}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {order.products?.length || 0} รายการ
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.total?.toLocaleString("th-TH") || "0"} บาท
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.orderStatus || "รอดำเนินการ"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
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

      {/* Modal แสดงรายละเอียดสินค้า */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
            {/* Header */}
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500" onClick={handleCloseDetails}>
              <AiOutlineClose className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-2">รายละเอียดคำสั่งซื้อ <span className="text-blue-600">{generateOrderNumber(selectedOrder._id)}</span></h2>
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <AiOutlineCalendar className="w-4 h-4" />
                  วันที่: {new Date(selectedOrder.orderDate).toLocaleDateString("th-TH")}
                </div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <AiOutlineCheck className="w-4 h-4" />
                  สถานะ:
                  <span className={`font-semibold ${statusColor(selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</span>
                  {!editingStatus && (
                    <button
                      onClick={() => {
                        setEditingStatus(true);
                        setNewStatus(selectedOrder.orderStatus);
                      }}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                      title="แก้ไขสถานะ"
                    >
                      <AiOutlineEdit className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {editingStatus && (
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="ขายสำเร็จ">ขายสำเร็จ</option>
                      <option value="ยกเลิก">ยกเลิก</option>
                      <option value="คืนสินค้า">คืนสินค้า</option>
                      <option value="ตัดจำหน่าย">ตัดจำหน่าย</option>
                    </select>
                    <button
                      onClick={async () => {
                        try {
                          await orderService.updateOrderStatus(selectedOrder._id, newStatus);
                          setEditingStatus(false);
                          // อัปเดตสถานะใน selectedOrder
                          setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
                          // อัปเดตสถานะใน orders list
                          setOrders(orders.map(order =>
                            order._id === selectedOrder._id
                              ? { ...order, orderStatus: newStatus }
                              : order
                          ));
                          Swal.fire({ icon: 'success', title: 'อัปเดตสถานะสำเร็จ', timer: 1200, showConfirmButton: false });
                        } catch (err) {
                          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err?.message || 'ไม่สามารถอัปเดตสถานะได้' });
                        }
                      }}
                      className="bg-green-500 text-white px-3 py-1 rounded text-xs"
                    >บันทึก</button>
                    <button
                      onClick={() => setEditingStatus(false)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs"
                    >ยกเลิก</button>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <AiOutlineDollar className="w-4 h-4" />
                  ยอดรวม: {selectedOrder.total?.toLocaleString("th-TH")} บาท
                </div>
                {/* แสดงส่วนลดจาก promotionId */}
                {selectedOrder.promotionId && selectedOrder.promotionId.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-yellow-500 mb-1">
                      <AiOutlineDollar className="w-4 h-4" />
                      ส่วนลด:
                      {selectedOrder.promotionId.map((promo, idx) => (
                        <span key={promo._id || idx} className="ml-1">
                          {promo.promotionName ? `${promo.promotionName} -${promo.discountedPrice?.toLocaleString("th-TH")} บาท` : `-${promo.discountedPrice?.toLocaleString("th-TH")} บาท`}
                          {idx < selectedOrder.promotionId.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-gray-800 font-semibold mb-1">
                      <AiOutlineDollar className="w-4 h-4" />
                      ยอดสุทธิ: {(selectedOrder.total - selectedOrder.promotionId.reduce((sum, promo) => sum + (promo.discountedPrice || 0), 0)).toLocaleString("th-TH")} บาท
                    </div>
                  </>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FiCreditCard className="w-4 h-4" />
                  วิธีชำระ: {selectedOrder.paymentMethod}
                </div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FaMoneyBillWave className="w-4 h-4" />
                  เงินที่รับ: {selectedOrder.cash_received?.toLocaleString("th-TH")} บาท
                </div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FaMoneyBillWave className="w-4 h-4" />
                  เงินทอน: {selectedOrder.change?.toLocaleString("th-TH")} บาท
                </div>
              </div>
            </div>
            {/* Product List */}
            <div>
              <h3 className="text-lg font-semibold mb-2">รายการสินค้า</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {selectedOrder.products?.map((product, index) => (
                  <div key={index} className="bg-white rounded-xl shadow p-3 flex flex-col items-center relative">
                    <img src={product.image} alt={product.productName} className="w-16 h-16 object-cover rounded mb-2" />
                    <div className="font-medium text-sm text-center truncate w-full mb-1">{product.productName}</div>
                    {editingProduct?.productId === product.productId ? (
                      <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <div className="bg-white rounded-xl shadow-lg p-4 w-56 max-w-full border border-gray-200 relative">
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                            title="ปิด"
                          >
                            <AiOutlineClose className="w-4 h-4" />
                          </button>
                          <div className="mb-2 text-center font-semibold text-base text-gray-700 truncate">{product.productName}</div>
                          <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">จำนวน</label>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => editingProduct.quantity > 1 && setEditingProduct({ ...editingProduct, quantity: editingProduct.quantity - 1 })}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white border hover:bg-gray-100"
                                title="ลด"
                              >
                                <AiOutlineMinus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={editingProduct.quantity}
                                onChange={e => setEditingProduct({ ...editingProduct, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-12 text-center border rounded-md py-1"
                              />
                              <button
                                onClick={() => setEditingProduct({ ...editingProduct, quantity: editingProduct.quantity + 1 })}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white border hover:bg-gray-100"
                                title="เพิ่ม"
                              >
                                <AiOutlinePlus className="w-4 h-4" />
                              </button>
                              <span className="text-xs text-gray-500">{product.pack ? 'แพ็ค' : 'ชิ้น'}</span>
                            </div>
                          </div>
                          <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">ราคา/หน่วย</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingProduct.sellingPricePerUnit}
                              onChange={e => setEditingProduct({ ...editingProduct, sellingPricePerUnit: parseFloat(e.target.value) || 0 })}
                              className="w-full border rounded-md py-1 text-right"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 border-t pt-2 mt-2">
                            <span>รวม</span>
                            <span className="font-semibold text-gray-800">
                              {(editingProduct.quantity * editingProduct.sellingPricePerUnit).toLocaleString('th-TH')} บาท
                            </span>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => setEditingProduct(null)}
                              className="flex-1 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateProduct(product.productId, {
                                  quantity: editingProduct.quantity,
                                  sellingPricePerUnit: editingProduct.sellingPricePerUnit,
                                })
                              }
                              className="flex-1 py-1 rounded-md bg-green-500 text-white hover:bg-green-600 text-xs font-semibold"
                            >
                              บันทึก
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-gray-600 mb-1">จำนวน: {product.quantity} {product.pack ? "แพ็ค" : "ชิ้น"}</div>
                        <div className="text-xs text-gray-600 mb-1">ราคา/หน่วย: {product.sellingPricePerUnit?.toLocaleString("th-TH")} บาท</div>
                        {/* แสดงส่วนลดของสินค้านี้ */}
                        {product.discountAmount && product.discountAmount > 0 && (
                          <div className="text-xs text-green-600 mb-1">ส่วนลด: -{product.discountAmount.toLocaleString("th-TH")} บาท</div>
                        )}
                        <div className="text-xs text-gray-800 font-semibold mb-2">รวม: {(product.sellingPricePerUnit * product.quantity)?.toLocaleString("th-TH")} บาท</div>
                        <button onClick={() => handleEditProduct(product)} className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1">
                          <AiOutlineEdit className="w-3 h-3" />
                          แก้ไข
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Action Button */}
            <div className="flex justify-end mt-6">
              <button onClick={() => printReceipt(selectedOrder)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2">
                <AiOutlinePrinter className="w-5 h-5" />
                พิมพ์ใบเสร็จ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
