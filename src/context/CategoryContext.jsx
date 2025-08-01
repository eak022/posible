import React, { createContext, useContext, useState, useCallback } from "react";
import categoryService from "../services/category.service";
import useAuthStore from "../store/useAuthStore";

const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuthStore();

  // ดึงหมวดหมู่ทั้งหมด
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getAllCategories();
      if (response && Array.isArray(response.categories)) {
        setCategories(response.categories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // เพิ่มหมวดหมู่ใหม่
  const createCategory = async (data) => {
    await categoryService.createCategory(data);
    await fetchCategories();
  };

  // อัปเดตหมวดหมู่
  const updateCategory = async (id, data) => {
    await categoryService.updateCategory(id, data);
    await fetchCategories();
  };

  // ลบหมวดหมู่
  const deleteCategory = async (id) => {
    await categoryService.deleteCategory(id);
    await fetchCategories();
  };

  // โหลด categories ครั้งแรก
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, fetchCategories]);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => useContext(CategoryContext);
