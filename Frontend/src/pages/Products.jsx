import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag, AlertCircle, Tag, SlidersHorizontal, X, PackageX } from "lucide-react";
import API from "../api/axios";

const CATEGORIES = ["all", "uniform", "bag", "stationery", "socks"];

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "all"
  );

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory]);

  const fetchProducts = async (category) => {
    setLoading(true);
    setError("");
    try {
      const url = category === "all"
        ? "/api/v1/products"
        : `/api/v1/products?category=${category}`;
      const res = await API.get(url);
      setProducts(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    if (category === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-2/5" />
        <div className="h-8 bg-gray-100 rounded-xl mt-3" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="px-4 sm:px-6 pt-6 pb-4">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.14em]">
            Browse
          </p>
          <div className="flex items-baseline justify-between gap-3 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              All Products
            </h1>
            <p className="text-xs text-gray-400 font-medium whitespace-nowrap">
              {loading ? "Loading…" : `${products.length} item${products.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* ── Sticky filter bar ── */}
        <div className="sticky top-0 z-20 bg-gray-50/90 backdrop-blur-sm border-b border-gray-100">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-400 shrink-0">
              <SlidersHorizontal size={13} />
              Filter
            </div>

            <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 w-max pr-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`shrink-0 px-4 py-2 sm:py-1.5 rounded-full text-xs font-bold capitalize transition-all duration-150 active:scale-95
                      ${activeCategory === cat
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                      }`}
                  >
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
                {activeCategory !== "all" && (
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 sm:py-1.5 text-xs font-bold text-red-500 hover:text-red-600 border border-red-200 hover:bg-red-50 rounded-full transition-all active:scale-95"
                  >
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5 space-y-5">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* ── Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
            ) : products.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center">
                  <PackageX size={26} className="text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">
                  No products found {activeCategory !== "all" && `in "${activeCategory}"`}
                </p>
                {activeCategory !== "all" && (
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View all products
                  </button>
                )}
              </div>
            ) : (
              products.map((product) => {
                const minPrice = product.sizes?.length
                  ? Math.min(...product.sizes.map(s => s.price))
                  : null;
                const isOutOfStock = product.sizes?.every(s => s.stock === 0);

                return (
                  <div
                    key={product._id}
                    onClick={() => !isOutOfStock && navigate(`/products/${product._id}`)}
                    className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 group
                      ${isOutOfStock
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:shadow-lg hover:shadow-blue-100 hover:border-blue-200 hover:-translate-y-0.5 cursor-pointer"
                      }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={26} className="text-gray-200" />
                        </div>
                      )}

                      {/* Out of stock overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <span className="bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                            OUT OF STOCK
                          </span>
                        </div>
                      )}

                      {/* Category badge */}
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm capitalize">
                        {product.category}
                      </div>

                      {/* Sizes badge */}
                      {!isOutOfStock && product.sizes?.length > 0 && (
                        <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                          {product.sizes.length} size{product.sizes.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-snug line-clamp-2 min-h-[2.2em]">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-1 text-blue-600">
                        <Tag size={11} className="shrink-0" />
                        <span className="text-sm font-black">
                          {minPrice !== null ? `₹${minPrice}` : "—"}
                        </span>
                        {product.sizes?.length > 1 && (
                          <span className="text-[10px] text-gray-400 font-normal">onwards</span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) navigate(`/products/${product._id}`);
                        }}
                        disabled={isOutOfStock}
                        className="w-full flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-600 active:scale-95 text-blue-600 hover:text-white text-xs font-bold py-2 sm:py-1.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingBag size={11} />
                        View
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Products;