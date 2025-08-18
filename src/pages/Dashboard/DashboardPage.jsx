import React, { useState , useEffect} from "react";
import { FaChartLine, FaBox, FaHistory, FaCogs, FaArrowUp, FaArrowDown, FaShoppingCart, FaDollarSign, FaMoneyBillWave, FaFileInvoiceDollar } from "react-icons/fa";
import { orderService } from "../../services";
import { generateOrderNumber } from "../../utils/orderUtils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { useProduct } from "../../context/ProductContext";
import { usePurchaseOrder } from "../../context/PurchaseOrderContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(7);
  const [showBest, setShowBest] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const { products: allProducts } = useProduct();
  const { purchaseOrders, setPurchaseOrders } = usePurchaseOrder();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getOrders();
      setOrders(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  };

  // ฟังก์ชันช่วยเช็คว่าวันที่ตรงกับ selectedDate หรือไม่
  const isSelectedDay = (date) => {
    if (!selectedDate) return true;
    const d = new Date(date);
    return d.toISOString().slice(0, 10) === selectedDate;
  };

  // Filter orders และ purchaseOrders ตาม selectedDate
  const filteredOrders = orders.filter(order => isSelectedDay(order.orderDate) && order.orderStatus === "ขายสำเร็จ");
  const filteredPurchaseOrders = purchaseOrders.filter(po => isSelectedDay(po.purchaseOrderDate) && po.status === "completed");

  // คำนวณสถิติต่างๆ (ใช้ filteredOrders/filteredPurchaseOrders แทน)
  const totalSales = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalProfit = filteredOrders.reduce((sum, order) => {
    const profit = order.products.reduce((productSum, product) => {
      return productSum + ((product.sellingPricePerUnit - product.purchasePrice) * product.quantity);
    }, 0);
    return sum + profit;
  }, 0);
  const totalExpense = filteredPurchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0);

  // หาสินค้าขายดี/ไม่ดี (ใช้ filteredOrders)
  const bestSellingProducts = filteredOrders
    .flatMap(order => order.products)
    .reduce((acc, product) => {
      const existing = acc.find(p => p.productName === product.productName);
      if (existing) {
        if (product.pack) {
          existing.packCount = (existing.packCount || 0) + product.quantity;
          existing.packSize = product.packSize || existing.packSize || 1;
        } else {
          existing.unitCount = (existing.unitCount || 0) + product.quantity;
        }
      } else {
        acc.push({
          ...product,
          packCount: product.pack ? product.quantity : 0,
          unitCount: !product.pack ? product.quantity : 0,
          packSize: product.packSize || 1
        });
      }
      return acc;
    }, [])
    .sort((a, b) => ((b.unitCount || 0) + (b.packCount || 0)) - ((a.unitCount || 0) + (a.packCount || 0)))
    .slice(0, 3);

  const worstSellingProducts = React.useMemo(() => {
    if (!allProducts.length) return [];
    // รวมยอดขายแต่ละสินค้า
    const salesMap = {};
    filteredOrders.forEach(order => {
      order.products.forEach(product => {
        if (!salesMap[product.productName]) {
          salesMap[product.productName] = { unitCount: 0, packCount: 0, packSize: product.packSize || 1, sellingPricePerUnit: product.sellingPricePerUnit, sellingPricePerPack: product.sellingPricePerPack };
        }
        if (product.pack) {
          salesMap[product.productName].packCount += product.quantity;
        } else {
          salesMap[product.productName].unitCount += product.quantity;
        }
      });
    });
    // สร้าง array สำหรับสินค้าทุกตัว
    const merged = allProducts.map(product => {
      const sale = salesMap[product.productName] || { unitCount: 0, packCount: 0, packSize: product.packSize || 1, sellingPricePerUnit: product.sellingPricePerUnit, sellingPricePerPack: product.sellingPricePerPack };
      return {
        ...product,
        unitCount: sale.unitCount,
        packCount: sale.packCount,
        packSize: sale.packSize,
        sellingPricePerUnit: sale.sellingPricePerUnit,
        sellingPricePerPack: sale.sellingPricePerPack
      };
    });
    // กรองเฉพาะสินค้าที่ขายได้อย่างน้อย 1 ชิ้น/แพ็ค
    const filtered = merged.filter(p => (p.unitCount || 0) + (p.packCount || 0) > 0);
    // เรียงจากน้อยไปมาก
    return filtered.sort((a, b) => ((a.unitCount || 0) + (a.packCount || 0)) - ((b.unitCount || 0) + (b.packCount || 0))).slice(0, 3);
  }, [allProducts, filteredOrders]);

  // ข้อมูลสำหรับกราฟประเภทการชำระเงิน (เงินสด/เงินโอน) ใช้ filteredOrders
  const getPaymentTypeData = () => {
    const paymentSum = { 'เงินสด': 0, 'เงินโอน': 0 };
    filteredOrders.forEach(order => {
      if (order.paymentMethod === 'Cash') paymentSum['เงินสด'] += order.total || 0;
      if (order.paymentMethod === 'BankTransfer') paymentSum['เงินโอน'] += order.total || 0;
    });
    return {
      labels: Object.keys(paymentSum),
      data: Object.values(paymentSum),
    };
  };
  const paymentTypeData = {
    labels: getPaymentTypeData().labels,
    datasets: [
      {
        data: getPaymentTypeData().data,
        backgroundColor: [
          '#6366F1', // เงินสด
          '#10B981', // เงินโอน
        ],
        borderWidth: 0,
      }
    ]
  };

  // ออเดอร์ล่าสุด (ใช้ filteredOrders)
  const latestOrders = filteredOrders.slice(0, 5);

  // ฟังก์ชันสร้าง labels n วันล่าสุด
  const getLastNDays = (n) => {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }));
    }
    return dates;
  };

  // ฟังก์ชันสร้าง data n วันล่าสุด (ถ้าเลือกวันจะโชว์เฉพาะวันนั้น)
  const getDailySales = (n) => {
    if (selectedDate) {
      // filter orders เฉพาะวันเดียว
      const dayOrders = orders.filter(order => {
        return isSelectedDay(order.orderDate) && order.orderStatus === "ขายสำเร็จ";
      });
      return [dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)];
    }
    // เดิม: n วันล่าสุด
    const dates = getLastNDays(n);
    return dates.map(date => {
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        return orderDate === date && order.orderStatus === "ขายสำเร็จ";
      });
      return dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    });
  };

  // ข้อมูลสำหรับกราฟยอดขายรายวัน (อิง selectedRange หรือ selectedDate)
  const salesData = {
    labels: selectedDate
      ? [new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })]
      : getLastNDays(selectedRange),
    datasets: [
      {
        label: 'ยอดขายรายวัน',
        data: getDailySales(selectedRange),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // เพิ่มฟังก์ชันคำนวณ growth (เดือนที่แล้วเป็น 0 ให้แสดง 0%)
  const getGrowthProps = (current, previous) => {
    const growth = previous ? ((current - previous) / Math.abs(previous)) * 100 : 0;
    const isNegative = current < 0;
    return {
      growth: Math.abs(growth).toFixed(1),
      isNegative,
      arrow: isNegative ? <FaArrowDown className="mr-1 text-red-500" /> : <FaArrowUp className="mr-1 text-green-500" />,
      color: isNegative ? "text-red-500" : "text-green-500"
    };
  };

  // ฟังก์ชันช่วยเช็คเดือน
  const isThisMonth = (date) => {
    const d = new Date(date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const isLastMonth = (date) => {
    const d = new Date(date);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
  };

  // ออเดอร์เดือนนี้/เดือนที่แล้ว
  const thisMonthOrders = orders.filter(order => isThisMonth(order.orderDate) && order.orderStatus === "ขายสำเร็จ");
  const lastMonthOrders = orders.filter(order => isLastMonth(order.orderDate) && order.orderStatus === "ขายสำเร็จ");

  // ใบสั่งซื้อเดือนนี้/เดือนที่แล้ว
  const thisMonthPOs = purchaseOrders.filter(po => isThisMonth(po.purchaseOrderDate) && po.status === "completed");
  const lastMonthPOs = purchaseOrders.filter(po => isLastMonth(po.purchaseOrderDate) && po.status === "completed");

  // previous values (เดือนที่แล้ว)
  const previousSales = lastMonthOrders.length;
  const previousProfit = lastMonthOrders.reduce((sum, order) => {
    const profit = order.products.reduce((productSum, product) => {
      return productSum + ((product.sellingPricePerUnit - product.purchasePrice) * product.quantity);
    }, 0);
    return sum + profit;
  }, 0);
  const previousRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const previousExpense = lastMonthPOs.reduce((sum, po) => sum + (po.total || 0), 0);

  const salesGrowth = getGrowthProps(totalSales, previousSales);
  const profitGrowth = getGrowthProps(totalProfit, previousProfit);
  const revenueGrowth = getGrowthProps(totalRevenue, previousRevenue);
  const expenseGrowth = getGrowthProps(totalExpense, previousExpense);

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="mt-2 text-sm text-gray-600">ภาพรวมการขายและข้อมูลสำคัญ</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">จำนวนยอดขาย</p>
                <p className={`text-2xl font-bold mt-1 ${salesGrowth.isNegative ? "text-red-600" : "text-gray-900"}`}>{totalSales}</p>
                <div className="flex items-center mt-2">
                  {salesGrowth.arrow}
                  <span className={`text-sm ${salesGrowth.color}`}>{salesGrowth.isNegative ? '-' : '+'}{salesGrowth.growth}% จากเดือนที่แล้ว</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <FaShoppingCart className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{totalProfit < 0 ? "ขาดทุน" : "กำไร"}</p>
                <p className={`text-2xl font-bold mt-1 ${profitGrowth.isNegative ? "text-red-600" : "text-gray-900"}`}>฿{totalProfit.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  {profitGrowth.arrow}
                  <span className={`text-sm ${profitGrowth.color}`}>{profitGrowth.isNegative ? '-' : '+'}{profitGrowth.growth}% จากเดือนที่แล้ว</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FaDollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">รายได้สุทธิ</p>
                <p className={`text-2xl font-bold mt-1 ${revenueGrowth.isNegative ? "text-red-600" : "text-gray-900"}`}>฿{totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  {revenueGrowth.arrow}
                  <span className={`text-sm ${revenueGrowth.color}`}>{revenueGrowth.isNegative ? '-' : '+'}{revenueGrowth.growth}% จากเดือนที่แล้ว</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FaMoneyBillWave className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          {/* รายจ่าย */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">รายจ่าย (ต้นทุน)</p>
                <p className={`text-2xl font-bold mt-1 ${expenseGrowth.isNegative ? "text-red-600" : "text-gray-900"}`}>฿{totalExpense.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  {expenseGrowth.arrow}
                  <span className={`text-sm ${expenseGrowth.color}`}>{expenseGrowth.isNegative ? '-' : '+'}{expenseGrowth.growth}% จากเดือนที่แล้ว</span>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <FaFileInvoiceDollar className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* ยอดขายรายวัน */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">ยอดขายรายวัน</h2>
              {/* Date Picker Only */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition w-40"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    placeholder="เลือกวันที่"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10m-9 8h10m-9-4h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/></svg>
                  </span>
                </div>
                {selectedDate && (
                  <button
                    className="ml-1 px-2 py-1 rounded text-xs bg-gray-200 hover:bg-gray-300"
                    onClick={() => setSelectedDate("")}
                  >
                    ล้างวัน
                  </button>
                )}
              </div>
            </div>
            <div className="h-80">
              <Line 
                data={salesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* สถานะออเดอร์ */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">สัดส่วนยอดขาย เงินสด/เงินโอน</h2>
            <div className="h-80">
              <Doughnut 
                data={paymentTypeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          return `${label}: ฿${value.toLocaleString()}`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* สินค้าขายดี/ไม่ดี (Toggle) และออเดอร์ล่าสุด */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* กล่องเดียว: สินค้าขายดี/ไม่ดี */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {showBest ? "สินค้าขายดี" : "สินค้าขายไม่ดี"}
              </h2>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-150 ${showBest ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50'}`}
                  onClick={() => setShowBest(true)}
                >ขายดี</button>
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-150 ${!showBest ? 'bg-red-500 text-white border-red-500 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'}`}
                  onClick={() => setShowBest(false)}
                >ขายไม่ดี</button>
              </div>
            </div>
            <div className="space-y-4">
              {(showBest ? bestSellingProducts : worstSellingProducts).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${showBest ? 'bg-indigo-100' : 'bg-red-100'}`}> 
                      <span className={`font-semibold ${showBest ? 'text-indigo-600' : 'text-red-600'}`}>{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.productName}</p>
                      <p className="text-sm text-gray-500">
                        {product.unitCount > 0 && `ขายได้ ${product.unitCount} ชิ้น`}
                        {product.unitCount > 0 && product.packCount > 0 && " / "}
                        {product.packCount > 0 && `ขายได้ ${product.packCount} แพ็ค`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">฿{(product.sellingPricePerUnit * (product.unitCount || 0) + (product.sellingPricePerPack || 0) * (product.packCount || 0)).toLocaleString()}</p>
                    {showBest && <p className="text-sm text-green-600">+{Math.floor(Math.random() * 20)}% จากเดือนที่แล้ว</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ออเดอร์ล่าสุด */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">ออเดอร์ล่าสุด</h2>
              <button className="text-sm text-indigo-600 hover:text-indigo-700">ดูทั้งหมด</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 font-medium text-gray-500">ORDER ID</th>
                    <th className="pb-3 font-medium text-gray-500">วัน-เวลา</th>
                    <th className="pb-3 font-medium text-gray-500">สถานะ</th>
                    <th className="pb-3 font-medium text-gray-500">ยอดรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {latestOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 text-sm text-gray-900">{generateOrderNumber(order._id)}</td>
                      <td className="py-4 text-sm text-gray-600">
                        {new Date(order.orderDate).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${order.orderStatus === "ขายสำเร็จ" ? "bg-green-100 text-green-800" :
                            order.orderStatus === "รอชำระเงิน" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-medium text-gray-900">
                        ฿{order.total?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;