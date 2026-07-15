import { useEffect, useState } from "react";
import { Plus, Minus, X, Package, Loader2, FilePlus2 } from "lucide-react";
import API from "../api/axios";
import { ORDER_STATUSES } from "./constants";

/* ─────────────────────────────────────────────
   CREATE ORDER TAB
   Admin manually builds an order for any customer:
   picks products/sizes/quantities, enters customer
   details as a guest, and sets the order + payment
   status directly at creation time.

   Expects a backend endpoint:
   POST /api/v1/orders/admin/create
   Body: {
     customerName, mobileNumber, email,
     deliveryAddress, city, pincode,
     orderItems: [{ product, size, quantity, price }],
     totalAmount, orderStatus, paymentMethod, paymentStatus
   }
───────────────────────────────────────────── */
const CreateOrder = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [customer, setCustomer] = useState({
    customerName: "", mobileNumber: "", email: "",
    deliveryAddress: "", city: "", pincode: "",
  });

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [orderItems, setOrderItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState("placed");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/api/v1/products");
      setProducts(res.data.data || []);
    } catch { showToast("Failed to fetch products", "error"); }
    finally { setLoadingProducts(false); }
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);
  const availableSizes = selectedProduct?.sizes || [];
  const selectedSizeObj = availableSizes.find(s => s.size === selectedSize);
  const isMobileValid = /^[0-9]{10}$/.test(customer.mobileNumber);

  const handleAddItem = () => {
    if (!selectedProduct || !selectedSize) {
      showToast("Select a product and size", "error");
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty < 1) {
      showToast("Quantity must be at least 1", "error");
      return;
    }

    setOrderItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.productId === selectedProduct._id && i.size === selectedSize
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + qty };
        return updated;
      }
      return [...prev, {
        productId: selectedProduct._id,
        name: selectedProduct.name,
        image: selectedProduct.images?.[0],
        size: selectedSize,
        price: selectedSizeObj?.price || 0,
        quantity: qty,
        stock: selectedSizeObj?.stock ?? 0,
      }];
    });

    setSelectedProductId("");
    setSelectedSize("");
    setQuantity(1);
  };

  const updateItemQty = (index, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setOrderItems(prev => prev.map((it, i) => i === index ? { ...it, quantity: q } : it));
  };

  const removeItem = (index) => setOrderItems(prev => prev.filter((_, i) => i !== index));

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const resetForm = () => {
    setCustomer({ customerName: "", mobileNumber: "", email: "", deliveryAddress: "", city: "", pincode: "" });
    setOrderItems([]);
    setOrderStatus("placed");
    setPaymentMethod("cod");
    setPaymentStatus("pending");
    setSelectedProductId("");
    setSelectedSize("");
    setQuantity(1);
  };

  const handleSubmit = async () => {
    if (!customer.customerName || !customer.mobileNumber || !customer.deliveryAddress || !customer.city) {
      showToast("Name, mobile number, address and city are required", "error");
      return;
    }
    if (!isMobileValid) {
      showToast("Enter a valid 10-digit mobile number", "error");
      return;
    }
    if (orderItems.length === 0) {
      showToast("Add at least one product to the order", "error");
      return;
    }

    setSubmitting(true);
    try {
      await API.post("/api/v1/orders/admin/create", {
        customerName: customer.customerName,
        mobileNumber: customer.mobileNumber,
        email: customer.email,
        deliveryAddress: customer.deliveryAddress,
        city: customer.city,
        pincode: customer.pincode,
        orderItems: orderItems.map(i => ({
          product: i.productId,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
        })),
        totalAmount,
        orderStatus,
        paymentMethod,
        paymentStatus,
      });
      showToast("Order created successfully", "success");
      resetForm();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProducts) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Customer details */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900">Customer Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Customer Name *</label>
            <input value={customer.customerName}
              onChange={e => setCustomer({ ...customer, customerName: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Mobile Number *</label>
            <input value={customer.mobileNumber} maxLength={10}
              onChange={e => setCustomer({ ...customer, mobileNumber: e.target.value.replace(/\D/g, "") })}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent
                ${customer.mobileNumber && !isMobileValid ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"}`} />
            {customer.mobileNumber && (
              <p className={`text-xs pl-0.5 ${isMobileValid ? "text-green-500" : "text-gray-400"}`}>
                {customer.mobileNumber.length}/10 {isMobileValid && "✓"}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Email <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="email" value={customer.email}
              onChange={e => setCustomer({ ...customer, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">City *</label>
            <input value={customer.city}
              onChange={e => setCustomer({ ...customer, city: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-600">Delivery Address *</label>
            <textarea rows={2} value={customer.deliveryAddress}
              onChange={e => setCustomer({ ...customer, deliveryAddress: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Pincode <span className="text-gray-400 font-normal">(optional)</span></label>
            <input value={customer.pincode} maxLength={6}
              onChange={e => setCustomer({ ...customer, pincode: e.target.value.replace(/\D/g, "") })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Add products */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900">Add Products</h3>
        {products.length === 0 ? (
          <p className="text-xs text-gray-400">No products available. Add products first.</p>
        ) : (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-600">Product</label>
              <select value={selectedProductId}
                onChange={e => { setSelectedProductId(e.target.value); setSelectedSize(""); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select product</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}{!p.isAvailable ? " (hidden)" : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-600">Size</label>
              <select value={selectedSize} disabled={!selectedProduct}
                onChange={e => setSelectedSize(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50">
                <option value="">Select size</option>
                {availableSizes.map(s => (
                  <option key={s.size} value={s.size}>{s.size} — ₹{s.price} ({s.stock} in stock)</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 w-24">
              <label className="text-xs font-semibold text-gray-600">Qty</label>
              <input type="number" min={1} value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleAddItem}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              <Plus size={15} /> Add
            </button>
          </div>
        )}

        {/* Selected items list */}
        {orderItems.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-50">
            {orderItems.map((item, i) => (
              <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 flex-wrap">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-gray-300" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">Size {item.size} · ₹{item.price} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateItemQty(i, item.quantity - 1)}
                    className="p-1 border border-gray-200 rounded-lg hover:bg-white"><Minus size={12} /></button>
                  <input type="number" value={item.quantity} min={1}
                    onChange={e => updateItemQty(i, e.target.value)}
                    className="w-12 text-center text-xs border border-gray-200 rounded-lg py-1" />
                  <button onClick={() => updateItemQty(i, item.quantity + 1)}
                    className="p-1 border border-gray-200 rounded-lg hover:bg-white"><Plus size={12} /></button>
                </div>
                <p className="text-xs font-black text-blue-600 w-16 text-right">₹{item.price * item.quantity}</p>
                <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order settings */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900">Order Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Order Status</label>
            <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white capitalize">
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Payment Status</label>
            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refund_initiated">Refund Initiated</option>
              <option value="refund_completed">Refund Completed</option>
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-600">Payment Method</label>
            <div className="flex gap-3">
              {["cod", "online"].map(m => (
                <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                  className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl text-xs font-semibold transition-all
                    ${paymentMethod === m ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {m === "cod" ? "Cash on Delivery" : "Online Payment"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-sm font-semibold text-gray-600">Total Amount</span>
          <span className="text-lg font-black text-blue-600">₹{totalAmount}</span>
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
          {submitting
            ? <><Loader2 size={15} className="animate-spin" /> Creating Order...</>
            : <><FilePlus2 size={15} /> Create Order</>}
        </button>
      </div>
    </div>
  );
};

export default CreateOrder;