import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingBag, Trash2, Plus, Minus, AlertCircle,
  ChevronRight, ShoppingCart, ArrowLeft, Tag
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    cart,
    total,
    loading,
    error,
    updateItem,
    removeItem,
    clearCart
  } = useCart();

  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user]);

  const handleUpdateQuantity = async (productId, size, quantity) => {
    const key = `${productId}-${size}`;
    setUpdatingItem(key);
    setActionError("");
    const result = await updateItem(productId, size, quantity);
    if (!result.success) setActionError(result.message);
    setUpdatingItem(null);
  };

  const handleRemoveItem = async (productId, size) => {
    const key = `${productId}-${size}`;
    setRemovingItem(key);
    setActionError("");
    const result = await removeItem(productId, size);
    if (!result.success) setActionError(result.message);
    setRemovingItem(null);
  };

  const handleClearCart = async () => {
    setClearingCart(true);
    setActionError("");
    const result = await clearCart();
    if (!result.success) setActionError(result.message);
    setClearingCart(false);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-40" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100" />
              ))}
            </div>
            <div className="h-64 bg-white rounded-2xl border border-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !cart || cart.items?.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900">My Cart</h1>
              {!isEmpty && (
                <p className="text-xs text-gray-400">
                  {cart.items.length} item{cart.items.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {!isEmpty && (
            <button
              onClick={handleClearCart}
              disabled={clearingCart}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            >
              <Trash2 size={13} />
              {clearingCart ? "Clearing..." : "Clear Cart"}
            </button>
          )}
        </div>

        {/* Error */}
        {(error || actionError) && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} />
            {actionError || error}
          </div>
        )}

        {/* Empty Cart */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <ShoppingCart size={28} className="text-blue-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-black text-gray-800">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add some products to get started</p>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-blue-200"
            >
              <ShoppingBag size={15} />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">

            {/* Cart Items */}
            <div className="md:col-span-2 space-y-3">
              {cart.items.map((item) => {
                const key = `${item.product?._id || item.product}-${item.size}`;
                const isUpdating = updatingItem === key;
                const isRemoving = removingItem === key;
                const productId = item.product?._id || item.product;
                const productName = item.product?.name || "Product";
                const productImage = item.product?.images?.[0] || null;
                const maxStock = item.product?.sizes?.find(s => s.size === item.size)?.stock || 99;

                return (
                  <div
                    key={key}
                    className={`bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 transition-all duration-200 ${
                      isRemoving ? "opacity-50 scale-95" : ""
                    }`}
                  >
                    {/* Image */}
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 cursor-pointer"
                      onClick={() => navigate(`/products/${productId}`)}
                    >
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={20} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className="text-sm font-bold text-gray-800 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => navigate(`/products/${productId}`)}
                          >
                            {productName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-lg">
                              Size: {item.size}
                            </span>
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveItem(productId, item.size)}
                          disabled={isRemoving}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Price */}
                        <div className="flex items-center gap-1 text-blue-600">
                          <Tag size={12} />
                          <span className="text-sm font-black">
                            ₹{item.price * item.quantity}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-xs text-gray-400">
                              (₹{item.price} × {item.quantity})
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => handleUpdateQuantity(productId, item.size, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-sm font-black text-gray-900">
                            {isUpdating ? (
                              <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(productId, item.size, item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= maxStock}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 sticky top-24">
                <h2 className="text-base font-black text-gray-900">Order Summary</h2>

                <div className="space-y-2.5 text-sm">
                  {cart.items.map((item) => {
                    const productName = item.product?.name || "Product";
                    return (
                      <div
                        key={`${item.product?._id}-${item.size}`}
                        className="flex justify-between text-gray-500"
                      >
                        <span className="line-clamp-1 flex-1 pr-2">
                          {productName} ({item.size}) × {item.quantity}
                        </span>
                        <span className="font-semibold text-gray-700 shrink-0">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">Total</span>
                  <span className="text-xl font-black text-blue-600">₹{total}</span>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-200 transition-all duration-200"
                >
                  Proceed to Checkout
                  <ChevronRight size={16} />
                </button>

                <Link
                  to="/"
                  className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Continue Shopping
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;