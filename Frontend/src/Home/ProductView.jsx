import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingBag, ChevronLeft, Plus, Minus,
  AlertCircle, CheckCircle, Tag, Package, ShoppingCart, Zap, X, MessageCircleQuestion
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import API from "../api/axios";

// TODO: replace with your business WhatsApp number — FULL international
// format, country code included, no "+", no spaces/dashes.
// e.g. India: "91XXXXXXXXXX" (91 + 10-digit number). A number without the
// country code will silently produce a broken wa.me link.
const WHATSAPP_NUMBER = "7004335880";

// Simple inline WhatsApp glyph (lucide has no brand icons)
const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M20.52 3.449C12.831-3.984.106 1.407.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.723 1.454h.005c9.66 0 15.923-9.673 12.14-17.06a11.886 11.886 0 00-3.683-3.293zM12.063 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.004-5.451 4.437-9.884 9.891-9.884 2.641 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.452-4.436 9.884-9.888 9.884z" />
  </svg>
);

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
  const [buyLoading, setBuyLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState("");
  const [cartError, setCartError] = useState("");

  const [selectedImage, setSelectedImage] = useState(0);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

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
  const maxQuantity = Number(selectedSizeData?.stock) > 0 ? Number(selectedSizeData.stock) : 0;
  // True only once a size is actually selected and that size has no stock —
  // stays false while nothing is selected yet, so it doesn't block the
  // initial "select a size" prompt.
  const selectedSizeOutOfStock = !!selectedSize && maxQuantity === 0;

  const handleQuantityChange = (val) => {
    if (val < 1) return;
    if (val > maxQuantity) return;
    setQuantity(val);
  };

  // Builds a friendly, product-specific WhatsApp enquiry message
  const getWhatsAppMessage = () => {
    if (!product) return "";
    const sizeText = selectedSize ? ` (Size: ${selectedSize})` : "";
    let reason;
    if (product.isAvailable === false) {
      reason = "unavailable";
    } else if (selectedSizeOutOfStock) {
      reason = `out of stock in size ${selectedSize}`;
    } else {
      reason = "out of stock";
    }
    const link = typeof window !== "undefined" ? window.location.href : "";
    return `Hi! I'm interested in *${product.name}*${sizeText}, but it currently shows as ${reason} on the site.\n\nCould you let me know if/when it'll be back in stock, or if it's available another way?\n\n${link}`;
  };

  const getWhatsAppLink = () => {
    const sanitizedNumber = WHATSAPP_NUMBER.replace(/[^0-9]/g, "");
    if (sanitizedNumber.length < 11) {
      // wa.me needs the FULL international number (country code + number),
      // e.g. 91XXXXXXXXXX for India. A 10-digit local number will open
      // WhatsApp but fail to find a matching contact.
      console.warn(
        "WHATSAPP_NUMBER is missing its country code — wa.me links will not work correctly."
      );
    }
    return `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(getWhatsAppMessage())}`;
  };

  const handleBuyNow = () => {
    if (!canTransact) {
      setShowWhatsAppModal(true);
      return;
    }
    if (!user) {
      navigate("/login");
      return;
    }
    if (!selectedSize) {
      setCartError("Please select a size first");
      return;
    }

    setBuyLoading(true);
    navigate("/checkout", {
      state: {
        buyNow: true,
        product: {
          _id: product._id,
          name: product.name,
          image: product.images?.[0],
          size: selectedSize,
          quantity,
          price: selectedSizeData.price,
        },
      },
    });
  };

  const handleAddToCart = async () => {
    if (!canTransact) {
      setShowWhatsAppModal(true);
      return;
    }
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="h-80 sm:h-[28rem] bg-gray-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-7 bg-gray-200 rounded w-3/4" />
            <div className="h-8 bg-gray-100 rounded w-1/3" />
            <div className="h-16 bg-gray-100 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => <div key={i} className="h-11 w-16 bg-gray-200 rounded-xl" />)}
            </div>
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-gray-500 text-base">{error || "Product not found"}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-95 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Coerce to Number — API/DB may return stock as a string ("0"), which made
  // `s.stock === 0` always false and let out-of-stock items through.
  const isOutOfStock =
    !product.sizes?.length || product.sizes.every(s => Number(s.stock) <= 0);
  // Only block on availability when the API explicitly says false — treat a
  // missing/undefined field as available rather than locking everything out.
  const isAvailable = product.isAvailable !== false;
  // Blocked either when the whole product has nothing in stock, OR when the
  // specific size the shopper picked has none — either case routes to the
  // WhatsApp enquiry flow below.
  const canTransact = isAvailable && !isOutOfStock && !selectedSizeOutOfStock;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">

            {/* Images */}
            <div className="p-4 sm:p-6 space-y-3 bg-gradient-to-b from-gray-50 to-white">
              {/* Main image */}
              <div className="group relative aspect-square sm:aspect-[4/3] lg:aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100">
                {product.images?.[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={48} className="text-gray-200" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  {!isAvailable ? (
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Unavailable
                    </span>
                  ) : <span />}

                  {isOutOfStock && (
                    <span className="bg-gray-900/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail strip */}
              {product.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-150 ${
                        selectedImage === i
                          ? "border-blue-500 ring-2 ring-blue-100"
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
            <div className="p-5 sm:p-8 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">

                {/* Category + Name */}
                <div className="space-y-1">
                  <span className="inline-block text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {product.category}
                  </span>
                  <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black text-gray-900 leading-tight">
                    {product.name}
                  </h1>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <Tag size={16} className="text-blue-600 shrink-0" />
                  <span className="text-2xl sm:text-3xl font-black text-gray-900">
                    {selectedSizeData
                      ? `₹${selectedSizeData.price}`
                      : product.sizes?.length
                        ? `₹${Math.min(...product.sizes.map(s => s.price))}`
                        : "—"
                    }
                  </span>
                  {!selectedSizeData && product.sizes?.length > 1 && (
                    <span className="text-sm text-gray-400 font-medium">onwards</span>
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
                  <div className="space-y-2 pt-1">
                    <p className="text-sm font-bold text-gray-700">
                      Select Size
                      {selectedSize && (
                        <span className={`ml-2 text-xs font-bold ${maxQuantity > 0 ? "text-green-600" : "text-red-600"}`}>
                          {maxQuantity > 0 ? "Available" : "Out of Stock"}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((s) => {
                        const outOfStock = Number(s.stock) <= 0;
                        return (
                          <button
                            key={s.size}
                            onClick={() => {
                              setSelectedSize(s.size);
                              setQuantity(1);
                              setCartError("");
                            }}
                            className={`min-w-[3rem] px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-150
                              ${outOfStock
                                ? selectedSize === s.size
                                  ? "border-red-400 bg-red-50 text-red-500 line-through"
                                  : "border-red-100 text-red-300 line-through hover:border-red-200 hover:bg-red-50/50"
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
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <button
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-colors"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="w-10 text-center text-sm font-black text-gray-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= maxQuantity}
                          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-colors"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-green-600">
                        In Stock
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart feedback */}
              {cartError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  {cartError}
                </div>
              )}

              {cartSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm">
                  <CheckCircle size={15} className="shrink-0" />
                  {cartSuccess}
                </div>
              )}

              {/* Action Buttons — desktop / tablet inline */}
              <div className="hidden lg:flex items-stretch gap-3 pt-2">
                <button
                  onClick={handleBuyNow}
                  disabled={buyLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-all duration-150
                    ${canTransact
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-500"}
                    ${buyLoading ? "opacity-70 cursor-wait" : ""}`}
                >
                  <Zap size={16} className="fill-current" />
                  {!canTransact ? "Out of Stock" : "Buy Now"}
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border-2 active:scale-[0.98] transition-all duration-150
                    ${canTransact
                      ? "bg-white border-blue-600 text-blue-600 hover:bg-blue-50"
                      : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"}
                    ${cartLoading ? "opacity-70 cursor-wait" : ""}`}
                >
                  {cartLoading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <ShoppingBag size={16} />
                  )}
                  {cartLoading ? "Adding..." : "Add to Cart"}
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="flex items-center justify-center px-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-xl transition-all duration-150"
                  aria-label="View cart"
                >
                  <ShoppingCart size={18} />
                </button>
              </div>

              {/* Static WhatsApp enquiry — desktop / tablet, only when unavailable */}
              {!canTransact && (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden lg:flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-green-200 active:scale-[0.98] transition-all duration-150"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Check Availability on WhatsApp
                </a>
              )}

              {/* Stock info */}
              <div className="hidden lg:flex items-center gap-2 text-xs pt-1">
                <Package size={13} className="text-gray-400" />
                <span className={`font-bold ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
                  {isOutOfStock ? "Out of Stock" : "Available"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock info — mobile/tablet, shown under card */}
        <div className="flex lg:hidden items-center gap-2 text-xs px-1">
          <Package size={13} className="text-gray-400" />
          <span className={`font-bold ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
            {isOutOfStock ? "Out of Stock" : "Available"}
          </span>
        </div>

        {/* Static WhatsApp enquiry — mobile / tablet, only when unavailable */}
        {!canTransact && (
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="lg:hidden flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-green-200 active:scale-[0.98] transition-all duration-150"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Check Availability on WhatsApp
          </a>
        )}
      </div>

      {/* Sticky action bar — mobile / tablet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 shrink-0 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition-colors"
            aria-label="View cart"
          >
            <ShoppingCart size={18} />
          </button>

          <button
            onClick={handleAddToCart}
            disabled={cartLoading}
            className={`flex-1 flex items-center justify-center gap-2 h-12 sm:h-14 rounded-xl font-bold text-sm border-2 active:scale-[0.98] transition-all duration-150
              ${canTransact
                ? "bg-white border-blue-600 text-blue-600 hover:bg-blue-50"
                : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"}
              ${cartLoading ? "opacity-70 cursor-wait" : ""}`}
          >
            {cartLoading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <ShoppingBag size={16} />
            )}
            <span className="hidden xs:inline sm:inline">{cartLoading ? "Adding..." : "Add to Cart"}</span>
          </button>

          <button
            onClick={handleBuyNow}
            disabled={buyLoading}
            className={`flex-1 flex items-center justify-center gap-2 h-12 sm:h-14 rounded-xl font-bold text-sm active:scale-[0.98] transition-all duration-150
              ${canTransact
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-500"}
              ${buyLoading ? "opacity-70 cursor-wait" : ""}`}
          >
            <Zap size={16} className="fill-current" />
            {!canTransact ? "Out of Stock" : "Buy Now"}
          </button>
        </div>
      </div>

      {/* WhatsApp availability popup — shown when Buy Now / Add to Cart is
          clicked on an unavailable / out-of-stock item */}
      {showWhatsAppModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-4"
          onClick={() => setShowWhatsAppModal(false)}
        >
          <div
            className="bg-white rounded-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                <WhatsAppIcon className="w-6 h-6 text-green-600" />
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 -mr-1 -mt-1 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                <MessageCircleQuestion size={16} className="text-gray-400" />
                {!isAvailable
                  ? "This item is currently unavailable"
                  : selectedSizeOutOfStock
                    ? `Size ${selectedSize} is out of stock`
                    : "This item is out of stock"}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We're sorry — <span className="font-semibold text-gray-700">{product.name}</span>
                {selectedSize ? ` (Size ${selectedSize})` : ""} isn't ready to ship right now.
                Message us on WhatsApp and we'll check availability or notify you when it's back.
              </p>
            </div>

            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowWhatsAppModal(false)}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-green-200 active:scale-[0.98] transition-all duration-150"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Ask on WhatsApp
            </a>

            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="w-full text-center text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductView;