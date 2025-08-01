import { useState, useEffect } from "react";

const useFilter = (products, category, searchTerm, priceRange, stockRange) => {
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    let updatedProducts = products;

    if (category) {
      updatedProducts = updatedProducts.filter(
        (product) => product.categoryId === category
      );
    }

    if (searchTerm) {
      updatedProducts = updatedProducts.filter((product) =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priceRange.min !== "" && priceRange.max !== "") {
      updatedProducts = updatedProducts.filter(
        (product) =>
          product.sellingPricePerUnit >= parseFloat(priceRange.min) &&
          product.sellingPricePerUnit <= parseFloat(priceRange.max)
      );
    }

    if (stockRange.min !== "" && stockRange.max !== "") {
      updatedProducts = updatedProducts.filter(
        (product) =>
          product.quantity >= parseInt(stockRange.min) &&
          product.quantity <= parseInt(stockRange.max)
      );
    }

    setFilteredProducts(updatedProducts);
  }, [products, category, searchTerm, priceRange, stockRange]);

  return filteredProducts;
};

export default useFilter;
