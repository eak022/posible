import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import purchaseOrderService from "../../services/purchaseOrder.service";
import productService from "../../services/product.service";
import supplierService from "../../services/supplier.service";
import ProductList from "../../components/PurchaseOrder/ProductList";
import { FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import useAuthStore from "../../store/useAuthStore";
import { ProductContext } from "../../context/ProductContext";

const EditPurchaseOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { products, setProducts } = useContext(ProductContext);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [formData, setFormData] = useState({
    supplierId: "",
    purchaseOrderDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [productsResponse, suppliersResponse, purchaseOrderResponse] =
        await Promise.all([
          productService.getAllProducts(),
          supplierService.getAllSuppliers(),
          purchaseOrderService.getPurchaseOrderById(id),
        ]);

      console.log('Products Response:', productsResponse);
      console.log('Purchase Order Response:', purchaseOrderResponse);

      const formattedProducts = Array.isArray(productsResponse)
        ? productsResponse
        : productsResponse.products || [];

      const formattedSuppliers = Array.isArray(suppliersResponse)
        ? suppliersResponse
        : suppliersResponse.suppliers || [];

      setProducts(formattedProducts);
      setSuppliers(formattedSuppliers);
      setPurchaseOrder(purchaseOrderResponse);

      // ตั้งค่าข้อมูลใบสั่งของ
      if (purchaseOrderResponse.supplierId) {
        setFormData({
          supplierId:
            purchaseOrderResponse.supplierId._id ||
            purchaseOrderResponse.supplierId,
          purchaseOrderDate: new Date(purchaseOrderResponse.purchaseOrderDate)
            .toISOString()
            .split("T")[0],
        });
      }

      // ตั้งค่ารายการสินค้า
      const formattedSelectedProducts = purchaseOrderResponse.products.map((product) => {
        console.log('Processing product:', product);
        return {
          productId: product.productId._id || product.productId,
          productName: product.productName,
          orderedQuantity: product.orderedQuantity || product.quantity || 0,
          // ✅ ตอนแก้ไขใบสั่งของ: ใช้ราคาซื้อจากข้อมูลในใบสั่งของเลย (ไม่ดึงจากล็อตล่าสุด)
          // เพื่อรักษาราคาซื้อเดิมที่เคยตั้งไว้ในใบสั่งของ
          estimatedPrice: product.estimatedPrice || 0,
          deliveredQuantity: product.deliveredQuantity || 0,
          actualPrice: product.actualPrice || null,
          deliveryDate: product.deliveryDate || null,
          deliveryNotes: product.deliveryNotes || "",
          sellingPricePerUnit: product.sellingPricePerUnit,
          pack: Boolean(product.pack),
          expirationDate: product.expirationDate
            ? new Date(product.expirationDate).toISOString().split("T")[0]
            : "",
          subtotal: (product.orderedQuantity || product.quantity || 0) * (product.estimatedPrice || 0),
          packSize: product.packSize
        };
      });

      console.log('Formatted Selected Products:', formattedSelectedProducts);
      setSelectedProducts(formattedSelectedProducts);
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

      // ✅ ตอนแก้ไขใบสั่งของ: ไม่ดึงราคาซื้อจากล็อตล่าสุด ให้ผู้ใช้กรอกเอง
      // หรือใช้ราคาขายเป็นค่าเริ่มต้น เพื่อรักษาราคาซื้อเดิมที่เคยตั้งไว้ในใบสั่งของ
      const defaultPrice = product.sellingPricePerPack || product.sellingPricePerUnit || 0;

      setSelectedProducts((prev) => [
        ...prev,
        {
          productId: product._id,
          productName: product.productName,
          orderedQuantity: 1,
          estimatedPrice: defaultPrice,
          deliveredQuantity: 0,
          actualPrice: null,
          deliveryDate: null,
          deliveryNotes: "",
          sellingPricePerUnit: product.sellingPricePerPack || product.sellingPricePerUnit,
          pack: true,
          expirationDate: "",
          subtotal: defaultPrice,
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
          orderedQuantity: newQuantity,
          subtotal: newQuantity * updated[index].estimatedPrice,
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
        // ดึงราคาซื้อจากล็อตล่าสุด โดยไม่สนใจสถานะของล็อต
        let latestPurchasePrice = 0;
        if (product.lots && product.lots.length > 0) {
          // เรียงล็อตตาม receivedDate จากใหม่ไปเก่า (รวมทุกสถานะ)
          const sortedLots = [...product.lots].sort((a, b) => 
            new Date(b.receivedDate) - new Date(a.receivedDate)
          );
          // ใช้ราคาซื้อจากล็อตล่าสุด ไม่ว่าจะเป็นล็อตที่หมดอายุ หมดสต็อก หรือตัดจำหน่าย
          latestPurchasePrice = sortedLots[0].purchasePrice;
        } else {
          latestPurchasePrice = product.purchasePrice || 0;
        }

        // ✅ คำนวณราคาซื้อตามการเลือกแพ็ค/ชิ้น
        const estimatedPrice = newPack ? latestPurchasePrice * product.packSize : latestPurchasePrice;
        
        updated[index] = {
          ...updated[index],
          pack: newPack,
          estimatedPrice: estimatedPrice, // ✅ ราคาซื้อตามการเลือกแพ็ค/ชิ้น
          sellingPricePerUnit: newPack ? product.sellingPricePerPack : product.sellingPricePerUnit,
          subtotal: updated[index].orderedQuantity * estimatedPrice, // ✅ คำนวณจากราคาที่เลือก
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
      (product) => !product.orderedQuantity || !product.estimatedPrice
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
      const updateData = {
        supplierId: formData.supplierId,
        purchaseOrderDate: formData.purchaseOrderDate,
        products: selectedProducts.map((product) => ({
          productId: product.productId,
          productName: product.productName,
          orderedQuantity: product.orderedQuantity,
          estimatedPrice: product.estimatedPrice,
          deliveredQuantity: product.deliveredQuantity,
          actualPrice: product.actualPrice,
          deliveryDate: product.deliveryDate,
          deliveryNotes: product.deliveryNotes,
          sellingPricePerUnit: product.sellingPricePerUnit,
          expirationDate: product.expirationDate,
          subtotal: product.orderedQuantity * product.estimatedPrice,
          pack: product.pack,
          packSize: product.packSize
        })),
      };

      await purchaseOrderService.updatePurchaseOrder(id, updateData);
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "แก้ไขใบสั่งของสำเร็จ",
      }).then(() => {
        navigate("/purchase-orders");
      });
    } catch (error) {
      console.error("Error updating purchase order:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: error.response?.data?.message || "ไม่สามารถแก้ไขใบสั่งของได้",
      });
    }
    setLoading(false);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce(
      (sum, product) => sum + product.orderedQuantity * product.estimatedPrice,
      0
    );
  };

  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!purchaseOrder) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                แก้ไขใบสั่งของ #{purchaseOrder?.orderNumber || id}
              </h1>
              <p className="text-gray-500 mt-1">แก้ไขข้อมูลใบสั่งของ</p>
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

        <div className="grid grid-cols-12 gap-6">
          {/* รายการสินค้าทั้งหมด */}
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-[calc(100vh-300px)] overflow-y-auto">
                <ProductList
                  products={filteredProducts}
                  onAdd={handleAddProduct}
                />
              </div>
            </div>
          </div>

          {/* รายการที่เลือก */}
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 h-[calc(100vh-300px)] flex flex-col">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกซัพพลายเออร์
                </label>
                <select
                  id="edit-po-supplier-select"
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
                          id={`edit-po-purchaseprice-input-${index}`}
                          value={product.estimatedPrice || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setSelectedProducts((prev) => {
                              const updated = [...prev];
                              updated[index] = {
                                ...updated[index],
                                estimatedPrice: value,
                                subtotal: value * updated[index].orderedQuantity,
                              };
                              return updated;
                            });
                          }}
                          placeholder="0.00"
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="block text-sm text-black mb-1">
                          จำนวน
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-300">
                            <button
                              onClick={() =>
                                handleQuantityChange(index, product.orderedQuantity - 1)
                              }
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={product.orderedQuantity}
                              onChange={(e) =>
                                handleQuantityChange(index, e.target.value)
                              }
                              className="w-12 text-center text-sm bg-transparent border-none focus:outline-none focus:ring-0"
                              min="0"
                            />
                            <button
                              onClick={() =>
                                handleQuantityChange(index, product.orderedQuantity + 1)
                              }
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-600 whitespace-nowrap">ชิ้น</span>
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
                            <span className="text-xs text-gray-600 whitespace-nowrap">แพ็ค</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-black mb-4">รวม</span>
                          <span className="font-medium text-gray-800">
                            {(
                              product.orderedQuantity * (product.estimatedPrice || 0)
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
                      <div>
                        <span className="text-lg font-medium text-gray-700">
                          ยอดรวมทั้งสิ้น
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-gray-800">
                        {selectedProducts
                          .reduce(
                            (sum, product) =>
                              sum +
                              product.orderedQuantity * (product.estimatedPrice || 0),
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
                  id="edit-po-cancel-button"
                  onClick={() => navigate("/purchase-orders")}
                  className="flex-1 p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  id="edit-po-submit-button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "กำลังบันทึก..." : "บันทึกใบสั่งของ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPurchaseOrder;
