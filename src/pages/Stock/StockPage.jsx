import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import CardProduct from "../../components/CardProduct";
import FilterModal from "../../components/FilterModal";
import useFilter from "../../hooks/useFilter";
import { FaFilter, FaPlus } from "react-icons/fa";
import { productService, categoryService } from "../../services";
import { ProductContext } from "../../context/ProductContext";

// CardSkeleton component (ใช้ daisyUI skeleton)
const CardSkeleton = () => (
  <div className="flex justify-center">
    <div className="w-64 h-72 rounded-xl shadow bg-base-200 flex flex-col items-center p-4">
      <div className="skeleton w-32 h-32 mb-4 rounded-lg" />
      <div className="skeleton w-24 h-4 mb-2 rounded" />
      <div className="skeleton w-16 h-4 mb-2 rounded" />
      <div className="skeleton w-20 h-6 rounded" />
    </div>
  </div>
);

const StockPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { products, setProducts } = useContext(ProductContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [stockRange, setStockRange] = useState({ min: "", max: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let response;

        // ดึงข้อมูลหมวดหมู่
        if (category) {
          const categoryResponse = await categoryService.getCategoryById(
            category
          );
          setCategoryName(categoryResponse.categoryName);
        } else {
          setCategoryName("");
        }

        // ดึงข้อมูลสินค้าทั้งหมด
        response = await productService.getAllProducts();
        let products = response.data || response;

        // กรองสินค้าตามหมวดหมู่
        if (category) {
          products = products.filter(
            (product) => product.categoryId?._id === category
          );
        }

        setProducts(products);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, setProducts]);

  const filteredProducts = useFilter(
    products,
    categoryName,
    searchTerm,
    priceRange,
    stockRange
  );

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleSort = () => setIsModalOpen(false);
  const handleReset = () => {
    setPriceRange({ min: "", max: "" });
    setStockRange({ min: "", max: "" });
    setSearchTerm("");
    setIsModalOpen(false);
  };

  if (loading) {
    // ถ้ามีข้อมูลสินค้าแล้ว ให้ skeleton เท่ากับจำนวนสินค้า ถ้ายังไม่มี ให้ default 8
    const skeletonCount = filteredProducts.length > 0 ? filteredProducts.length : 8;
    return (
      <div className="bg-gray-100 h-screen overflow-auto py-10">
        <div className="bg-gray-100 p-10 w-full">
          <div className="flex justify-between items-center px-10 pb-6">
            <div className="skeleton h-8 w-40 rounded-xl" />
            <div className="search-filter-container flex gap-2">
              <div className="skeleton h-10 w-48 rounded-xl" />
              <div className="skeleton h-10 w-32 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-20 px-10 mt-16">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">เกิดข้อผิดพลาด: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 h-screen overflow-auto py-10">
      {/* Order Page Content */}
      <div className="bg-gray-100 p-10 w-full">
        {/* Search and Filter button */}
        <div className="flex justify-between items-center px-10 pb-6">
          <div className="text-2xl font-bold text-black text-start">
            {categoryName ? `หมวดหมู่: ${categoryName}` : "เลือกสินค้า"}
          </div>
          <div className="search-filter-container">
            <input
              type="text"
              id="stock-search-input"
              placeholder="ค้นหาสินค้า"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <button
              id="stock-filter-button"
              onClick={() => setIsModalOpen(true)}
              className="filter-button"
            >
              <FaFilter />
              <span>กรองสินค้า</span>
            </button>
          </div>
        </div>

        {/* Filter Modal */}
        <FilterModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          stockRange={stockRange}
          setStockRange={setStockRange}
          handleSort={handleSort}
          handleReset={handleReset}
        />

        {/* Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-20 px-10 transition-all duration-300 mt-16">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <div key={index} className="flex justify-center">
                <CardProduct
                  product={product}
                  onEdit={() =>
                    navigate(`/products/edit-product/${product._id}`)
                  }
                />
              </div>
            ))
          ) : (
            <div className="text-center col-span-full text-gray-500">
              ไม่มีสินค้าในหมวดหมู่นี้
            </div>
          )}
        </div>

        {/* Add-product button */}
        <button
          id="stock-add-product-button"
          onClick={() => navigate("/products/create-product")}
          className="fixed bottom-10 right-10 p-4 bg-white text-green-500 rounded-full shadow-lg hover:bg-green-100 transition duration-300"
          data-tip="เพิ่มสินค้า"
        >
          <FaPlus size={24} />
        </button>
      </div>
    </div>
  );
};

export default StockPage;
