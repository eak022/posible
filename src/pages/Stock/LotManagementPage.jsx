import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import productService from '../../services/product.service';
import LotList from '../../components/LotManagement/LotList';

const LotManagementPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stockInfo, setStockInfo] = useState(null);

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const productData = await productService.getProductById(productId);
      setProduct(productData);

      // ดึงข้อมูลสต็อก
      const stockData = await productService.checkStockAvailability(productId, 1);
      setStockInfo(stockData);
    } catch (error) {
      console.error('Error fetching product data:', error);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถโหลดข้อมูลสินค้าได้',
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
      });
      navigate('/product');
    } finally {
      setLoading(false);
    }
  };

  const handleLotUpdated = () => {
    fetchProductData(); // รีเฟรชข้อมูลเมื่อมีการอัปเดตล็อต
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center overflow-y-auto">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center overflow-y-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ไม่พบสินค้า</h2>
          <button
            onClick={() => navigate('/product')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            กลับไปหน้าสินค้า
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-y-auto">
      <div className="p-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/product')}
                className="group flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
              >
                <FaArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium">กลับ</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                จัดการล็อต - {product.productName}
              </h1>
            </div>
          </div>

          {/* Product Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={product.productImage}
                  alt={product.productName}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-gray-800">{product.productName}</h3>
                  <p className="text-sm text-gray-600">รหัส: {product._id}</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">จำนวนรวม</p>
                <p className="text-2xl font-bold text-blue-600">
                  {product.totalQuantity || product.quantity || 0}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">ราคาขายต่อหน่วย</p>
                <p className="text-xl font-bold text-green-600">
                  ฿{product.sellingPricePerUnit}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">ราคาซื้อเฉลี่ย</p>
                <p className="text-xl font-bold text-purple-600">
                  ฿{product.averagePurchasePrice || product.purchasePrice || 0}
                </p>
              </div>
            </div>

            {/* Stock Details */}
            {stockInfo && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">ข้อมูลสต็อก</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">สถานะสต็อก</p>
                    <p className={`font-semibold ${stockInfo.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {stockInfo.isAvailable ? 'พร้อมขาย' : 'ไม่พร้อมขาย'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ล็อตที่มีสต็อก</p>
                    <p className="font-semibold text-blue-600">
                      {stockInfo.availableLots?.length || 0} ล็อต
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">วันหมดอายุเร็วสุด</p>
                    <p className="font-semibold text-orange-600">
                      {stockInfo.nearestExpiration 
                        ? new Date(stockInfo.nearestExpiration).toLocaleDateString('th-TH')
                        : 'ไม่มีวันหมดอายุ'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lot Management */}
          <LotList
            productId={productId}
            productName={product.productName}
            packSize={product.packSize || 1}
            onLotUpdated={handleLotUpdated}
          />

          {/* Quick Actions */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              การดำเนินการด่วน
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate(`/products/edit-product/${productId}`)}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-xl p-4 transition-all duration-300 hover:shadow-md border border-blue-200 hover:border-blue-300"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-blue-500 text-white rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <FaEdit size={16} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">แก้ไขสินค้า</p>
                    <p className="text-xs text-blue-600 opacity-75">ปรับแต่งข้อมูลสินค้า</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              <button
                onClick={() => navigate(`/purchase-orders`)}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-700 rounded-xl p-4 transition-all duration-300 hover:shadow-md border border-emerald-200 hover:border-emerald-300"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-emerald-500 text-white rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <FaPlus size={16} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">สร้างใบสั่งซื้อ</p>
                    <p className="text-xs text-emerald-600 opacity-75">เพิ่มสต็อกสินค้าใหม่</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotManagementPage; 