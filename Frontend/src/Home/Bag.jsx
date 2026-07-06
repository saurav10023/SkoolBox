import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, AlertCircle, ChevronRight, Tag } from "lucide-react";
import API from "../api/axios";

const Bag = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBags = async () => {
      try {
        const res = await API.get("/api/v1/products?category=bag");
        setProducts(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load bags");
      } finally {
        setLoading(false);
      }
    };
    fetchBags();
  }, []);

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-56 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-8 bg-gray-100 rounded-xl mt-3" />
      </div>
    </div>
  );

  return (
    <section id="bags" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">

      {/* Section Header */}
      <div className="flex items-end justify-between mb-8">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
            Collection
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            School Bags
          </h2>
          <p className="text-sm text-gray-400">
            Durable and spacious bags for every student
          </p>
        </div>

        <button
          onClick={() => navigate("/products?category=bag")}
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : products.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
            <ShoppingBag size={40} className="text-gray-200" />
            <p className="text-gray-400 text-sm font-medium">No bags available right now</p>
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
                    : "hover:shadow-md hover:border-blue-200 cursor-pointer"
                  }`}
              >
                {/* Image */}
                <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={32} className="text-gray-300" />
                    </div>
                  )}

                  {/* Out of stock overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Sizes count badge */}
                  {!isOutOfStock && product.sizes?.length > 0 && (
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2 py-1 rounded-lg shadow-sm">
                      {product.sizes.length} size{product.sizes.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 sm:p-4 space-y-2">
                  <h3 className="text-sm font-bold text-gray-800 leading-tight line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1 text-blue-600">
                    <Tag size={12} />
                    <span className="text-sm font-black">
                      {minPrice !== null ? `₹${minPrice}` : "—"}
                    </span>
                    {product.sizes?.length > 1 && (
                      <span className="text-xs text-gray-400 font-normal">onwards</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOutOfStock) navigate(`/products/${product._id}`);
                    }}
                    disabled={isOutOfStock}
                    className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-xs font-semibold py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag size={13} />
                    View Product
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile view all */}
      {!loading && products.length > 0 && (
        <div className="sm:hidden mt-6 text-center">
          <button
            onClick={() => navigate("/products?category=bag")}
            className="flex items-center gap-1.5 mx-auto text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Bags
            <ChevronRight size={16} />
          </button>
        </div>
      )}

    </section>
  );
};

export default Bag;