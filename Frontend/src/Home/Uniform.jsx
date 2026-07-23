import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, AlertCircle, ChevronRight, Tag, Layers, Shirt } from "lucide-react";
import API from "../api/axios";

const Uniform = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "sets" | "individual"

  useEffect(() => {
    const fetchUniforms = async () => {
      try {
        const res = await API.get("/api/v1/products?category=uniform");
        setProducts(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load uniforms");
      } finally {
        setLoading(false);
      }
    };
    fetchUniforms();
  }, []);

  // A product counts as a "set" if the word "set" appears anywhere in its name
  // e.g. "Boys Uniform Set", "Sports Set of 3", "Combo Set" all match
  const isSetProduct = (product) => /set/i.test(product.name || "");

  const { setProducts: sets, individualProducts, filteredProducts } = useMemo(() => {
    const sets = products.filter(isSetProduct);
    const individualProducts = products.filter((p) => !isSetProduct(p));

    let filteredProducts = products;
    if (activeTab === "sets") filteredProducts = sets;
    if (activeTab === "individual") filteredProducts = individualProducts;

    return { setProducts: sets, individualProducts, filteredProducts };
  }, [products, activeTab]);

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-52 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-8 bg-gray-100 rounded-xl mt-3" />
      </div>
    </div>
  );

  const ProductCard = ({ product }) => {
    const minPrice = product.sizes?.length
      ? Math.min(...product.sizes.map((s) => s.price))
      : null;

    const isOutOfStock = product.sizes?.every((s) => s.stock === 0);
    const isSet = isSetProduct(product);

    return (
      <div
        onClick={() => !isOutOfStock && navigate(`/products/${product._id}`)}
        className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 group
          ${isOutOfStock ? "opacity-60 cursor-not-allowed" : "hover:shadow-md hover:border-blue-200 cursor-pointer"}`}
      >
        {/* Image */}
        <div className="relative h-48 sm:h-52 overflow-hidden bg-gray-100">
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

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {/* Set badge */}
          {isSet && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <Layers size={11} />
              Set
            </div>
          )}

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
  };

  const tabs = [
    { key: "all", label: "All", icon: ShoppingBag, count: products.length },
    { key: "sets", label: "Sets", icon: Layers, count: sets.length },
    { key: "individual", label: "Individual", icon: Shirt, count: individualProducts.length },
  ];

  return (
    <section id="uniform" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
            Collection
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            School Uniforms
          </h2>
          <p className="text-sm text-gray-400">
            Official uniforms for all classes and seasons
          </p>
        </div>

        <button
          onClick={() => navigate("/products?category=uniform")}
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
        >
          View All
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Tabs */}
      {!loading && products.length > 0 && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors shrink-0
                ${activeTab === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              <Icon size={14} />
              {label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md ${
                  activeTab === key ? "bg-white/20" : "bg-white text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

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
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
            <ShoppingBag size={40} className="text-gray-200" />
            <p className="text-gray-400 text-sm font-medium">
              {activeTab === "sets"
                ? "No uniform sets available right now"
                : activeTab === "individual"
                ? "No individual uniforms available right now"
                : "No uniforms available right now"}
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => <ProductCard key={product._id} product={product} />)
        )}
      </div>

      {/* Mobile view all */}
      {!loading && products.length > 0 && (
        <div className="sm:hidden mt-6 text-center">
          <button
            onClick={() => navigate("/products?category=uniform")}
            className="flex items-center gap-1.5 mx-auto text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Uniforms
            <ChevronRight size={16} />
          </button>
        </div>
      )}

    </section>
  );
};

export default Uniform;