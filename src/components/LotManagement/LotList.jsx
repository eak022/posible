import React, { useState, useEffect, useContext } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import productService from '../../services/product.service';
import { ProductContext } from '../../context/ProductContext';

const LotList = ({ productId, productName, packSize = 1, onLotUpdated }) => {
  const { updateProduct } = useContext(ProductContext);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditCompleteModal, setShowEditCompleteModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);

  useEffect(() => {
    fetchLots();
  }, [productId, selectedStatus]);

  const fetchLots = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductLots(productId, selectedStatus);
      setLots(response.lots || []);
    } catch (error) {
      console.error('Error fetching lots:', error);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถโหลดข้อมูลล็อตได้',
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLot = async (lotData) => {
    try {
      const response = await productService.addLotToProduct(productId, lotData);
      Swal.fire({
        icon: 'success',
        title: 'เพิ่มล็อตสำเร็จ',
        text: 'ล็อตใหม่ถูกเพิ่มเข้าระบบแล้ว'
      });
      setShowAddModal(false);
      fetchLots();
      
      // ✅ อัพเดทสต็อกสินค้าใน ProductContext ทันที
      console.log('Add lot response:', response);
      if (response && response.product) {
        updateProduct(productId, {
          quantity: response.product.quantity,
          lots: response.product.lots,
          totalQuantity: response.product.totalQuantity || response.product.quantity
        });
        console.log('Updated product in context:', response.product);
      } else {
        // Fallback: เรียก API ใหม่เพื่อดึงข้อมูลสินค้าล่าสุด
        console.log('No product in response, fetching latest product data...');
        try {
          const latestProduct = await productService.getProductById(productId);
          updateProduct(productId, {
            quantity: latestProduct.quantity,
            lots: latestProduct.lots,
            totalQuantity: latestProduct.totalQuantity || latestProduct.quantity
          });
          console.log('Updated product from API:', latestProduct);
        } catch (error) {
          console.error('Error fetching latest product:', error);
        }
      }
      
      if (onLotUpdated) onLotUpdated();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถเพิ่มล็อตได้',
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มล็อต'
      });
    }
  };

  const handleDisposeLot = async (lotNumber) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการตัดจำหน่าย',
      text: `คุณต้องการตัดจำหน่ายล็อต ${lotNumber} หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: 'ตัดจำหน่าย',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const response = await productService.disposeLot(productId, lotNumber, 'manual');
        Swal.fire({
          icon: 'success',
          title: 'ตัดจำหน่ายสำเร็จ',
          text: 'ล็อตถูกตัดจำหน่ายแล้ว'
        });
        fetchLots();
        
        // ✅ อัพเดทสต็อกสินค้าใน ProductContext ทันที
        console.log('Dispose lot response:', response);
        if (response && response.product) {
          updateProduct(productId, {
            quantity: response.product.quantity,
            lots: response.product.lots,
            totalQuantity: response.product.totalQuantity || response.product.quantity
          });
          console.log('Updated product in context:', response.product);
        } else {
          // Fallback: เรียก API ใหม่เพื่อดึงข้อมูลสินค้าล่าสุด
          console.log('No product in response, fetching latest product data...');
          try {
            const latestProduct = await productService.getProductById(productId);
            updateProduct(productId, {
              quantity: latestProduct.quantity,
              lots: latestProduct.lots,
              totalQuantity: latestProduct.totalQuantity || latestProduct.quantity
            });
            console.log('Updated product from API:', latestProduct);
          } catch (error) {
            console.error('Error fetching latest product:', error);
          }
        }
        
        if (onLotUpdated) onLotUpdated();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถตัดจำหน่ายได้',
          text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการตัดจำหน่าย'
        });
      }
    }
  };

  // ✅ ฟังก์ชันใหม่: แก้ไขข้อมูลล็อตทั้งหมด
  const handleUpdateLotComplete = async (lotNumber, lotData, reason) => {
    try {
      const response = await productService.updateLotComplete(productId, lotNumber, lotData, reason);
      Swal.fire({
        icon: 'success',
        title: 'อัปเดตล็อตสำเร็จ',
        text: 'ข้อมูลล็อตทั้งหมดถูกอัปเดตแล้ว'
      });
      setShowEditCompleteModal(false);
      setSelectedLot(null);
      fetchLots();
      
      // ✅ อัพเดทสต็อกสินค้าใน ProductContext ทันที
      console.log('Update lot response:', response);
      if (response && response.product) {
        updateProduct(productId, {
          quantity: response.product.quantity,
          lots: response.product.lots,
          totalQuantity: response.product.totalQuantity || response.product.quantity
        });
        console.log('Updated product in context:', response.product);
      } else {
        // Fallback: เรียก API ใหม่เพื่อดึงข้อมูลสินค้าล่าสุด
        console.log('No product in response, fetching latest product data...');
        try {
          const latestProduct = await productService.getProductById(productId);
          updateProduct(productId, {
            quantity: latestProduct.quantity,
            lots: latestProduct.lots,
            totalQuantity: latestProduct.totalQuantity || latestProduct.quantity
          });
          console.log('Updated product from API:', latestProduct);
        } catch (error) {
          console.error('Error fetching latest product:', error);
        }
      }
      
      if (onLotUpdated) onLotUpdated();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถอัปเดตล็อตได้',
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดต'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'ไม่มีวันหมดอายุ';
    }
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'disposed': return 'text-gray-600 bg-gray-100';
      case 'depleted': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'ใช้งาน';
      case 'expired': return 'หมดอายุ';
      case 'disposed': return 'ตัดจำหน่าย';
      case 'depleted': return 'หมดสต็อก';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            รายการล็อต - {productName}
          </h3>
          <p className="text-sm text-gray-500">
            แพ็คไซต์: {packSize} ชิ้น/แพ็ค
          </p>
        </div>
        <div className="flex gap-3">
          {/* Modern Dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 cursor-pointer min-w-[140px]"
            >
              <option value="">ทั้งหมด</option>
              <option value="active">ใช้งาน</option>
              <option value="expired">หมดอายุ</option>
              <option value="disposed">ตัดจำหน่าย</option>
              <option value="depleted">หมดสต็อก</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Modern Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-2.5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2 font-medium"
          >
            <div className="relative z-10 flex items-center gap-2">
              <FaPlus size={14} className="group-hover:scale-110 transition-transform duration-300" />
              <span>เพิ่มล็อต</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>

      {lots.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          ไม่พบล็อตในสถานะที่เลือก
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เลขล็อต
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ราคาซื้อ/ชิ้น
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันหมดอายุ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lots.map((lot) => (
                <tr key={lot.lotNumber} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {lot.lotNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lot.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>฿{lot.purchasePrice.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">ต่อชิ้น</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(lot.expirationDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lot.status)}`}>
                      {getStatusText(lot.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {lot.status === 'active' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedLot(lot);
                              setShowEditCompleteModal(true);
                            }}
                            className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors duration-200"
                            title="แก้ไขข้อมูลทั้งหมด"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDisposeLot(lot.lotNumber)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200"
                            title="ตัดจำหน่ายล็อต"
                          >
                            <FaTrash size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Lot Modal */}
      {showAddModal && (
        <AddLotModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddLot}
          productName={productName}
          packSize={packSize}
          lots={lots}
        />
      )}

      {/* Edit Lot Complete Modal */}
      {showEditCompleteModal && selectedLot && (
        <EditLotCompleteModal
          lot={selectedLot}
          onClose={() => {
            setShowEditCompleteModal(false);
            setSelectedLot(null);
          }}
          onUpdate={handleUpdateLotComplete}
          productName={productName}
        />
      )}
    </div>
  );
};

