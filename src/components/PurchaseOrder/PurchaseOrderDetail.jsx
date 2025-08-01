import React, { useEffect, useState, useRef } from "react";
import purchaseOrderService from "../../services/purchaseOrder.service";
import supplierService from "../../services/supplier.service";
import { IoMdClose } from "react-icons/io";
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import PropTypes from 'prop-types';
import useAuthStore from '../../store/useAuthStore';

const PurchaseOrderDetail = ({ id, onClose }) => {
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);
  const [showPrintOrder, setShowPrintOrder] = useState(false);
  const [receivingStock, setReceivingStock] = useState(false);
  const [stockResult, setStockResult] = useState(null);
  const printRef = useRef();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await purchaseOrderService.getPurchaseOrderById(id);
        console.log('Purchase Order Data:', response);
        
        // ตรวจสอบว่ามีข้อมูลหรือไม่
        if (response) {
          setPurchaseOrder(response);
          
          // ดึงข้อมูลซัพพลายเออร์
          if (response.supplierId) {
            try {
              // ตรวจสอบว่า supplierId เป็น object หรือ string
              const supplierId = typeof response.supplierId === 'object' 
                ? response.supplierId._id 
                : response.supplierId;
              
              console.log('Supplier ID:', supplierId);
              const supplierData = await supplierService.getSupplierById(supplierId);
              console.log('Supplier Data:', supplierData);
              
              if (supplierData) {
                setSupplier(supplierData);
              }
            } catch (error) {
              console.error('Error fetching supplier:', error);
            }
          }
        } else {
          console.error('Invalid response format:', response);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching purchase order:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handlePrintOrder = () => {
    setShowPrintOrder(true);
    setTimeout(() => {
      window.print();
      setShowPrintOrder(false);
    }, 200);
  };

  const handleReceiveStock = async () => {
    if (!purchaseOrder || purchaseOrder.status === "completed") {
      return;
    }

    setReceivingStock(true);
    try {
      // ใช้ฟังก์ชันใหม่ที่เติมสต็อกทั้งหมดในครั้งเดียว
      const response = await purchaseOrderService.addAllStockFromOrder(id);
      console.log('Stock receive response:', response);
      
      // อัปเดตข้อมูลใบสั่งซื้อ
      const updatedOrder = await purchaseOrderService.getPurchaseOrderById(id);
      setPurchaseOrder(updatedOrder);
      
      setStockResult({
        message: response.message,
        addedProducts: response.addedProducts,
        skippedProducts: response.skippedProducts,
        orderNumber: response.orderNumber
      });
      
      // แสดงผลลัพธ์ 5 วินาที
      setTimeout(() => {
        setStockResult(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error receiving stock:', error);
      setStockResult({
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเติมสต็อก',
        error: true
      });
    } finally {
      setReceivingStock(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Area */}
      {showPrintOrder && (
        <div id="print-order-area" ref={printRef} style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff', padding: 24, fontFamily: 'Tahoma, Arial, sans-serif', color: '#222', fontSize: 14, position: 'relative' }}>
          <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>ใบสั่งของ</div>
          <div style={{ position: 'absolute', right: 32, top: 24, fontSize: 14, textAlign: 'right', background: '#fff', padding: '2px 8px', borderRadius: 4 }}>
            เลขที่: <b>{purchaseOrder?.orderNumber || purchaseOrder?._id || ''}</b><br />
            วันที่: <b>{purchaseOrder?.createdAt ? new Date(purchaseOrder.createdAt).toLocaleDateString('th-TH') : '-'}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, marginTop: 32 }}>
            <div style={{ width: '48%', border: '1px solid #888', borderRadius: 6, padding: 8 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>ข้อมูลซัพพลายเออร์</div>
              <div>ชื่อผู้ขาย: {supplier?.sellerName || '-'}</div>
              <div>ชื่อบริษัท: {supplier?.companyName || '-'}</div>
              <div>ที่อยู่: {supplier?.address || '-'}</div>
              <div>เบอร์โทร: {supplier?.phoneNumber || '-'}</div>
            </div>
            <div style={{ width: '48%', border: '1px solid #888', borderRadius: 6, padding: 8 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>ข้อมูลร้านค้า</div>
              <div>ชื่อร้านค้า: {user?.shopName || user?.username || '-'}</div>
              <div>ที่อยู่: {user?.address || '-'}</div>
              <div>เบอร์โทร: {user?.phoneNumber || '-'}</div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr style={{ background: '#f3e8ff' }}>
                <th style={{ border: '1px solid #888', padding: 6 }}>รายการสินค้า</th>
                <th style={{ border: '1px solid #888', padding: 6 }}>จำนวน</th>
                <th style={{ border: '1px solid #888', padding: 6 }}>หน่วย</th>
                <th style={{ border: '1px solid #888', padding: 6 }}>ราคา/หน่วย</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder?.products?.map((p, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #888', padding: 6 }}>{p.productName}</td>
                  <td style={{ border: '1px solid #888', padding: 6, textAlign: 'center' }}>{p.quantity}</td>
                  <td style={{ border: '1px solid #888', padding: 6, textAlign: 'center' }}>
                    {p.pack
                      ? `แพ็ค${(p.packSize || (p.productId && p.productId.packSize)) ? ` (${p.packSize || (p.productId && p.productId.packSize)} ชิ้น)` : ''}`
                      : 'ชิ้น'}
                  </td>
                  <td style={{ border: '1px solid #888', padding: 6, textAlign: 'right' }}>{p.purchasePrice?.toLocaleString() || '-'}</td>
                </tr>
              ))}
              <tr className="bg-purple-100 font-semibold">
                <td colSpan="4" className="py-3 px-4 text-right">รวมทั้งสิ้น</td>
                <td className="py-3 px-4 text-right">
                  {purchaseOrder?.products?.reduce((sum, p) => sum + (p.purchasePrice || 0) * (p.quantity || 0), 0).toLocaleString()} บาท
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginBottom: 12, fontWeight: 'bold' }}>หมายเหตุคำสั่งซื้อ: {purchaseOrder?.note || '-'}</div>
          <div style={{ borderTop: '1px solid #888', marginTop: 24, paddingTop: 12, fontSize: 12, color: '#888' }}>พิมพ์โดยระบบ PossiblePOS</div>
        </div>
      )}
      {/* Modal ปกติ */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl overflow-y-auto max-h-[80vh]">
          {/* หัว Modal */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">ใบสั่งของ #{purchaseOrder?.orderNumber || purchaseOrder?._id || ''}</h2>
            <div className="flex gap-2 items-center">
              <button
                id="po-detail-print-button"
                onClick={handlePrintOrder}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                พิมพ์ใบสั่งของ
              </button>
              <button
                id="po-detail-close-button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <IoMdClose />
              </button>
            </div>
          </div>
          {/* เนื้อหา */}
          <div className="p-6">
            {/* ส่วนบน */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-gray-600">เลขใบสั่งซื้อ</p>
                <p className="font-semibold">{purchaseOrder?.orderNumber || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">วันที่</p>
                <p className="font-semibold">
                  {purchaseOrder?.createdAt ? 
                    format(new Date(purchaseOrder.createdAt), 'dd/MM/yy', { locale: th }) 
                    : '-'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">สถานะ</p>
                <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                  purchaseOrder?.status === "completed" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {purchaseOrder?.status === "completed" ? "เสร็จสิ้น" : "รอดำเนินการ"}
                </span>
              </div>
            </div>

            {/* แสดงผลลัพธ์การเติมสต็อก */}
            {stockResult && (
              <div className={`mb-4 p-4 rounded-lg ${
                stockResult.error 
                  ? 'bg-red-100 border border-red-300 text-red-700' 
                  : 'bg-green-100 border border-green-300 text-green-700'
              }`}>
                <h4 className="font-semibold mb-2">
                  {stockResult.error ? '❌ เกิดข้อผิดพลาด' : '✅ ผลการเติมสต็อก'}
                </h4>
                <p className="mb-2">{stockResult.message}</p>
                
                {!stockResult.error && stockResult.addedProducts && stockResult.addedProducts.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-sm mb-1">สินค้าที่เติมสต็อกแล้ว:</p>
                    <ul className="text-sm space-y-1">
                      {stockResult.addedProducts.map((product, index) => (
                        <li key={index}>
                          • {product.productName}: +{product.addedQuantity} ชิ้น (จาก {product.oldQuantity} เป็น {product.newQuantity} ชิ้น)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {!stockResult.error && stockResult.skippedProducts && stockResult.skippedProducts.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-sm mb-1 text-yellow-700">สินค้าที่ข้ามไป:</p>
                    <ul className="text-sm space-y-1">
                      {stockResult.skippedProducts.map((product, index) => (
                        <li key={index}>
                          • {product.productName}: {product.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ข้อมูลซัพพลายเออร์ */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">ชื่อบริษัท</p>
                  <p className="font-semibold">{supplier?.companyName || 'ไม่ระบุ'}</p>
                </div>
                <div>
                  <p className="text-gray-600">ชื่อผู้ขาย</p>
                  <p className="font-semibold">{supplier?.sellerName || 'ไม่ระบุ'}</p>
                </div>
                <div>
                  <p className="text-gray-600">ที่อยู่</p>
                  <p className="font-semibold">{supplier?.address || 'ไม่ระบุ'}</p>
                </div>
                <div>
                  <p className="text-gray-600">เบอร์โทรศัพท์</p>
                  <p className="font-semibold">{supplier?.phoneNumber || 'ไม่ระบุ'}</p>
                </div>
              </div>
            </div>

            {/* ตารางรายการสินค้า */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-100">
                  <tr>
                    <th className="py-3 px-4 text-left">#</th>
                    <th className="py-3 px-4 text-left">รายการสินค้า</th>
                    <th className="py-3 px-4 text-center">จำนวนสินค้า</th>
                    <th className="py-3 px-4 text-center">หน่วย</th>
                    <th className="py-3 px-4 text-right">ราคา/หน่วย</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrder?.products?.map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">{product.productName}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span>{product.quantity}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {product.pack
                          ? `แพ็ค${(product.packSize || (product.productId && product.productId.packSize)) ? ` (${product.packSize || (product.productId && product.productId.packSize)} ชิ้น)` : ''}`
                          : 'ชิ้น'}
                      </td>
                      <td className="py-3 px-4 text-right">{product.purchasePrice?.toLocaleString()} บาท</td>
                    </tr>
                  ))}
                  <tr className="bg-purple-100 font-semibold">
                    <td colSpan="4" className="py-3 px-4 text-right">รวมทั้งสิ้น</td>
                    <td className="py-3 px-4 text-right">
                      {purchaseOrder?.products?.reduce((sum, p) => sum + (p.purchasePrice || 0) * (p.quantity || 0), 0).toLocaleString()} บาท
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* หมายเหตุ */}
            <div className="mt-6">
              <p className="text-gray-600">หมายเหตุคำสั่งซื้อ:</p>
              <p>{purchaseOrder?.note || '-'}</p>
            </div>
          </div>
        </div>
      </div>
      {/* CSS Print Only */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-order-area, #print-order-area * { visibility: visible !important; }
          #print-order-area { position: absolute !important; left: 0; top: 0; width: 100vw !important; min-height: 100vh !important; background: #fff !important; z-index: 9999; }
        }
      `}</style>
    </>
  );
};

PurchaseOrderDetail.propTypes = {
  id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default PurchaseOrderDetail; 