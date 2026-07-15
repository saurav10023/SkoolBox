import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MapPin, Phone, Plus, CheckCircle, AlertCircle,
  ChevronRight, ShoppingBag, Loader2, Tag, X, Banknote, Smartphone, Star, Zap
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import API from "../api/axios";

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: <Banknote size={18} className="text-green-600" />,
    selectedColor: "border-green-500 bg-green-50"
  },
  {
    id: "online",
    label: "Online Payment",
    description: "Pay via UPI, Card or Netbanking",
    icon: <Smartphone size={18} className="text-blue-600" />,
    selectedColor: "border-blue-500 bg-blue-50"
  }
];

const EMPTY_NEW = { name: "", phone: "", fullAddress: "", city: "" };

export default function Checkout() {
  const { user } = useAuth();
  const { cart, total, fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Buy Now support ──
  // ProductView's "Buy Now" button navigates here with:
  // state: { buyNow: true, product: { _id, name, image, size, quantity, price } }
  const buyNowProduct = location.state?.buyNow ? location.state.product : null;
  const isBuyNow = !!buyNowProduct;

  // Normalize into a single shape so the rest of the component (summary, total,
  // order payload) doesn't need to branch on isBuyNow everywhere.
  const orderItems = isBuyNow
    ? [{
        productId: buyNowProduct._id,
        name: buyNowProduct.name,
        image: buyNowProduct.image,
        size: buyNowProduct.size,
        quantity: buyNowProduct.quantity,
        price: buyNowProduct.price,
      }]
    : (cart?.items || []).map(item => ({
        productId: item.product?._id,
        name: item.product?.name || "Product",
        image: item.product?.images?.[0],
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      }));

  const orderTotal = isBuyNow
    ? buyNowProduct.price * buyNowProduct.quantity
    : total;

  const [addresses, setAddresses]             = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm]         = useState(false);
  const [newAddress, setNewAddress]           = useState(EMPTY_NEW);
  const [saveNewAddress, setSaveNewAddress]   = useState(false);
  const [paymentMethod, setPaymentMethod]     = useState("cod");
  const [loading, setLoading]                 = useState(true);
  const [placing, setPlacing]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);
  const [placedOrderId, setPlacedOrderId]     = useState(null);

  const isPhoneValid = /^[0-9]{10}$/.test(newAddress.phone);
  const hasAddresses = addresses.length > 0;

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    // Only bounce to /cart when this ISN'T a Buy Now checkout and the cart is empty.
    if (!isBuyNow && (!cart || cart.items?.length === 0)) { navigate("/cart"); return; }
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const res = await API.get("/api/v1/users/addresses");
      const addrs = res.data.data || [];
      setAddresses(addrs);
      if (addrs.length > 0) {
        // auto-select default, else first
        const def = addrs.find(a => a.isDefault) || addrs[0];
        setSelectedAddressId(def._id);
        setShowNewForm(false);
      } else {
        // no saved addresses — must fill form
        setShowNewForm(true);
      }
    } catch {
      setShowNewForm(true);
    } finally {
      setLoading(false);
    }
  };

  const selectedAddress = addresses.find(a => a._id === selectedAddressId);

  const isFormValid = () => {
    if (showNewForm) {
      return (
        newAddress.name.trim() &&
        isPhoneValid &&
        newAddress.fullAddress.trim() &&
        newAddress.city.trim()
      );
    }
    return !!selectedAddressId;
  };

  const getDeliveryDetails = () => {
    if (showNewForm) {
      return {
        phoneNumber: newAddress.phone,
        deliveryAddress: `${newAddress.fullAddress}, ${newAddress.city}`,
        city: newAddress.city
      };
    }
    if (selectedAddress) {
      return {
        phoneNumber: selectedAddress.phone,
        deliveryAddress: selectedAddress.fullAddress,
        city: selectedAddress.fullAddress.split(",").pop()?.trim() || "N/A"
      };
    }
    return null;
  };

  const handlePlaceOrder = async () => {
    const details = getDeliveryDetails();
    if (!details) { setError("Please select or enter a delivery address"); return; }

    setPlacing(true);
    setError("");

    try {
      // Save new address if user opted in
      if (showNewForm && saveNewAddress && addresses.length < 5) {
        try {
          const res = await API.post("/api/v1/users/addresses", {
            name: newAddress.name,
            phone: newAddress.phone,
            fullAddress: `${newAddress.fullAddress}, ${newAddress.city}`,
            isDefault: addresses.length === 0 // default if first address
          });
          setAddresses(res.data.data);
        } catch {
          // non-blocking — order still goes through
        }
      }

      // Place order.
      // NOTE: for a Buy Now checkout we explicitly pass `items` + `buyNow: true`
      // so the backend creates an order for just this product/size/quantity
      // instead of pulling the user's full cart. Confirm your /api/v1/orders
      // route on the backend actually supports this — if it currently always
      // builds the order from the cart, it needs a small update to honor an
      // `items` override when present.
      const orderPayload = isBuyNow
        ? {
            ...details,
            paymentMethod,
            buyNow: true,
            items: orderItems.map(({ productId, size, quantity, price }) => ({
              product: productId, size, quantity, price
            })),
          }
        : {
            ...details,
            paymentMethod
          };

      const res = await API.post("/api/v1/orders", orderPayload);

      const order = res.data.data;
      const orderId = order._id;
      setPlacedOrderId(orderId);

      // Only the cart-based flow needs a cart refresh — a Buy Now purchase
      // never touched the cart, so there's nothing to re-fetch/clear there.
      if (!isBuyNow) await fetchCart();

      if (paymentMethod === "cod") {
        setSuccess(true);
        setTimeout(() => navigate(`/orders/${orderId}`), 2500);
        return;
      }

      // Online — Razorpay
      const payRes = await API.post("/api/v1/payment/create-order", { orderId });
      const { razorpayOrderId, amount, currency, key } = payRes.data.data;

      const options = {
        key,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: "The Little Kingdom",
        description: "Order Payment",
        handler: async function (response) {
          try {
            await API.post("/api/v1/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            setSuccess(true);
            setTimeout(() => navigate(`/orders/${orderId}`), 2500);
          } catch {
            setError("Payment verification failed. Check your orders page.");
            navigate(`/orders/${orderId}`);
          }
        },
        modal: {
          ondismiss: async function () {
            try {
              await API.post("/api/v1/payment/failure", { razorpay_order_id: razorpayOrderId });
            } catch {}
            setError("Payment cancelled. Your order has been cancelled.");
            setPlacing(false);
          }
        },
        prefill: { contact: details.phoneNumber },
        theme: { color: "#2563eb" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
      setPlacing(false);
    } finally {
      if (paymentMethod === "cod") setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-5 animate-pulse">
          <div className="md:col-span-2 space-y-4">
            <div className="h-48 bg-white rounded-2xl border border-gray-100" />
            <div className="h-32 bg-white rounded-2xl border border-gray-100" />
          </div>
          <div className="h-64 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-gray-900">Order Placed!</h2>
            <p className="text-sm text-gray-400">
              {paymentMethod === "cod"
                ? "Your order has been placed. Redirecting to order details..."
                : "Payment successful! Redirecting to order details..."}
            </p>
          </div>
          <div className="flex justify-center gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <button onClick={() => navigate(`/orders/${placedOrderId}`)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
            View Order <ChevronRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-5">

        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            Checkout
            {isBuyNow && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                <Zap size={11} className="fill-current" /> Buy Now
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Review your order and complete purchase</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">

            {/* ── Delivery Address ── */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <MapPin size={16} className="text-blue-600" />
                <h2 className="text-sm font-black text-gray-900">Delivery Address</h2>
              </div>

              <div className="p-5 space-y-3">

                {/* Saved addresses */}
                {hasAddresses && !showNewForm && (
                  <>
                    {addresses.map(addr => (
                      <div
                        key={addr._id}
                        onClick={() => setSelectedAddressId(addr._id)}
                        className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-150
                          ${selectedAddressId === addr._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"}`}
                      >
                        {/* Radio dot */}
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all
                          ${selectedAddressId === addr._id ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                          {selectedAddressId === addr._id && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-800">{addr.name}</p>
                            {addr.isDefault && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                <Star size={9} fill="currentColor" /> Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{addr.fullAddress}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Phone size={11} /> {addr.phone}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Add different address toggle */}
                    {addresses.length < 5 && (
                      <button
                        onClick={() => { setShowNewForm(true); setNewAddress(EMPTY_NEW); }}
                        className="w-full flex items-center gap-2 p-4 border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 rounded-xl transition-all text-sm font-semibold"
                      >
                        <Plus size={15} /> Use a different address
                      </button>
                    )}
                  </>
                )}

                {/* New address form */}
                {(showNewForm || !hasAddresses) && (
                  <div className="space-y-3">

                    {/* Back to saved — only if they have saved addresses */}
                    {hasAddresses && (
                      <button
                        onClick={() => { setShowNewForm(false); setSaveNewAddress(false); setNewAddress(EMPTY_NEW); }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <X size={13} /> Cancel — use saved address
                      </button>
                    )}

                    {!hasAddresses && (
                      <p className="text-xs text-gray-500 font-medium">
                        No saved addresses found. Please enter a delivery address.
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Full name *"
                        value={newAddress.name}
                        onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div>
                        <input
                          type="tel"
                          placeholder="Phone number *"
                          maxLength={10}
                          value={newAddress.phone}
                          onChange={e => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, "") })}
                          className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all
                            ${newAddress.phone && !isPhoneValid ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"}`}
                        />
                        {newAddress.phone && (
                          <p className={`text-xs mt-1 pl-1 ${isPhoneValid ? "text-green-500" : "text-gray-400"}`}>
                            {newAddress.phone.length}/10 {isPhoneValid && "✓"}
                          </p>
                        )}
                      </div>
                    </div>

                    <textarea
                      placeholder="House / Flat no., Street, Area *"
                      rows={2}
                      value={newAddress.fullAddress}
                      onChange={e => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <input
                      type="text"
                      placeholder="City *"
                      value={newAddress.city}
                      onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Save for future */}
                    {addresses.length < 5 && (
                      <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input
                          type="checkbox"
                          checked={saveNewAddress}
                          onChange={e => setSaveNewAddress(e.target.checked)}
                          className="w-4 h-4 rounded accent-blue-600"
                        />
                        <span className="text-xs font-semibold text-gray-600">
                          Save this address for future orders
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Payment Method ── */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <Banknote size={16} className="text-blue-600" />
                <h2 className="text-sm font-black text-gray-900">Payment Method</h2>
              </div>
              <div className="p-5 space-y-3">
                {PAYMENT_METHODS.map(method => (
                  <div key={method.id} onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-150
                      ${paymentMethod === method.id ? method.selectedColor : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all
                      ${paymentMethod === method.id ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                      {paymentMethod === method.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      {method.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{method.label}</p>
                      <p className="text-xs text-gray-400">{method.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Order Summary ── */}
          <div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm sticky top-24">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <ShoppingBag size={16} className="text-blue-600" />
                <h2 className="text-sm font-black text-gray-900">Order Summary</h2>
              </div>
              <div className="p-5 space-y-4">

                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {orderItems.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag size={14} className="text-gray-300" />
                            </div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-400">Size: {item.size} × {item.quantity}</p>
                      </div>
                      <p className="text-xs font-black text-gray-800 shrink-0">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{orderTotal}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Delivery</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-blue-600 text-base">₹{orderTotal}</span>
                  </div>
                </div>

                {/* Selected address preview */}
                {!showNewForm && selectedAddress && (
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-0.5">
                    <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <MapPin size={11} className="text-blue-500" /> Delivering to
                    </p>
                    <p className="text-xs text-gray-600">{selectedAddress.name} · {selectedAddress.phone}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{selectedAddress.fullAddress}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <Tag size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Paying via{" "}
                    <span className="font-bold text-gray-700">
                      {paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                    </span>
                  </span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing || !isFormValid()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-200 transition-all duration-200"
                >
                  {placing
                    ? <><Loader2 size={16} className="animate-spin" />
                        {paymentMethod === "cod" ? "Placing Order..." : "Opening Payment..."}</>
                    : <><CheckCircle size={16} /> Place Order</>
                  }
                </button>

                <p className="text-xs text-center text-gray-400">
                  By placing order you agree to our terms
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}