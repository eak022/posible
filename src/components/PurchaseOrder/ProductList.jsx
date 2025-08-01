import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FaFilter } from 'react-icons/fa';
import FilterModal from '../../components/FilterModal';

const ProductList = ({ products, onAdd }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [stockRange, setStockRange] = useState({ min: '', max: '' });

    const handleSort = () => setIsFilterOpen(false);
    const handleReset = () => {
        setPriceRange({ min: '', max: '' });
        setStockRange({ min: '', max: '' });
        setSearchTerm('');
        setIsFilterOpen(false);
    };

    // กรองและเรียงลำดับสินค้า
    const filteredAndSortedProducts = useMemo(() => {
        let filteredProducts = [...products];
        // กรองด้วย searchTerm
        if (searchTerm.trim() !== "") {
            filteredProducts = filteredProducts.filter(product =>
                product.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        // กรองด้วย priceRange
        if (priceRange.min !== '' && !isNaN(Number(priceRange.min))) {
            filteredProducts = filteredProducts.filter(product => product.sellingPricePerUnit >= Number(priceRange.min));
        }
        if (priceRange.max !== '' && !isNaN(Number(priceRange.max))) {
            filteredProducts = filteredProducts.filter(product => product.sellingPricePerUnit <= Number(priceRange.max));
        }
        // กรองด้วย stockRange
        if (stockRange.min !== '' && !isNaN(Number(stockRange.min))) {
            filteredProducts = filteredProducts.filter(product => product.quantity >= Number(stockRange.min));
        }
        if (stockRange.max !== '' && !isNaN(Number(stockRange.max))) {
            filteredProducts = filteredProducts.filter(product => product.quantity <= Number(stockRange.max));
        }
        return filteredProducts.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
    }, [products, searchTerm, priceRange, stockRange]);

    return (
        <div className="space-y-4">
            {/* หัวตาราง */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-purple-500 text-white rounded-lg pl-8 text-center items-center">
                <div>รายการสินค้า</div>
                <div>จำนวนคงเหลือ</div>
                <div>ปุ่มเพิ่ม</div>
            </div>
            {/* Search & Filter */}
            <div className="search-filter-container mb-4">
                <input
                    type="text"
                    id="product-list-search-input"
                    placeholder="ค้นหาสินค้า"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button
                    id="product-list-filter-button"
                    onClick={() => setIsFilterOpen(true)}
                    className="filter-button"
                >
                    <FaFilter />
                    <span>กรองสินค้า</span>
                </button>
            </div>
            {/* รายการสินค้า */}
            {filteredAndSortedProducts.map((product) => {
                const isLowStock = product.productStatuses?.some(status => status.statusName === 'สินค้าใกล้หมด');
                return (
                    <div
                        key={product._id}
                        className={`grid grid-cols-3 gap-3 p-4 bg-white rounded-lg shadow-sm items-center text-center ${isLowStock ? 'border-l-4 border-red-500' : ''}`}
                    >
                        <div className="text-gray-800 flex items-center justify-center">
                            {product.productName}
                        </div>
                        <div className={`${isLowStock ? 'text-red-500 font-medium' : 'text-gray-600'} flex items-center justify-center`}>{product.quantity || 0}
                        {product.packSize ? (
                                <span className="ml-2 text-xs text-gray-500">({product.packSize}ชิ้น/แพ็ค)</span>
                            ) : null}
                        </div>
                        <div className="flex justify-center items-center">
                            <button
                                id={`product-list-add-button-${product._id}`}
                                onClick={() => onAdd(product._id)}
                                className="w-8 h-8 rounded-full bg-green-400 text-white hover:bg-green-500 transition-colors flex items-center justify-center"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                );
            })}
            {filteredAndSortedProducts.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                    ไม่พบรายการสินค้า
                </div>
            )}
            <FilterModal
                isModalOpen={isFilterOpen}
                setIsModalOpen={setIsFilterOpen}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                stockRange={stockRange}
                setStockRange={setStockRange}
                handleSort={handleSort}
                handleReset={handleReset}
            />
        </div>
    );
};

ProductList.propTypes = {
    products: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.string.isRequired,
            productName: PropTypes.string.isRequired,
            quantity: PropTypes.number,
            productStatuses: PropTypes.arrayOf(
                PropTypes.shape({
                    statusName: PropTypes.string.isRequired
                })
            )
        })
    ).isRequired,
    onAdd: PropTypes.func.isRequired
};

export default ProductList; 