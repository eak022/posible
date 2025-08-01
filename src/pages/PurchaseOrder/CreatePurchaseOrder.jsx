import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import purchaseOrderService from "../../services/purchaseOrder.service";
import productService from "../../services/product.service";
import supplierService from "../../services/supplier.service";
import ProductList from "../../components/PurchaseOrder/ProductList";
import { FaPlus, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import useAuthStore from "../../store/useAuthStore";
import { ProductContext } from "../../context/ProductContext";

const CreatePurchaseOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { products, setProducts } = useContext(ProductContext);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    supplierId: "",
    purchaseOrderDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [productsResponse, suppliersResponse] = await Promise.all([
        productService.getAllProducts(),
        supplierService.getAllSuppliers(),
      ]);

      console.log("Suppliers Response:", suppliersResponse);

      const formattedProducts = Array.isArray(productsResponse)
        ? productsResponse
        : productsResponse.products || [];

      const formattedSuppliers = Array.isArray(suppliersResponse)
        ? suppliersResponse
        : suppliersResponse.suppliers || [];

      console.log("Formatted Suppliers:", formattedSuppliers);

      setProducts(formattedProducts);
      setSuppliers(formattedSuppliers);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "ไม่สามารถโหลดข้อมูลได้",
      });
    }
  };

  const handleAddProduct = (productId) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      const existingProduct = selectedProducts.find(
        (p) => p.productId === productId
      );
      if (existingProduct) {
        Swal.fire({
          icon: "warning",
          title: "แจ้งเตือน",
          text: "สินค้านี้ถูกเพิ่มในรายการแล้ว",
        });
        return;
      }
      setSelectedProducts((prev) => [
        ...prev,
        {
          productId: product._id,
          productName: product.productName,
          quantity: 1,
          purchasePrice: product.purchasePrice || 0,
          sellingPricePerUnit: product.sellingPricePerUnit,
          pack: false,
          subtotal: product.purchasePrice || 0,
          packSize: product.packSize
        },
      ]);
    }
  };

  const handleQuantityChange = (index, value) => {
    const newQuantity = parseInt(value) || 0;
    if (newQuantity <= 0) {
      setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
    } else {
      setSelectedProducts((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          quantity: newQuantity,
          subtotal: newQuantity * updated[index].purchasePrice,
        };
        return updated;
      });
    }
  };

  const toggleUnit = (index) => {
    setSelectedProducts((prev) => {
      const updated = [...prev];
      const newPack = !updated[index].pack;
      const product = products.find(p => p._id === updated[index].productId);
      
      if (product) {
        updated[index] = {
          ...updated[index],
          pack: newPack,
          purchasePrice: newPack ? product.purchasePrice * product.packSize : product.purchasePrice,
          sellingPricePerUnit: newPack ? product.sellingPricePerPack : product.sellingPricePerUnit,
          subtotal: updated[index].quantity * (newPack ? product.purchasePrice * product.packSize : product.purchasePrice),
          packSize: product.packSize
        };
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?._id) {
      Swal.fire({
        icon: "warning",
        title: "แจ้งเตือน",
        text: "กรุณาเข้าสู่ระบบก่อนทำรายการ",
      });
      return;
    }

    if (!formData.supplierId) {
      Swal.fire({
        icon: "warning",
        title: "แจ้งเตือน",
        text: "กรุณาเลือกซัพพลายเออร์",
      });
      return;
    }

    if (selectedProducts.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "แจ้งเตือน",
        text: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ",
      });
      return;
    }

    const invalidProducts = selectedProducts.filter(
      (product) => !product.quantity || !product.purchasePrice
    );

    if (invalidProducts.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "แจ้งเตือน",
        text: "กรุณากรอกจำนวนและราคาซื้อให้ครบถ้วน",
      });
      return;
    }

    setLoading(true);
    try {
      const purchaseOrderData = {
        supplierId: formData.supplierId,
        purchaseOrderDate:
          formData.purchaseOrderDate || new Date().toISOString(),
        products: selectedProducts.map((product) => ({
          productId: product.productId,
          productName: product.productName,
          quantity: product.quantity,
          purchasePrice: product.purchasePrice,
          sellingPricePerUnit: product.sellingPricePerUnit,
          subtotal: product.quantity * product.purchasePrice,
          pack: product.pack,
          packSize: product.packSize
        })),
        userId: user._id,
      };

      await purchaseOrderService.createPurchaseOrder(purchaseOrderData);
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "สร้างใบสั่งซื้อสำเร็จ",
      }).then(() => {
        navigate("/purchase-orders");
      });
    } catch (error) {
      console.error("Error creating purchase order:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: error.response?.data?.message || "ไม่สามารถสร้างใบสั่งซื้อได้",
      });
    }
    setLoading(false);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce(
      (sum, product) => sum + product.quantity * product.purchasePrice,
      0
    );
  };

  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                สร้างใบสั่งซื้อ
              </h1>
              <p className="text-gray-500 mt-1">
                กรอกข้อมูลเพื่อสร้างใบสั่งซื้อใหม่
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">วันที่</div>
              <div className="text-lg font-semibold text-gray-800">
                {new Date().toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* รายการสินค้าทั้งหมด */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[60vh] lg:h-[75vh] flex flex-col">
              
              <div className="flex-1 overflow-y-auto">
                <ProductList
                  products={filteredProducts}
                  onAdd={handleAddProduct}
                />
              </div>
            </div>
          </div>

          {/* รายการที่เลือก */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 h-[60vh] lg:h-[75vh] flex flex-col">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกซัพพลายเออร์
                </label>
                <select
                  id="create-po-supplier-select"
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                >
                  <option value="">เลือกซัพพลายเออร์</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.companyName ||
                        supplier.supplierName ||
                        supplier.name ||
                        "ไม่ระบุชื่อ"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {selectedProducts.map((product, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800">
                        {product.productName}
                      </h3>
                      <button
                        onClick={() =>
                          setSelectedProducts((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-3">
                        <label className="block text-sm text-black mb-1">
                          ราคาซื้อ
                        </label>
                        <input
                          type="number"
                          id={`create-po-purchaseprice-input-${index}`}
                          value={product.purchasePrice || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setSelectedProducts((prev) => {
                              const updated = [...prev];
                              updated[index] = {
                                ...updated[index],
                                purchasePrice: value,
                                subtotal: value * updated[index].quantity,
                              };
                              return updated;
                            });
                          }}
                          placeholder="0.00"
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-6">
                        <label className="block text-sm text-black mb-1">
                          จำนวน
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-300">
                            <button
                              onClick={() =>
                                handleQuantityChange(index, product.quantity - 1)
                              }
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={product.quantity}
                              onChange={(e) =>
                                handleQuantityChange(index, e.target.value)
                              }
                              className="w-12 text-center text-sm bg-transparent border-none focus:outline-none focus:ring-0"
                              min="0"
                            />
                            <button
                              onClick={() =>
                                handleQuantityChange(index, product.quantity + 1)
                              }
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">ชิ้น</span>
                            <button
                              onClick={() => toggleUnit(index)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                product.pack ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  product.pack ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className="text-xs text-gray-600">แพ็ค</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-black mb-4">รวม</span>
                          <span className="font-medium text-gray-800">
                            {(
                              product.quantity * (product.purchasePrice || 0)
                            ).toLocaleString()}{" "}
                            บาท
                          </span>
                        </div>
                      </div>
                      <div className="col-span-1">
                        {/* ช่องว่าง */}
                      </div>
                    </div>
                  </div>
                ))}
                {selectedProducts.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-700">
                        ยอดรวมทั้งสิ้น
                      </span>
                      <span className="text-2xl font-bold text-gray-800">
                        {selectedProducts
                          .reduce(
                            (sum, product) =>
                              sum +
                              product.quantity * (product.purchasePrice || 0),
                            0
                          )
                          .toLocaleString()}{" "}
                        บาท
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between gap-4">
                <button
                  id="create-po-cancel-button"
                  onClick={() => navigate("/purchase-orders")}
                  className="flex-1 p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  id="create-po-submit-button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "กำลังบันทึก..." : "บันทึกใบสั่งซื้อ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseOrder;
