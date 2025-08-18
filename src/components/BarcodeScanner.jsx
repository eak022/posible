import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";
import Quagga from "quagga";

const BarcodeScanner = ({ isOpen, onClose, onBarcodeDetected }) => {
  const isInitialized = useRef(false);
  const hasEmitted = useRef(false); // ป้องกันยิงซ้ำทันที
  const lastDetectedRef = useRef({ code: null, ts: 0 }); // กันยิงซ้ำด้วยโค้ดเดิมในช่วงคูลดาวน์
  const COOLDOWN_MS = 15000; // เว้นระยะระหว่างการยิงซ้ำ 15 วินาที
  const [scanStatus, setScanStatus] = useState("idle"); // idle, scanning, success
  const scannerRef = useRef(null);

  // ตรวจสอบความถูกต้องของบาร์โค้ด
  const isValidBarcode = (code) => {
    return code.length >= 8 && code.length <= 13 && /^\d+$/.test(code);
  };

  useEffect(() => {
    if (isOpen) {
      hasEmitted.current = false; // reset เมื่อเปิดใหม่
      setScanStatus("scanning");

      // รอให้ element พร้อมก่อนเริ่มสแกน
      const initScanner = () => {
        if (!scannerRef.current) {
          console.error("ไม่พบ element สำหรับสแกนเนอร์");
          return;
        }

        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: scannerRef.current,
              constraints: {
                facingMode: { ideal: "environment" },
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                aspectRatio: { min: 1, max: 2 },
              },
            },
            decoder: {
              readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "code_39_reader",
              ],
              multiple: false,
            },
            locate: true,
            frequency: 1,
            numOfWorkers: 8,
            threshold: 0.9,
          },
          function (err) {
            if (err) {
              console.error("Quagga initialization error:", err);
              alert(
                "ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาตใช้งานกล้อง"
              );
              onClose();
              return;
            }
            isInitialized.current = true;
            Quagga.start();
          }
        );

        Quagga.onDetected((result) => {
          const code = result.codeResult.code;
          console.log("สแกนพบบาร์โค้ด:", code);

          if (isValidBarcode(code)) {
            const now = Date.now();
            // ถ้ายังอยู่ในช่วงคูลดาวน์ด้วยโค้ดเดิม ให้ข้าม
            if (lastDetectedRef.current.code === code && (now - lastDetectedRef.current.ts) < COOLDOWN_MS) {
              return;
            }

            if (hasEmitted.current) return; // กัน event ซ้อนในเฟรมใกล้เคียง
            hasEmitted.current = true;
            lastDetectedRef.current = { code, ts: now };
            setScanStatus("success");

            // ส่งข้อมูลบาร์โค้ดไปยัง parent component โดยไม่ปิด modal
            try { onBarcodeDetected(code); } catch (e) {}

            // กลับสู่สถานะ scanning อัตโนมัติ และปลดล็อกกันยิงซ้ำหลังจากหน่วงตามคูลดาวน์
            setTimeout(() => {
              setScanStatus("scanning");
              hasEmitted.current = false;
            }, COOLDOWN_MS);
          }
        });
      };

      // รอให้ DOM อัพเดทก่อนเริ่มต้นสแกนเนอร์
      setTimeout(initScanner, 100);
    }

    return () => {
      try { Quagga.offDetected(); } catch (e) {}
      if (isInitialized.current) {
        try { Quagga.stop(); } catch (e) {}
        isInitialized.current = false;
      }
      hasEmitted.current = false;
      lastDetectedRef.current = { code: null, ts: 0 };
    };
  }, [isOpen, onClose, onBarcodeDetected]);

  if (!isOpen) return null;

  // กำหนดสีตามสถานะ
  const borderColor =
    scanStatus === "scanning"
      ? "border-red-500"
      : scanStatus === "success"
      ? "border-green-500"
      : "border-gray-300";

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2147483647] flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">สแกนบาร์โค้ด</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <AiOutlineClose size={24} />
          </button>
        </div>

        <div className="relative">
          <div ref={scannerRef} className="relative w-full h-[300px]">
            <canvas className="absolute inset-0 w-full h-full"></canvas>
            <video className="absolute inset-0 w-full h-full"></video>
          </div>

          {/* กรอบสแกน */}
          <div
            className={`absolute inset-0 border-4 rounded-lg transition-colors duration-300 ${borderColor}`}
            style={{ width: "100%", height: "300px" }}
          ></div>

          {/* มุมกรอบ */}
          <div
            className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 transition-colors duration-300 ${borderColor}`}
          ></div>
          <div
            className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 transition-colors duration-300 ${borderColor}`}
          ></div>
          <div
            className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 transition-colors duration-300 ${borderColor}`}
          ></div>
          <div
            className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 transition-colors duration-300 ${borderColor}`}
          ></div>
        </div>

        <div className="mt-4 text-center">
          <p
            className={`text-lg font-medium transition-colors duration-300 ${
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
          <p className="text-sm text-gray-500 mt-1">กดปิดเพื่อยกเลิกการสแกน</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BarcodeScanner;
