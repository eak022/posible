import { useState, useEffect, useRef, useContext } from "react";
import productService from "../../services/product.service";
import Quagga from "quagga";
import { FaBarcode, FaQrcode, FaTimes } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { ProductContext } from "../../context/ProductContext";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { setProducts } = useContext(ProductContext);
  const [formData, setFormData] = useState({
    productName: "",
    productDescription: "",
    productImage: "",
    categoryId: "",
    packSize: "",
    productStatuses: [],
    barcodePack: "",
    barcodeUnit: "",
    quantity: "",
    purchasePrice: "",
    sellingPricePerUnit: "",
    sellingPricePerPack: "",
    expirationDate: "",
    purchasePriceType: "perUnit",
  });

  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [originalStatuses, setOriginalStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScanType, setCurrentScanType] = useState(null);
  const scannerRef = useRef(null);
  const [priceWarning, setPriceWarning] = useState({ unit: false, pack: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) {
          Swal.fire({ icon: 'error', title: 'ไม่พบ ID ของสินค้า' });
          return;
        }

        const productResponse = await productService.getProductById(id);
        console.log("Product Response:", productResponse);

        if (!productResponse || !productResponse._id) {
          Swal.fire({ icon: 'error', title: 'ไม่พบข้อมูลสินค้า' });
          return;
        }

        const [categoriesResponse, statusesResponse] = await Promise.all([
          productService.getAllCategories(),
          productService.getAllStatuses(),
        ]);

        const product = productResponse;
        console.log("Product Data:", product);

        setOriginalStatuses(product.productStatuses || []);

        setFormData({
          productName: product.productName || "",
          productDescription: product.productDescription || "",
          productImage: product.productImage || "",
          categoryId: product.categoryId?._id || "",
          packSize: product.packSize || "",
          productStatuses: product.productStatuses || [],
          barcodePack: product.barcodePack || "",
          barcodeUnit: product.barcodeUnit || "",
          quantity: product.quantity || "",
          purchasePrice: product.purchasePrice || "",
          sellingPricePerUnit: product.sellingPricePerUnit || "",
          sellingPricePerPack: product.sellingPricePerPack || "",
          expirationDate: product.expirationDate
            ? new Date(product.expirationDate).toISOString().split("T")[0]
            : "",
          purchasePriceType: product.purchasePriceType || "perUnit",
        });

        if (categoriesResponse && categoriesResponse.categories) {
          setCategories(categoriesResponse.categories);
        }
        if (statusesResponse && statusesResponse.statuses) {
          setStatuses(statusesResponse.statuses);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
        Swal.fire({ icon: 'error', title: 'ไม่สามารถโหลดข้อมูลได้' });
        setTimeout(() => {
          navigate("/product");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    return () => {
      if (isScanning) {
        Quagga.stop();
      }
    };
  }, [isScanning]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, productImage: file });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ป้องกันการกรอกค่าติดลบ
    if (["packSize", "quantity", "purchasePrice", "sellingPricePerUnit", "sellingPricePerPack"].includes(name) && value !== "" && Number(value) < 0) {
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // ตรวจสอบราคาขายไม่ให้ต่ำกว่าราคาซื้อ
    let purchasePrice = name === "purchasePrice" ? value : formData.purchasePrice;
    let sellingPricePerUnit = name === "sellingPricePerUnit" ? value : formData.sellingPricePerUnit;
    let sellingPricePerPack = name === "sellingPricePerPack" ? value : formData.sellingPricePerPack;
    let packSize = name === "packSize" ? value : formData.packSize;
    
    setPriceWarning({
      unit: sellingPricePerUnit !== "" && purchasePrice !== "" && Number(sellingPricePerUnit) < Number(purchasePrice),
      pack: sellingPricePerPack !== "" && purchasePrice !== "" && packSize > 0 && Number(sellingPricePerPack) < Number(purchasePrice) * Number(packSize)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (Number(formData.packSize) < 0 || Number(formData.quantity) < 0 || Number(formData.purchasePrice) < 0 || Number(formData.sellingPricePerUnit) < 0 || Number(formData.sellingPricePerPack) < 0) {
      Swal.fire({ icon: 'error', title: 'ห้ามกรอกค่าติดลบ!' });
      setLoading(false);
      return;
    }
    
    if (priceWarning.unit || priceWarning.pack) {
      Swal.fire({ icon: 'error', title: 'ราคาขายต้องไม่ต่ำกว่าราคาซื้อ!' });
      setLoading(false);
      return;
    }

    // Validation วันที่หมดอายุ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expirationDate = new Date(formData.expirationDate);
    if (expirationDate <= today) {
      Swal.fire({ icon: 'error', title: 'วันหมดอายุต้องมากกว่าวันปัจจุบัน!' });
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'productStatuses') {
        const statusesToSend = formData[key].length > 0 ? formData[key] : originalStatuses;
        statusesToSend.forEach(status => {
          formDataToSend.append('productStatuses', status._id || status);
        });
      } else {
      formDataToSend.append(key, formData[key]);
    }
    });

    try {
      await productService.updateProduct(id, formDataToSend);
      Swal.fire({ icon: 'success', title: 'อัปเดตสินค้าสำเร็จ!' });
      
      // อัปเดต products context หลังจากแก้ไขสินค้าสำเร็จ
      const allProductsResponse = await productService.getAllProducts();
      const allProducts = allProductsResponse.data || allProductsResponse;
      setProducts(allProducts);
      
      navigate("/product");
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ไม่สามารถอัปเดตสินค้าได้', text: 'กรุณาลองใหม่อีกครั้ง' });
    }
    setLoading(false);
  };

  const handleScanBarcode = (type) => {
    setCurrentScanType(type);
    setIsScanning(true);

    setTimeout(() => {
      if (scannerRef.current) {
        Quagga.offDetected();

        Quagga.onDetected((result) => {
          if (result && result.codeResult && result.codeResult.code) {
            console.log("Barcode detected:", result.codeResult.code);
            handleBarcodeDetected(result.codeResult.code, type);
            stopScanning();
          }
        });

        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: scannerRef.current,
              constraints: {
                facingMode: "environment",
                width: 640,
                height: 480,
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: 2,
            frequency: 10,
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "upc_reader",
                "upc_e_reader",
              ],
            },
            locate: true,
          },
          function (err) {
            if (err) {
              console.error("Quagga initialization failed:", err);
              return;
            }
            console.log("Quagga initialization succeeded");
            Quagga.start();
          }
        );
      }
    }, 100);
  };

  const handleBarcodeDetected = (code, type) => {
    console.log("Handling barcode:", code, "for type:", type);
    if (type === "unit") {
      setFormData((prev) => ({
        ...prev,
        barcodeUnit: code,
      }));
    } else if (type === "pack") {
      setFormData((prev) => ({
        ...prev,
        barcodePack: code,
      }));
    }
  };

  const stopScanning = () => {
    try {
      Quagga.offDetected();
      Quagga.stop();
    } catch (error) {
      console.error("Error stopping Quagga:", error);
    }
    setIsScanning(false);
    setCurrentScanType(null);
  };

  const generateBarcode = (type) => {
    const barcode = Math.floor(Math.random() * 1000000);

    if (type === "unit") {
      setFormData({
        ...formData,
        barcodeUnit: `UNIT-${barcode}`,
      });
    } else if (type === "pack") {
      setFormData({
        ...formData,
        barcodePack: `PACK-${barcode}`,
      });
    }
  };

  const handleCancel = () => {
    navigate("/product");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <div className="container mx-auto p-4 pb-20">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center">
                  <input
                    type="file"
                    name="productImage"
                    className="hidden"
                    id="edit-product-image-input"
                    onChange={handleImageChange}
                  />
                  {!formData.productImage ? (
                    <label htmlFor="edit-product-image-input" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center h-24">
                        <span className="text-2xl mb-1">+</span>
                        <span className="text-sm text-gray-500">
                          เพิ่มรูปภาพ
                        </span>
                        <span className="text-xs text-red-500 mt-2">
                          * โปรดเลือกภาพสินค้าจำนวน 1 รูป
                        </span>
                      </div>
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={
                          typeof formData.productImage === "string"
                            ? formData.productImage
                            : URL.createObjectURL(formData.productImage)
                        }
                        alt="Selected product"
                        className="w-4/5 mx-auto object-contain"
                        style={{ height: "400px" }}
                      />
                      <label
                        htmlFor="edit-product-image-input"
                        className="absolute bottom-0 right-0 bg-gray-100 p-2 rounded-lg cursor-pointer hover:bg-gray-200"
                      >
                        <span className="text-sm">เปลี่ยนรูปภาพ</span>
                      </label>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <label htmlFor="edit-product-name-input" className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="edit-product-name-input"
                    name="productName"
                    placeholder="* ชื่อสินค้า"
                    onChange={handleChange}
                    value={formData.productName}
                    required
                    className="w-full p-2 border rounded-lg"
                  />
                  <label htmlFor="edit-product-description-input" className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดสินค้า</label>
                  <textarea
                    id="edit-product-description-input"
                    name="productDescription"
                    placeholder="รายละเอียดสินค้า"
                    className="w-full p-2 border rounded-lg h-32"
                    onChange={handleChange}
                    value={formData.productDescription}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <label htmlFor="edit-product-category-select" className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่สินค้า <span className="text-red-500">*</span></label>
                  <select
                    id="edit-product-category-select"
                    name="categoryId"
                    onChange={handleChange}
                    value={formData.categoryId}
                    required
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">* ประเภทสินค้า</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Barcode Section */}
                <div className="space-y-4">
                  <div className="mb-2">
                    <label htmlFor="barcodePack" className="block text-sm font-medium text-gray-700 mb-1">บาร์โค้ดแพ็ค <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        name="barcodePack"
                        id="barcodePack"
                        placeholder="* บาร์โค้ดแพ็ค"
                        onChange={handleChange}
                        value={formData.barcodePack}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        id="edit-product-scan-barcode-pack-button"
                        onClick={() => handleScanBarcode("pack")}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 relative group"
                        tabIndex={-1}
                      >
                        <FaQrcode className="text-blue-600" />
                        <span className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          สแกนบาร์โค้ดแพ็ค
                        </span>
                      </button>
                      <button
                        type="button"
                        id="edit-product-generate-barcode-pack-button"
                        onClick={() => generateBarcode("pack")}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 relative group"
                        tabIndex={-1}
                      >
                        <FaBarcode className="text-green-600" />
                        <span className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          สร้างบาร์โค้ดแพ็ค
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label htmlFor="barcodeUnit" className="block text-sm font-medium text-gray-700 mb-1">บาร์โค้ดชิ้น <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        name="barcodeUnit"
                        id="barcodeUnit"
                        placeholder="* บาร์โค้ดชิ้น"
                        onChange={handleChange}
                        value={formData.barcodeUnit}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        id="edit-product-scan-barcode-unit-button"
                        onClick={() => handleScanBarcode("unit")}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 relative group"
                        tabIndex={-1}
                      >
                        <FaQrcode className="text-blue-600" />
                        <span className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          สแกนบาร์โค้ดชิ้น
                        </span>
                      </button>
                      <button
                        type="button"
                        id="edit-product-generate-barcode-unit-button"
                        onClick={() => generateBarcode("unit")}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 relative group"
                        tabIndex={-1}
                      >
                        <FaBarcode className="text-green-600" />
                        <span className="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          สร้างบาร์โค้ดชิ้น
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Additional Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label htmlFor="edit-product-packsize-input" className="block text-sm font-medium text-gray-700 mb-1">จำนวนชิ้นที่มีใน 1 แพ็ค <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id="edit-product-packsize-input"
                      name="packSize"
                      placeholder="* จำนวนสินค้า ( ชิ้น/แพ็ค )"
                      onChange={handleChange}
                      value={formData.packSize}
                      required
                      className="w-full p-2 border rounded-lg"
                    />
                    <label htmlFor="edit-product-quantity-input" className="block text-sm font-medium text-gray-700 mb-1">จำนวนสินค้าในสต็อก <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id="edit-product-quantity-input"
                      name="quantity"
                      placeholder="* จำนวนสินค้า"
                      onChange={handleChange}
                      value={formData.quantity}
                      required
                      className="w-full p-2 border rounded-lg"
                    />
                    <label htmlFor="edit-product-purchaseprice-input" className="block text-sm font-medium text-gray-700 mb-1">ราคาซื้อ <span className="text-red-500">*</span></label>
                    <input 
                      type="number"
                      id="edit-product-purchaseprice-input"
                      name="purchasePrice"
                      placeholder="* ราคาซื้อ"
                      onChange={handleChange}
                      value={formData.purchasePrice}
                      required
                      className="w-full p-2 border rounded-lg"
                    />
                    <label htmlFor="edit-product-expirationdate-input" className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      id="edit-product-expirationdate-input"
                      name="expirationDate"
                      onChange={handleChange}
                      value={formData.expirationDate}
                      required
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label htmlFor="edit-product-sellingpriceperunit-input" className="block text-sm font-medium text-gray-700 mb-1">ราคาขายต่อชิ้น <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id="edit-product-sellingpriceperunit-input"
                      name="sellingPricePerUnit"
                      placeholder="* ราคาขายต่อชิ้น"
                      onChange={handleChange}
                      value={formData.sellingPricePerUnit}
                      required
                      className="w-full p-2 border rounded-lg"
                      min="0"
                    />
                    <label htmlFor="edit-product-sellingpriceperpack-input" className="block text-sm font-medium text-gray-700 mb-1">ราคาขายต่อแพ็ค <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id="edit-product-sellingpriceperpack-input"
                      name="sellingPricePerPack"
                      placeholder="* ราคาขายต่อแพ็ค"
                      onChange={handleChange}
                      value={formData.sellingPricePerPack}
                      required
                      className="w-full p-2 border rounded-lg"
                      min="0"
                    />
                  </div>
                  {/* ข้อความเตือนราคาขาย */}
                  {(priceWarning.unit || priceWarning.pack) && (
                    <div className="text-xs text-red-500 mt-1">
                      {priceWarning.unit && "ราคาขายต่อชิ้นต้องไม่ต่ำกว่าราคาซื้อ"}
                      {priceWarning.unit && priceWarning.pack && " และ "}
                      {priceWarning.pack && "ราคาขายต่อแพ็คต้องไม่ต่ำกว่าราคาซื้อรวมต่อแพ็ค"}
                    </div>
                  )}
                </div>
                {/* Field เฉพาะ EditProduct */}
                {formData.productStatuses && formData.productStatuses.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะปัจจุบัน
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.productStatuses.map((status, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-sm rounded-full"
                          style={{
                            backgroundColor: status.statusColor || '#E0E0E0',
                            color: status.statusColor ? 'white' : 'black'
                          }}
                        >
                          {status.statusName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกสถานะใหม่ (ถ้าต้องการเปลี่ยน)
                  </label>
                  <select
                    multiple
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.productStatuses.map(status => status._id || status)}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({
                        ...formData,
                        productStatuses: selectedOptions
                      });
                    }}
                  >
                    {statuses.map((status) => (
                      <option key={status._id} value={status._id}>
                        {status.statusName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    * ถ้าไม่เลือกสถานะใหม่ ระบบจะใช้สถานะเดิม
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                id="edit-product-cancel-button"
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                id="edit-product-submit-button"
                type="submit"
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                disabled={loading}
              >
                {loading ? "กำลังบันทึก..." : "บันทึกสินค้า"}
              </button>
            </div>
          </form>

          {/* Scanner Modal */}
          {isScanning && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    สแกนบาร์โค้ด{" "}
                    {currentScanType === "unit" ? "ต่อชิ้น" : "ต่อแพ็ค"}
                  </h3>
                  <button
                    onClick={stopScanning}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <FaTimes className="text-gray-600" />
                  </button>
                </div>
                <div
                  ref={scannerRef}
                  className="bg-black rounded-lg overflow-hidden"
                  style={{
                    height: "400px",
                    position: "relative",
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-white opacity-50"></div>
                  </div>
                </div>
                <p className="text-center mt-4 text-gray-600">
                  จัดตำแหน่งบาร์โค้ดให้อยู่ในกรอบเพื่อสแกน
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
