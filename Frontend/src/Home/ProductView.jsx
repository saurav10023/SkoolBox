import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingBag, ChevronLeft, Plus, Minus,
  AlertCircle, CheckCircle, Tag, Package, ShoppingCart
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import API from "../api/axios";

const ProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState("");
  const [cartError, setCartError] = useState("");

  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await API.get(`/api/v1/products/${id}`);
        setProduct(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const selectedSizeData = product?.sizes?.find(s => s.size === selectedSize);
  const maxQuantity = selectedSizeData?.stock || 0;

  const handleQuantityChange = (val) => {
    if (val < 1) return;
    if (val > maxQuantity) return;
    setQuantity(val);
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!selectedSize) {
      setCartError("Please select a size first");
      return;
    }

    setCartLoading(true);
    setCartError("");
    setCartSuccess("");

    // use CartContext addToCart — also updates navbar badge automatically
    const result = await addToCart(product._id, selectedSize, quantity);

    if (result.success) {
      setCartSuccess("Added to cart successfully!");
      setTimeout(() => setCartSuccess(""), 3000);
    } else {
      setCartError(result.message);
    }

    setCartLoading(false);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="h-96 bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-20 bg-gray-100 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 w-16 bg-gray-200 rounded-xl" />)}
            </div>
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-500 text-base">{error || "Product not found"}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isOutOfStock = product.sizes?.every(s => s.stock === 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">

            {/* Images */}
            <div className="p-4 space-y-3 bg-gray-50">
              {/* Main image */}
              <div className="relative h-72 sm:h-96 rounded-xl overflow-hidden bg-white border border-gray-100">
                {product.images?.[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={48} className="text-gray-200" />
                  </div>
                )}

                {/* Unavailable badge */}
                {!product.isAvailable && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Unavailable
                  </div>
                )}

                {isOutOfStock && (
                  <div className="absolute top-3 right-3 bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {product.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImage === i
                          ? "border-blue-500 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-6 sm:p-8 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">

                {/* Category + Name */}
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                    {product.category}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1 leading-tight">
                    {product.name}
                  </h1>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-blue-600" />
                  <span className="text-2xl font-black text-blue-600">
                    {selectedSizeData
                      ? `₹${selectedSizeData.price}`
                      : product.sizes?.length
                        ? `₹${Math.min(...product.sizes.map(s => s.price))}`
                        : "—"
                    }
                  </span>
                  {!selectedSizeData && product.sizes?.length > 1 && (
                    <span className="text-sm text-gray-400">onwards</span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Size Selector */}
                {product.sizes?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-700">
                      Select Size
                      {selectedSize && (
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          — {maxQuantity} in stock
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((s) => {
                        const outOfStock = s.stock === 0;
                        return (
                          <button
                            key={s.size}
                            onClick={() => {
                              if (!outOfStock) {
                                setSelectedSize(s.size);
                                setQuantity(1);
                                setCartError("");
                              }
                            }}
                            disabled={outOfStock}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-150
                              ${outOfStock
                                ? "border-gray-100 text-gray-300 cursor-not-allowed line-through"
                                : selectedSize === s.size
                                  ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                                  : "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                              }`}
                          >
                            {s.size}
                          </button>
                        );
                      })}
                    </div>
                    {!selectedSize && (
                      <p className="text-xs text-gray-400">Please select a size to continue</p>
                    )}
                  </div>
                )}

                {/* Quantity Selector */}
                {selectedSize && maxQuantity > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-700">Quantity</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="w-12 text-center text-sm font-black text-gray-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= maxQuantity}
                          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">
                        Max {maxQuantity} available
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart feedback */}
              {cartError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm">
                  <AlertCircle size={15} />
                  {cartError}
                </div>
              )}

              {cartSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm">
                  <CheckCircle size={15} />
                  {cartSuccess}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading || isOutOfStock || !product.isAvailable}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-200 transition-all duration-200"
                >
                  {cartLoading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <ShoppingBag size={16} />
                  )}
                  {cartLoading ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl font-semibold text-sm transition-all duration-200"
                >
                  <ShoppingCart size={16} />
                  View Cart
                </button>
              </div>

              {/* Stock info */}
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                <Package size={13} />
                {isOutOfStock
                  ? "Currently out of stock"
                  : `${product.sizes?.reduce((acc, s) => acc + s.stock, 0)} units available across all sizes`
                }
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductView;