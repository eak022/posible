import { useState, useEffect, useRef, useContext } from "react";
import productService from "../../services/product.service";
import Quagga from "quagga";
import { FaBarcode, FaQrcode, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { AiOutlineClose } from "react-icons/ai";
import { ProductContext } from "../../context/ProductContext";

const CreateProduct = () => {
  const navigate = useNavigate();
  const { setProducts } = useContext(ProductContext);
  const [formData, setFormData] = useState({
    productName: "",
    productDescription: "",
    productImage: "",
    categoryId: "",
    packSize: "",
    productStatus: "",
    barcodePack: "",
    barcodeUnit: "",
    quantity: "",
    purchasePrice: "",
    sellingPricePerUnit: "",
    sellingPricePerPack: "",
    expirationDate: "",
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScanType, setCurrentScanType] = useState(null);
  const scannerRef = useRef(null);
  const [scanStatus, setScanStatus] = useState("scanning");
  const [purchasePriceType, setPurchasePriceType] = useState("perUnit");
  const [priceWarning, setPriceWarning] = useState({ unit: false, pack: false });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productService.getAllCategories();
        setCategories(response.categories);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };

    fetchCategories();
  }, []);

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
    if (["packSize", "quantity", "purchasePrice", "sellingPricePerUnit", "sellingPricePerPack"].includes(name) && value !== "" && Number(value) < 0) {
      return;
    }
    setFormData({
      ...formData,
      [name]: value,
    });

    let purchasePrice = name === "purchasePrice" ? value : formData.purchasePrice;
    let sellingPricePerUnit = name === "sellingPricePerUnit" ? value : formData.sellingPricePerUnit;
    let sellingPricePerPack = name === "sellingPricePerPack" ? value : formData.sellingPricePerPack;
    if (purchasePriceType === "perPack" && formData.packSize > 0) {
      purchasePrice = (parseFloat(purchasePrice) / parseFloat(formData.packSize)).toFixed(2);
    }
    setPriceWarning({
      unit: sellingPricePerUnit !== "" && purchasePrice !== "" && Number(sellingPricePerUnit) < Number(purchasePrice),
      pack: sellingPricePerPack !== "" && purchasePrice !== "" && formData.packSize > 0 && Number(sellingPricePerPack) < Number(purchasePrice) * Number(formData.packSize)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

    let purchasePrice = formData.purchasePrice;
    if (purchasePriceType === "perPack") {
      const packSize = parseFloat(formData.packSize);
      if (packSize > 0) {
        purchasePrice = (parseFloat(formData.purchasePrice) / packSize).toFixed(2);
      }
    }

    const formDataToSend = new FormData();
    for (const key in formData) {
      if (key === "purchasePrice") {
        formDataToSend.append("purchasePrice", purchasePrice);
      } else {
        formDataToSend.append(key, formData[key]);
      }
    }

    try {
      const newProduct = await productService.createProduct(formDataToSend);
      Swal.fire({ icon: 'success', title: 'สร้างสินค้าสำเร็จ!' });
      
      // อัปเดต products context หลังจากสร้างสินค้าสำเร็จ
      const allProductsResponse = await productService.getAllProducts();
      const allProducts = allProductsResponse.data || allProductsResponse;
      setProducts(allProducts);
      
      setFormData({
        productName: "",
        productDescription: "",
        productImage: "",
        categoryId: "",
        packSize: "",
        productStatus: "",
        barcodePack: "",
        barcodeUnit: "",
        quantity: "",
        purchasePrice: "",
        sellingPricePerUnit: "",
        sellingPricePerPack: "",
        expirationDate: "",
      });
      setPurchasePriceType("perUnit");
      navigate("/product");
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ไม่สามารถสร้างสินค้าได้', text: 'กรุณาลองใหม่อีกครั้ง' });
    }
    setLoading(false);
  };

  const handleScanBarcode = (type) => {
    setCurrentScanType(type);
    setIsScanning(true);

    setTimeout(() => {
      if (scannerRef.current) {
        // Remove any existing listeners first
        Quagga.offDetected();

        // Add the event listener before initialization
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
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                aspectRatio: { min: 1, max: 2 },
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: 4,
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
            debug: {
              drawBoundingBox: true,
              showPattern: true,
              showSkeleton: true,
              showLabels: true,
              showPatch: true,
              showFoundPatches: true,
              showScanRegion: true,
              showGrid: true,
              showStrokes: true,
              showBinarized: true,
            },
            threshold: 0.9,
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
    setScanStatus("scanning");
  };

  const generateBarcode = (type) => {
    // สร้างตัวเลข 13 หลัก
    const barcode = Math.floor(Math.random() * 1000000000000)
      .toString()
      .padStart(13, "0");

    if (type === "unit") {
      setFormData((prev) => ({
        ...prev,
        barcodeUnit: barcode,
      }));
    } else if (type === "pack") {
      setFormData((prev) => ({
        ...prev,
        barcodePack: barcode,
      }));
    }
  };

  const handleCancel = () => {
    navigate("/product");
  };

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <div className="container mx-auto p-4 pb-20">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    name="productImage"
                    className="hidden"
                    id="create-product-image-input"
                    onChange={handleImageChange}
                  />
                  {!formData.productImage ? (
                    <label htmlFor="create-product-image-input" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center h-48">
                        <span className="text-4xl mb-2">+</span>
                        <span className="text-gray-500">เพิ่มรูปภาพ</span>
                        <span className="text-xs text-red-500 mt-2">
                          * โปรดเลือกภาพสินค้าจำนวน 1 รูป
                        </span>
                      </div>
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(formData.productImage)}
                        alt="Selected product"
                        className="w-4/5 mx-auto object-contain"
                        style={{ height: "400px" }}
                      />
                      <label
                        htmlFor="create-product-image-input"
                        className="absolute bottom-0 right-0 bg-gray-100 p-2 rounded-lg cursor-pointer hover:bg-gray-200"
                      >
                        <span className="text-sm">เปลี่ยนรูปภาพ</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label htmlFor="create-product-name-input" className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="create-product-name-input"
                    name="productName"
                    placeholder="* ชื่อสินค้า"
                    onChange={handleChange}
                    value={formData.productName}
                    required
                    className="w-full p-2 border rounded-lg"
                  />
                  <label htmlFor="create-product-description-input" className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดสินค้า</label>
                  <textarea
                    id="create-product-description-input"
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
                  <label htmlFor="create-product-category-select" className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่สินค้า <span className="text-red-500">*</span></label>
                  <select
                    id="create-product-category-select"
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
                        id="create-product-scan-barcode-pack-button"
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
                        id="create-product-generate-barcode-pack-button"
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
                        id="create-product-scan-barcode-unit-button"
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
                        id="create-product-generate-barcode-unit-button"
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
                    <label htmlFor="packSize" className="block text-sm font-medium text-gray-700 mb-1">จำนวนชิ้นที่มีใน 1 แพ็ค <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id="packSize"
                      name="packSize"
                      placeholder="* จำนวนชิ้นในแพ็ค"
                      onChange={handleChange}
                      value={formData.packSize}
                      required
                      className="w-full p-2 border rounded-lg"
                    />
                    <label htmlFor="create-product-quantity-input" className="block text-sm font-medium text-gray-700 mb-1">จำนวนสินค้าในสต็อก <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id="create-product-quantity-input"
                      name="quantity"
                      placeholder="* จำนวนสินค้า"
                      onChange={handleChange}
                      value={formData.quantity}
                      required
                      className="w-full p-2 border rounded-lg"
                    />
                    <label htmlFor="create-product-expirationdate-input" className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      id="create-product-expirationdate-input"
                      name="expirationDate"
                      onChange={handleChange}
                      value={formData.expirationDate}
                      required
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {/* Toggle ราคาซื้อ + ช่องกรอกราคาซื้อ */}
                  <div className="flex items-center gap-2 ml-1">
                    <label className="font-medium">ราคาซื้อ:</label>
                    <label className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer ${purchasePriceType === "perUnit" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                      <input
                        type="radio"
                        id="create-product-purchaseprice-type-unit"
                        name="purchasePriceType"
                        value="perUnit"
                        checked={purchasePriceType === "perUnit"}
                        onChange={() => setPurchasePriceType("perUnit")}
                        className="hidden"
                      />
                      <span>ต่อชิ้น</span>
                    </label>
                    <label className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer ${purchasePriceType === "perPack" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                      <input
                        type="radio"
                        id="create-product-purchaseprice-type-pack"
                        name="purchasePriceType"
                        value="perPack"
                        checked={purchasePriceType === "perPack"}
                        onChange={() => setPurchasePriceType("perPack")}
                        className="hidden"
                      />
                      <span>ต่อแพ็ค</span>
                    </label>
                    <input 
                      type="number"
                      id="create-product-purchaseprice-input"
                      name="purchasePrice"
                      placeholder={purchasePriceType === "perPack" ? "* ราคาซื้อต่อแพ็ค" : "* ราคาซื้อต่อชิ้น"}
                      onChange={handleChange}
                      value={formData.purchasePrice}
                      required
                      className="w-full p-2 border rounded-lg ml-10"
                      style={{ maxWidth: 230 }}
                    />
                  </div>
                  {/* ราคาขายต่อชิ้น/แพ็ค ในแถวเดียวกัน */}
                  <div className="grid grid-cols-2 gap-4">
                    <label htmlFor="create-product-sellingpriceperunit-input" className="block text-sm font-medium text-gray-700 mb-1">ราคาขายต่อชิ้น <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id="create-product-sellingpriceperunit-input"
                      name="sellingPricePerUnit"
                      placeholder="* ราคาขายต่อชิ้น"
                      onChange={handleChange}
                      value={formData.sellingPricePerUnit}
                      required
                      className="w-full p-2 border rounded-lg"
                      min="0"
                    />
                    <label htmlFor="create-product-sellingpriceperpack-input" className="block text-sm font-medium text-gray-700 mb-1">ราคาขายต่อแพ็ค <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id="create-product-sellingpriceperpack-input"
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
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                id="create-product-cancel-button"
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                id="create-product-submit-button"
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
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg w-[90%] max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">
                    สแกนบาร์โค้ด{" "}
                    {currentScanType === "unit" ? "ต่อชิ้น" : "ต่อแพ็ค"}
                  </h3>
                  <button
                    onClick={stopScanning}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <AiOutlineClose size={24} />
                  </button>
                </div>

                <div className="relative">
                  {/* กล้องสแกน */}
                  <div
                    ref={scannerRef}
                    className="relative w-full h-[300px] bg-black rounded-lg overflow-hidden"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 border-2 border-white opacity-50"></div>
                    </div>
                  </div>

                  {/* กรอบสแกน */}
                  <div
                    className={`absolute inset-0 border-4 rounded-lg transition-colors duration-300 ${
                      scanStatus === "scanning"
                        ? "border-red-500"
                        : scanStatus === "success"
                        ? "border-green-500"
                        : "border-gray-300"
                    }`}
                    style={{ width: "100%", height: "300px" }}
                  ></div>

                  {/* มุมกรอบ */}
                  <div
                    className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 transition-colors duration-300 ${
                      scanStatus === "scanning"
                        ? "border-red-500"
                        : scanStatus === "success"
                        ? "border-green-500"
                        : "border-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 transition-colors duration-300 ${
                      scanStatus === "scanning"
                        ? "border-red-500"
                        : scanStatus === "success"
                        ? "border-green-500"
                        : "border-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 transition-colors duration-300 ${
                      scanStatus === "scanning"
                        ? "border-red-500"
                        : scanStatus === "success"
                        ? "border-green-500"
                        : "border-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 transition-colors duration-300 ${
                      scanStatus === "scanning"
                        ? "border-red-500"
                        : scanStatus === "success"
                        ? "border-green-500"
                        : "border-gray-300"
                    }`}
                  ></div>
                </div>

                <div className="mt-4 text-center">
                  <p
                    className={`text-lg font-medium ${
                      scanStatus === "scanning"
                        ? "text-red-500"
                        : scanStatus === "success"
                        ? "text-green-500"
                        : "text-gray-600"
                    }`}
                  >
                    {scanStatus === "scanning"
                      ? "กำลังสแกนบาร์โค้ด..."
                      : scanStatus === "success"
                      ? "สแกนสำเร็จ!"
                      : "กรุณานำบาร์โค้ดมาสแกนในกรอบ"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    กดปิดเพื่อยกเลิกการสแกน
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
