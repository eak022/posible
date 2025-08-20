import { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPrint, FaPlus, FaTags } from "react-icons/fa";
import promotionService from "../../services/promotion.service";
import EditPromotionModal from "./EditPromotionModal";
import CreatePromotionModal from "./CreatePromotionModal";
import Swal from "sweetalert2"; // ไลบรารีสำหรับ popup
import { usePromotion } from "../../context/PromotionContext";


const PromotionPage = () => {
  const { promotions, setPromotions } = usePromotion();
  const [search, setSearch] = useState("");
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7); // แสดงกี่รายการต่อหน้า
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSinglePrintModalOpen, setIsSinglePrintModalOpen] = useState(false);
  const [selectedPromotionForPrint, setSelectedPromotionForPrint] = useState(null);
  const [printSettings, setPrintSettings] = useState({
    itemsPerPage: 4,
    includeAllActive: false,
    layout: 'grid' // เพิ่มตัวเลือกรูปแบบการจัดเรียง
  });
  const [singlePrintSettings, setSinglePrintSettings] = useState({
    quantity: 1,
    layout: 'single'
  });

  useEffect(() => {
    fetchPromotions();
    // โหลดการตั้งค่าการพิมพ์จาก localStorage
    const savedPrintSettings = localStorage.getItem('promotionPrintSettings');
    if (savedPrintSettings) {
      try {
        setPrintSettings(JSON.parse(savedPrintSettings));
      } catch (e) {
        console.error('Error loading print settings:', e);
      }
    }
  }, []);

  // บันทึกการตั้งค่าการพิมพ์ลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('promotionPrintSettings', JSON.stringify(printSettings));
  }, [printSettings]);

  const fetchPromotions = async () => {
    try {
      const data = await promotionService.getAllPromotions();
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      setPromotions([]);
    }
  };

  // พิมพ์บาร์โค้ดของโปรโมชัน (EAN-13) ด้วย JsBarcode จาก CDN
  const handlePrint = (promotion) => {
    try {
      const code = promotion?.barcode;
      if (!code || typeof code !== 'string') {
        Swal.fire({ icon: 'error', title: 'ไม่มีบาร์โค้ดของโปรโมชันนี้' });
        return;
      }

      const labelTitle = promotion?.promotionName || 'Promotion';
      const productName = promotion?.productId?.productName || '';
      const priceLine = promotion.discountedPrice != null ? `฿${promotion.discountedPrice}` : '';

      const w = window.open('', 'PRINT', 'width=420,height=600');
      if (!w) return;
      w.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Print Promotion Barcode</title>
            <style>
              @page { margin: 8mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 8px; }
              .label { width: 100%; text-align: center; }
              .title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
              .product { font-size: 12px; margin-bottom: 6px; }
              .price { font-size: 14px; color: #16a34a; font-weight: 700; margin: 4px 0 8px; }
              .code { font-size: 12px; letter-spacing: 1px; margin-top: 4px; }
              svg { width: 100%; max-width: 320px; height: 80px; margin: 0 auto; display: block; }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="title">${labelTitle.replace(/</g,'&lt;')}</div>
              ${productName ? `<div class="product">${productName.replace(/</g,'&lt;')}</div>` : ''}
              ${priceLine ? `<div class="price">${priceLine}</div>` : ''}
              <svg id="promo-barcode"></svg>
              <div class="code">${code}</div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
            <script>
              try {
                JsBarcode('#promo-barcode', '${code}', {
                  format: 'ean13',
                  displayValue: false,
                  lineColor: '#000',
                  width: 2,
                  height: 70,
                  margin: 0
                });
              } catch (e) {
                document.querySelector('#promo-barcode').outerHTML = '<div style="color:#b91c1c;font-size:12px">ไม่สามารถเรนเดอร์บาร์โค้ดได้</div>';
              }
              setTimeout(function() { window.print(); window.close(); }, 300);
            </script>
          </body>
        </html>
      `);
      w.document.close();
      w.focus();
    } catch (e) {
      console.error('Print error:', e);
      Swal.fire({ icon: 'error', title: 'พิมพ์ไม่สำเร็จ', text: e?.message || 'เกิดข้อผิดพลาด' });
    }
  };

  // พิมพ์บาร์โค้ดของโปรโมชันแต่ละรายการตามจำนวนที่เลือก
  const handlePrintSinglePromotion = (promotion, settings) => {
    try {
      const code = promotion?.barcode;
      if (!code || typeof code !== 'string') {
        Swal.fire({ icon: 'error', title: 'ไม่มีบาร์โค้ดของโปรโมชันนี้' });
        return;
      }

      const labelTitle = promotion?.promotionName || 'Promotion';
      const productName = promotion?.productId?.productName || '';
      const priceLine = promotion.discountedPrice != null ? `฿${promotion.discountedPrice}` : '';
      const quantity = settings.quantity;

      const w = window.open('', 'PRINT_SINGLE', 'width=800,height=600');
      if (!w) return;

      // คำนวณการจัดเรียง
      let cols, rows;
      if (settings.layout === 'grid') {
        cols = Math.ceil(Math.sqrt(quantity));
        rows = Math.ceil(quantity / cols);
      } else {
        cols = 1;
        rows = quantity;
      }

      w.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Print Promotion Barcode - ${labelTitle}</title>
            <style>
              @page { margin: 8mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 8px; }
              .page-header { 
                text-align: center; 
                margin-bottom: 16px; 
                font-size: 16px; 
                font-weight: bold; 
                color: #374151;
              }
              .page-info {
                text-align: center;
                margin-bottom: 12px;
                font-size: 12px;
                color: #6b7280;
              }
              .label { 
                ${settings.layout === 'grid' 
                  ? `width: calc(${100 / cols}% - 8px); 
                     display: inline-block; 
                     margin: 4px; 
                     vertical-align: top;`
                  : `width: 100%; 
                     display: block; 
                     margin: 8px 0;`
                }
                text-align: center; 
                padding: 8px; 
                border: 1px solid #ddd;
                box-sizing: border-box;
              }
              .title { font-size: ${settings.layout === 'grid' ? '10px' : '12px'}; font-weight: 700; margin-bottom: 2px; }
              .product { font-size: ${settings.layout === 'grid' ? '8px' : '10px'}; margin-bottom: 4px; }
              .price { font-size: ${settings.layout === 'grid' ? '10px' : '12px'}; color: #16a34a; font-weight: 700; margin: 2px 0 4px; }
              .code { font-size: ${settings.layout === 'grid' ? '8px' : '10px'}; letter-spacing: 1px; margin-top: 2px; }
              svg { 
                width: 100%; 
                max-width: ${settings.layout === 'grid' ? '120px' : '200px'}; 
                height: ${settings.layout === 'grid' ? '30px' : '50px'}; 
                margin: 0 auto; 
                display: block; 
              }
            </style>
          </head>
          <body>
            <div class="page-header">บาร์โค้ดโปรโมชัน: ${labelTitle}</div>
            <div class="page-info">จำนวน: ${quantity} อัน | รูปแบบ: ${settings.layout === 'grid' ? 'ตาราง' : 'รายการ'}</div>
      `);

      // สร้างบาร์โค้ดตามจำนวนที่เลือก
      for (let i = 0; i < quantity; i++) {
        w.document.write(`
          <div class="label">
            <div class="title">${labelTitle.replace(/</g,'&lt;')}</div>
            ${productName ? `<div class="product">${productName.replace(/</g,'&lt;')}</div>` : ''}
            ${priceLine ? `<div class="price">${priceLine}</div>` : ''}
            <svg id="promo-barcode-${i}"></svg>
            <div class="code">${code}</div>
          </div>
        `);
      }

      w.document.write(`
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
            <script>
              try {
                for (let i = 0; i < ${quantity}; i++) {
                  JsBarcode('#promo-barcode-' + i, '${code}', {
                    format: 'ean13',
                    displayValue: false,
                    lineColor: '#000',
                    width: ${settings.layout === 'grid' ? '1' : '1.5'},
                    height: ${settings.layout === 'grid' ? '25' : '40'},
                    margin: 0
                  });
                }
              } catch (e) {
                console.error('Barcode generation error:', e);
              }
              
              setTimeout(function() { 
                window.print(); 
                window.close(); 
              }, 500);
            </script>
          </body>
        </html>
      `);

      w.document.close();
      w.focus();
    } catch (e) {
      console.error('Print single error:', e);
      Swal.fire({ icon: 'error', title: 'พิมพ์ไม่สำเร็จ', text: e?.message || 'เกิดข้อผิดพลาด' });
    }
  };

  // พิมพ์บาร์โค้ดโปรโมชันทั้งหมดที่อยู่ในช่วงโปร
  const handlePrintAllPromotions = () => {
    try {
      const now = new Date();
      const activePromotions = promotions.filter(promotion => {
        if (printSettings.includeAllActive) {
          return promotion.barcode; // รวมทั้งหมดที่มีบาร์โค้ด
        }
        const startDate = new Date(promotion.validityStart);
        const endDate = new Date(promotion.validityEnd);
        return startDate <= now && now <= endDate && promotion.barcode;
      });

      if (activePromotions.length === 0) {
        Swal.fire({ icon: 'warning', title: 'ไม่มีโปรโมชันที่สามารถพิมพ์ได้', text: 'โปรโมชันทั้งหมดไม่มีบาร์โค้ดหรือหมดอายุแล้ว' });
        return;
      }

      const w = window.open('', 'PRINT_ALL', 'width=800,height=600');
      if (!w) return;

      const itemsPerPage = printSettings.itemsPerPage;
      const totalPages = Math.ceil(activePromotions.length / itemsPerPage);
      const layout = printSettings.layout;

      // คำนวณการจัดเรียงแบบตาราง
      const getGridLayout = (count) => {
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        return { cols, rows };
      };

      const { cols, rows } = getGridLayout(itemsPerPage);

      w.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Print All Promotion Barcodes</title>
            <style>
              @page { margin: 8mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 8px; }
              .page { page-break-after: always; }
              .page:last-child { page-break-after: avoid; }
              .label { 
                ${layout === 'grid' 
                  ? `width: calc(${100 / cols}% - 8px); 
                     display: inline-block; 
                     margin: 4px; 
                     vertical-align: top;`
                  : `width: 100%; 
                     display: block; 
                     margin: 8px 0;`
                }
                text-align: center; 
                padding: 8px; 
                border: 1px solid #ddd;
                box-sizing: border-box;
              }
              .title { font-size: ${layout === 'grid' ? '10px' : '12px'}; font-weight: 700; margin-bottom: 2px; }
              .product { font-size: ${layout === 'grid' ? '8px' : '10px'}; margin-bottom: 4px; }
              .price { font-size: ${layout === 'grid' ? '10px' : '12px'}; color: #16a34a; font-weight: 700; margin: 2px 0 4px; }
              .code { font-size: ${layout === 'grid' ? '8px' : '10px'}; letter-spacing: 1px; margin-top: 2px; }
              svg { 
                width: 100%; 
                max-width: ${layout === 'grid' ? '120px' : '200px'}; 
                height: ${layout === 'grid' ? '30px' : '50px'}; 
                margin: 0 auto; 
                display: block; 
              }
              .page-header { 
                text-align: center; 
                margin-bottom: 16px; 
                font-size: 16px; 
                font-weight: bold; 
                color: #374151;
              }
              .page-info {
                text-align: center;
                margin-bottom: 12px;
                font-size: 12px;
                color: #6b7280;
              }
            </style>
          </head>
          <body>
      `);

      // สร้างหน้าตามจำนวนที่กำหนด
      for (let page = 0; page < totalPages; page++) {
        const startIndex = page * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, activePromotions.length);
        const pagePromotions = activePromotions.slice(startIndex, endIndex);

        w.document.write(`<div class="page">`);
        w.document.write(`<div class="page-header">บาร์โค้ดโปรโมชัน</div>`);
        w.document.write(`<div class="page-info">หน้า ${page + 1} จาก ${totalPages} | ${pagePromotions.length} รายการ | รูปแบบ: ${layout === 'grid' ? 'ตาราง' : 'รายการ'}</div>`);
        
        pagePromotions.forEach((promotion, index) => {
          const labelTitle = promotion?.promotionName || 'Promotion';
          const productName = promotion?.productId?.productName || '';
          const priceLine = promotion.discountedPrice != null ? `฿${promotion.discountedPrice}` : '';
          const code = promotion.barcode;

          w.document.write(`
            <div class="label">
              <div class="title">${labelTitle.replace(/</g,'&lt;')}</div>
              ${productName ? `<div class="product">${productName.replace(/</g,'&lt;')}</div>` : ''}
              ${priceLine ? `<div class="price">${priceLine}</div>` : ''}
              <svg id="promo-barcode-${page}-${index}"></svg>
              <div class="code">${code}</div>
            </div>
          `);
        });

        w.document.write(`</div>`);
      }

      w.document.write(`
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
            <script>
              try {
                const activePromotions = ${JSON.stringify(activePromotions)};
                const itemsPerPage = ${itemsPerPage};
                const totalPages = ${totalPages};
                
                for (let page = 0; page < totalPages; page++) {
                  const startIndex = page * itemsPerPage;
                  const endIndex = Math.min(startIndex + itemsPerPage, activePromotions.length);
                  
                  for (let i = 0; i < endIndex - startIndex; i++) {
                    const promotion = activePromotions[startIndex + i];
                    if (promotion.barcode) {
                      JsBarcode('#promo-barcode-' + page + '-' + i, promotion.barcode, {
                        format: 'ean13',
                        displayValue: false,
                        lineColor: '#000',
                        width: ${layout === 'grid' ? '1' : '1.5'},
                        height: ${layout === 'grid' ? '25' : '40'},
                        margin: 0
                      });
                    }
                  }
                }
              } catch (e) {
                console.error('Barcode generation error:', e);
              }
              
              setTimeout(function() { 
                window.print(); 
                window.close(); 
              }, 500);
            </script>
          </body>
        </html>
      `);

      w.document.close();
      w.focus();
    } catch (e) {
      console.error('Print all error:', e);
      Swal.fire({ icon: 'error', title: 'พิมพ์ไม่สำเร็จ', text: e?.message || 'เกิดข้อผิดพลาด' });
    }
  };

  // ฟังก์ชันลบซัพพลายเออร์ พร้อมการยืนยันด้วย Swal
  const handleDelete = async (id) => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "เมื่อลบแล้วไม่สามารถกู้คืนได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await promotionService.deletePromotion(id); // เรียก API ลบ
          fetchPromotions(); // โหลดข้อมูลใหม่
          Swal.fire("ลบสำเร็จ!", "โปรโมชั่นถูกลบแล้ว", "success");
        } catch (error) {
          Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถลบโปรโมชั่นได้", "error");
        }
      }
    });
  };

  // เปิด modal การตั้งค่าการพิมพ์ของโปรโมชั่นแต่ละรายการ
  const openSinglePrintModal = (promotion) => {
    setSelectedPromotionForPrint(promotion);
    setSinglePrintSettings({
      quantity: 1,
      layout: 'single'
    });
    setIsSinglePrintModalOpen(true);
  };


  const openEditModal = (promotion) => {
    setSelectedPromotion(promotion);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPromotion(null);
    fetchPromotions();
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    fetchPromotions(); // โหลดข้อมูลโปรโมชั่นใหม่
  };

  // สร้าง array ที่ใส่ลำดับจริงก่อน
  const numberedPromotions = promotions
    .slice() // clone array
    .reverse() // ให้ลำดับล่าสุดอยู่บนสุด
    .map((promotion, index, arr) => ({
      ...promotion,
      realNumber: arr.length - index, // ใส่ลำดับจริงจากท้ายสุดขึ้นมา
    }));
  // ฟิลเตอร์ซัพพลายเออร์ตามคำค้นหา และเรียงจากรายการล่าสุดไปเก่าสุด
  const filteredPromotions = numberedPromotions.filter((promotion) => {
    const keyword = search.trim().toLowerCase();
    if (keyword === "") return true;

    // ค้นหาโดยเลขลำดับ (กรณีเป็นตัวเลข)
    if (/^\d+$/.test(keyword)) {
      return promotion.realNumber.toString() === keyword;
    }
    // ค้นหาโดยชื่อโปรโมชั่น
    return promotion.promotionName.toLowerCase().includes(keyword);
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPromotions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);

  return (
    <div className="p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">รายการโปรโมชั่น</h1>
          <div className="search-filter-container flex gap-2 items-center">
            <input 
              id="promotion-search-input" //เพิ่ม id
              type="text"
              placeholder="ค้นหาโปรโมชั่น..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button 
              id="print-all-promotions-button"
              onClick={() => setIsPrintModalOpen(true)}
              className="filter-button bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 px-4 py-2 rounded-lg"
              data-tip="ปริ้นบาร์โค้ดโปรโมชันทั้งหมด"
            >
              <FaPrint />
              <span>ปริ้นบาร์โค้ดทั้งหมด</span>
            </button>
            <button 
              id="create-promotion-button" //เพิ่ม id
              onClick={() => setIsCreateModalOpen(true)}
              className="filter-button bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 px-4 py-2 rounded-lg"
              data-tip="เพิ่มโปรโมชั่น"
            >
              <FaPlus />
              <span>เพิ่มโปรโมชั่น</span>
            </button>
          </div>
        </div>
        {/* Promotion Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-4 p-4 bg-purple-500 text-white font-semibold text-center">
            <div className="text-left pl-2">ลำดับ</div>
            <div className="text-left">ชื่อโปรโมชั่น</div>
            <div className="text-center">วันที่เริ่ม-สิ้นสุด</div>
            <div className="text-center">ราคาก่อนลด-หลังลด</div>
            <div className="text-center">จัดการ</div>
          </div>
          {currentItems.map((promotion, index) => (
            <div key={promotion._id} className="grid grid-cols-5 gap-4 px-4 py-3 border-b items-center group hover:bg-gray-100 transition-colors text-center">
              <div className="text-left pl-2 font-medium">{promotion.realNumber}</div>
              <div className="text-left ">{promotion.promotionName}</div>
              <div className="text-center">
                {new Date(promotion.validityStart).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} - {new Date(promotion.validityEnd).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-center pr-2">
                <span className="line-through text-red-500 mr-1">
                  ฿{promotion.productId?.sellingPricePerUnit ?? "-"}
                </span>
                <span className="text-green-500">
                  ฿{promotion.discountedPrice}
                </span>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  id={`edit-promotion-button-${index}`}
                  className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                  onClick={() => openEditModal(promotion)}
                  title="แก้ไข"
                >
                  <FaEdit />
                </button>
                <button
                  id={`delete-promotion-button-${index}`}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  onClick={() => handleDelete(promotion._id)}
                  title="ลบ"
                >
                  <FaTrash />
                </button>
                <button
                  id={`print-promotion-button-${index}`}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                  onClick={() => openSinglePrintModal(promotion)}
                  title="ปริ้น"
                >
                  <FaPrint />
                </button>
              </div>
            </div>
          ))}
          {filteredPromotions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบโปรโมชั่น
            </div>
          )}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex justify-end items-center gap-2 p-4">
              <button 
                id="promotion-prev-page" //เพิ่ม id
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
                id="promotion-next-page" //เพิ่ม id
                className="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                ถัดไป
              </button>
            </div>
          )}
        {isEditModalOpen && (
          <EditPromotionModal promotion={selectedPromotion} onClose={closeEditModal} />
        )}
        {isCreateModalOpen && (
          <CreatePromotionModal
            isOpen={isCreateModalOpen}
            onClose={closeCreateModal}
            fetchPromotions={fetchPromotions}
          />
        )}
        
        {/* Modal สำหรับตั้งค่าการปริ้นบาร์โค้ดโปรโมชันทั้งหมด */}
        {isPrintModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4 text-center">ตั้งค่าการปริ้นบาร์โค้ดโปรโมชัน</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  จำนวนบาร์โค้ดต่อหน้า
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 4, 6, 8, 10, 12, 15, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setPrintSettings({
                        ...printSettings,
                        itemsPerPage: count
                      })}
                      className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                        printSettings.itemsPerPage === count
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {count} อัน
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  เลือกจำนวนบาร์โค้ดที่จะแสดงใน 1 หน้า
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  รูปแบบการจัดเรียง
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPrintSettings({
                      ...printSettings,
                      layout: 'grid'
                    })}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      printSettings.layout === 'grid'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current rounded"></div>
                      <span>แบบตาราง</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setPrintSettings({
                      ...printSettings,
                      layout: 'list'
                    })}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      printSettings.layout === 'list'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-1 border-2 border-current rounded"></div>
                      <span>แบบรายการ</span>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={printSettings.includeAllActive}
                    onChange={(e) => setPrintSettings({
                      ...printSettings,
                      includeAllActive: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">รวมโปรโมชันที่หมดอายุแล้ว</span>
                </label>
              </div>

              {/* ปุ่มรีเซ็ตการตั้งค่า */}
              <div className="mb-6 text-center">
                <button
                  onClick={() => setPrintSettings({
                    itemsPerPage: 4,
                    includeAllActive: false,
                    layout: 'grid'
                  })}
                  className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  รีเซ็ตเป็นค่าเริ่มต้น
                </button>
              </div>
              
              {/* แสดงตัวอย่างการจัดเรียง */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">ตัวอย่างการจัดเรียง:</div>
                <div className="text-xs text-gray-600 mb-2">
                  {printSettings.layout === 'grid' ? (
                    <span>บาร์โค้ดจะจัดเรียงเป็นตาราง {Math.ceil(Math.sqrt(printSettings.itemsPerPage))} x {Math.ceil(printSettings.itemsPerPage / Math.ceil(Math.sqrt(printSettings.itemsPerPage)))}</span>
                  ) : (
                    <span>บาร์โค้ดจะจัดเรียงเป็นรายการแนวตั้ง {printSettings.itemsPerPage} อันต่อหน้า</span>
                  )}
                </div>
                
                {/* แสดงตัวอย่างการจัดเรียงแบบ visual */}
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-2">ตัวอย่าง:</div>
                  {printSettings.layout === 'grid' ? (
                    <div className="flex flex-col gap-1 items-center">
                      {Array.from({ length: Math.ceil(printSettings.itemsPerPage / 4) }, (_, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1">
                          {Array.from({ length: Math.min(4, printSettings.itemsPerPage - rowIndex * 4) }, (_, colIndex) => (
                            <div key={colIndex} className="w-3 h-3 bg-green-400 border border-green-600 rounded-sm"></div>
                          ))}
                        </div>
                      ))}
                      {printSettings.itemsPerPage > 16 && (
                        <div className="text-xs text-gray-500 mt-1">+{printSettings.itemsPerPage - 16} อัน</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 items-center">
                      {Array.from({ length: Math.min(printSettings.itemsPerPage, 6) }, (_, i) => (
                        <div key={i} className="w-8 h-2 bg-blue-400 border border-blue-600 rounded-sm"></div>
                      ))}
                      {printSettings.itemsPerPage > 6 && (
                        <div className="text-xs text-gray-500 mt-1">+{printSettings.itemsPerPage - 6} อัน</div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  จำนวนหน้าทั้งหมด: {Math.ceil(promotions.filter(p => p.barcode).length / printSettings.itemsPerPage)} หน้า
                </div>
                
                {/* แสดงข้อมูลสรุปการพิมพ์ */}
                <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                  <div className="text-xs text-gray-700 font-medium mb-1">ข้อมูลสรุป:</div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>• โปรโมชันที่มีบาร์โค้ด: {promotions.filter(p => p.barcode).length} รายการ</div>
                    <div>• โปรโมชันที่อยู่ในช่วงโปร: {promotions.filter(p => {
                      const now = new Date();
                      const startDate = new Date(p.validityStart);
                      const endDate = new Date(p.validityEnd);
                      return startDate <= now && now <= endDate && p.barcode;
                    }).length} รายการ</div>
                    <div>• จำนวนหน้าทั้งหมด: {Math.ceil(promotions.filter(p => p.barcode).length / printSettings.itemsPerPage)} หน้า</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    // แสดงข้อมูลสรุปก่อนพิมพ์
                    const activePromotions = promotions.filter(promotion => {
                      if (printSettings.includeAllActive) {
                        return promotion.barcode;
                      }
                      const now = new Date();
                      const startDate = new Date(promotion.validityStart);
                      const endDate = new Date(promotion.validityEnd);
                      return startDate <= now && now <= endDate && promotion.barcode;
                    });
                    
                    const totalPages = Math.ceil(activePromotions.length / printSettings.itemsPerPage);
                    
                    Swal.fire({
                      title: 'ยืนยันการพิมพ์',
                      html: `
                        <div class="text-left">
                          <p><strong>จำนวนโปรโมชันที่จะพิมพ์:</strong> ${activePromotions.length} รายการ</p>
                          <p><strong>จำนวนหน้าทั้งหมด:</strong> ${totalPages} หน้า</p>
                          <p><strong>รูปแบบการจัดเรียง:</strong> ${printSettings.layout === 'grid' ? 'ตาราง' : 'รายการ'}</p>
                          <p><strong>จำนวนต่อหน้า:</strong> ${printSettings.itemsPerPage} อัน</p>
                        </div>
                      `,
                      icon: 'info',
                      showCancelButton: true,
                      confirmButtonText: 'เริ่มพิมพ์',
                      cancelButtonText: 'ยกเลิก',
                      confirmButtonColor: '#10b981',
                      cancelButtonColor: '#6b7280'
                    }).then((result) => {
                      if (result.isConfirmed) {
                        handlePrintAllPromotions();
                        setIsPrintModalOpen(false);
                      }
                    });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FaPrint />
                  ปริ้น
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal สำหรับตั้งค่าการปริ้นบาร์โค้ดโปรโมชันแต่ละรายการ */}
        {isSinglePrintModalOpen && selectedPromotionForPrint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-center">ตั้งค่าการปริ้นบาร์โค้ด</h3>
              
              {/* แสดงข้อมูลโปรโมชันที่เลือก */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">โปรโมชันที่เลือก:</div>
                <div className="text-sm text-blue-700">{selectedPromotionForPrint.promotionName}</div>
                <div className="text-xs text-blue-600">
                  {selectedPromotionForPrint.productId?.productName && `สินค้า: ${selectedPromotionForPrint.productId.productName}`}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  จำนวนบาร์โค้ดที่จะพิมพ์
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setSinglePrintSettings({
                        ...singlePrintSettings,
                        quantity: count
                      })}
                      className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                        singlePrintSettings.quantity === count
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {count} อัน
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  รูปแบบการจัดเรียง
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSinglePrintSettings({
                      ...singlePrintSettings,
                      layout: 'single'
                    })}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      singlePrintSettings.layout === 'single'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-1 border-2 border-current rounded"></div>
                      <span>แบบรายการ</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSinglePrintSettings({
                      ...singlePrintSettings,
                      layout: 'grid'
                    })}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      singlePrintSettings.layout === 'grid'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current rounded"></div>
                      <span>แบบตาราง</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* แสดงตัวอย่างการจัดเรียง */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">ตัวอย่างการจัดเรียง:</div>
                <div className="text-xs text-gray-600 mb-2">
                  {singlePrintSettings.layout === 'grid' ? (
                    <span>บาร์โค้ดจะจัดเรียงเป็นตาราง {Math.ceil(Math.sqrt(singlePrintSettings.quantity))} x {Math.ceil(singlePrintSettings.quantity / Math.ceil(Math.sqrt(singlePrintSettings.quantity)))}</span>
                  ) : (
                    <span>บาร์โค้ดจะจัดเรียงเป็นรายการแนวตั้ง {singlePrintSettings.quantity} อัน</span>
                  )}
                </div>
                
                {/* แสดงตัวอย่างการจัดเรียงแบบ visual */}
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-2">ตัวอย่าง:</div>
                  {singlePrintSettings.layout === 'grid' ? (
                    <div className="flex flex-col gap-1 items-center">
                      {Array.from({ length: Math.ceil(singlePrintSettings.quantity / 4) }, (_, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1">
                          {Array.from({ length: Math.min(4, singlePrintSettings.quantity - rowIndex * 4) }, (_, colIndex) => (
                            <div key={colIndex} className="w-3 h-3 bg-green-400 border border-green-600 rounded-sm"></div>
                          ))}
                        </div>
                      ))}
                      {singlePrintSettings.quantity > 16 && (
                        <div className="text-xs text-gray-500 mt-1">+{singlePrintSettings.quantity - 16} อัน</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 items-center">
                      {Array.from({ length: Math.min(singlePrintSettings.quantity, 6) }, (_, i) => (
                        <div key={i} className="w-8 h-2 bg-blue-400 border border-blue-600 rounded-sm"></div>
                      ))}
                      {singlePrintSettings.quantity > 6 && (
                        <div className="text-xs text-gray-500 mt-1">+{singlePrintSettings.quantity - 6} อัน</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsSinglePrintModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    handlePrintSinglePromotion(selectedPromotionForPrint, singlePrintSettings);
                    setIsSinglePrintModalOpen(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FaPrint />
                  ปริ้น
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionPage;
