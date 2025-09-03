import { createContext, useContext, useState, useEffect } from "react";
import { productService } from "../services";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [categories, setCategories] = useState([]);

  // Cache ข้อมูลเป็นเวลา 5 นาที
  const CACHE_DURATION = 5 * 60 * 1000; // 5 นาที

  // ฟังก์ชันดึงข้อมูลสินค้าแบบ Cached
  const fetchProducts = async (forceRefresh = false) => {
    const now = Date.now();
    
    // ถ้าไม่บังคับ refresh และข้อมูลยังไม่หมดอายุ ให้ใช้ข้อมูลเดิม
    if (!forceRefresh && products.length > 0 && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      console.log("📦 ใช้ข้อมูลสินค้าจาก Cache");
      return products;
    }

    try {
      setLoading(true);
      console.log("🔄 ดึงข้อมูลสินค้าใหม่จาก API");
      
      const response = await productService.getAllProducts();
      const productsData = response.data || response;
      
      // ✅ ตรวจสอบและแก้ไข productStatuses ให้เป็น array เสมอ
      const normalizedProducts = productsData.map(product => ({
        ...product,
        productStatuses: Array.isArray(product.productStatuses) ? product.productStatuses : []
      }));
      
      setProducts(normalizedProducts);
      setLastFetch(now);
      
      return normalizedProducts;
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันดึงข้อมูลหมวดหมู่
  const fetchCategories = async () => {
    if (categories.length > 0) return categories;
    
    try {
      const response = await productService.getAllCategories();
      const categoriesData = response.data || response;
      setCategories(categoriesData);
      return categoriesData;
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      return [];
    }
  };

  // ฟังก์ชันกรองสินค้าตามหมวดหมู่
  const getProductsByCategory = (categoryId) => {
    if (!categoryId) return products;
    return products.filter(product => product.categoryId?._id === categoryId);
  };

  // ฟังก์ชันค้นหาสินค้า
  const searchProducts = (searchTerm) => {
    if (!searchTerm) return products;
    return products.filter(product => 
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    );
  };

  // ฟังก์ชันเพิ่มสินค้าใหม่
  const addProduct = (newProduct) => {
    // ✅ ตรวจสอบและแก้ไข productStatuses ให้เป็น array เสมอ
    const normalizedProduct = {
      ...newProduct,
      productStatuses: Array.isArray(newProduct.productStatuses) ? newProduct.productStatuses : []
    };
    
    setProducts(prevProducts => [normalizedProduct, ...prevProducts]);
  };

  // ฟังก์ชันอัพเดทสินค้า
  const updateProduct = (productId, updatedData) => {
    setProducts(prevProducts => 
      prevProducts.map(product => {
        if (product._id === productId) {
          let updatedProduct;
          // ถ้า updatedData เป็น function ให้เรียกใช้ function
          if (typeof updatedData === 'function') {
            updatedProduct = { ...product, ...updatedData(product) };
          } else {
            // ถ้าเป็น object ปกติ ให้ merge
            updatedProduct = { ...product, ...updatedData };
          }
          
          // ✅ ตรวจสอบและแก้ไข productStatuses ให้เป็น array เสมอ
          if (updatedProduct.productStatuses && !Array.isArray(updatedProduct.productStatuses)) {
            updatedProduct.productStatuses = [];
          }
          
          return updatedProduct;
        }
        return product;
      })
    );
  };

  // ฟังก์ชันลบสินค้า
  const removeProduct = (productId) => {
    setProducts(prevProducts => prevProducts.filter(product => product._id !== productId));
  };

  // โหลดข้อมูลเมื่อเริ่มต้น
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const value = {
    products,
    setProducts,
    loading,
    categories,
    fetchProducts,
    fetchCategories,
    getProductsByCategory,
    searchProducts,
    addProduct,
    updateProduct,
    removeProduct,
    lastFetch
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => useContext(ProductContext); 