// Add Lot Modal Component
const AddLotModal = ({ onClose, onAdd, productName, packSize = 1, lots = [] }) => {
  // ดึงราคาซื้อจากล็อตก่อนหน้า (ล็อตล่าสุด)
  const getLatestPurchasePrice = () => {
    if (lots && lots.length > 0) {
      // เรียงล็อตตาม receivedDate จากใหม่ไปเก่า
      const sortedLots = [...lots].sort((a, b) => 
        new Date(b.receivedDate) - new Date(a.receivedDate)
      );
      return sortedLots[0].purchasePrice;
    }
    return '';
  };

  const [formData, setFormData] = useState({
    quantity: '',
    purchasePrice: getLatestPurchasePrice(),
    expirationDate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">เพิ่มล็อตใหม่ - {productName}</h3>
        <p className="text-sm text-gray-600 mb-4">เลขล็อตจะถูกสร้างอัตโนมัติโดยระบบ</p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวน *
              </label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ราคาซื้อต่อหน่วย *
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  required
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500">
                  ราคาต่อชิ้น (แพ็คไซต์: {packSize} ชิ้น/แพ็ค)
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันหมดอายุ <span className="text-gray-500">(ไม่บังคับ)</span>
              </label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 สำหรับสินค้าที่ไม่มีวันหมดอายุ เช่น เครื่องใช้ อิเล็กทรอนิกส์ (ถ้าไม่กรอก จะแสดงเป็น "ไม่มีวันหมดอายุ")
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              เพิ่มล็อต
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LotList;

// Edit Lot Complete Modal Component (แก้ไขข้อมูลล็อตทั้งหมด)
const EditLotCompleteModal = ({ lot, onClose, onUpdate, productName }) => {
  const [formData, setFormData] = useState({
    quantity: lot.quantity.toString(),
    purchasePrice: lot.purchasePrice.toString(),
    expirationDate: lot.expirationDate ? lot.expirationDate.split('T')[0] : '',
    reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(lot.lotNumber, {
      quantity: parseInt(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      expirationDate: formData.expirationDate
    }, formData.reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">แก้ไขข้อมูลล็อตทั้งหมด - {productName}</h3>
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">เลขล็อต: {lot.lotNumber}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนใหม่ *
              </label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ราคาซื้อใหม่ *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันหมดอายุใหม่ <span className="text-gray-500">(ไม่บังคับ)</span>
              </label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 สำหรับสินค้าที่ไม่มีวันหมดอายุ เช่น เครื่องใช้ อิเล็กทรอนิกส์ (ถ้าไม่กรอก จะแสดงเป็น "ไม่มีวันหมดอายุ")
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เหตุผลในการแก้ไข (ไม่บังคับ)
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="ระบุเหตุผลในการแก้ไขข้อมูลล็อต..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              บันทึก
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 