import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, ShoppingBag,
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  AlertCircle, CheckCircle, X, ChevronDown,
  TrendingUp, Clock, Ban, Loader2, Upload, Tag,
  RefreshCw, Eye, EyeOff, ShieldCheck, ShieldOff,
  UserPlus  // ✅ add this
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

/* ─────────────────────────────────────────────
   TABS
───────────────────────────────────────────── */
const TABS = [
  { id: "overview",  label: "Overview",  icon: LayoutDashboard },
  { id: "orders",    label: "Orders",    icon: ShoppingBag },
  { id: "products",  label: "Products",  icon: Package },
  { id: "users",     label: "Users",     icon: Users },
];

const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered"];
const STATUS_COLORS = {
  placed:     "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};
const PAYMENT_COLORS = {
  pending:           "bg-yellow-100 text-yellow-700",
  paid:              "bg-green-100 text-green-700",
  failed:            "bg-red-100 text-red-700",
  refund_initiated:  "bg-orange-100 text-orange-700",
  refund_completed:  "bg-teal-100 text-teal-700",
};

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border
    ${type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
    {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

/* ─────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────── */
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
      <p className="text-sm font-semibold text-gray-800">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
          Confirm
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   OVERVIEW TAB
───────────────────────────────────────────── */
const Overview = ({ stats }) => {
  const cards = [
    { label: "Total Orders",   value: stats.totalOrders,              icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
    { label: "Total Products", value: stats.totalProducts,            icon: Package,     color: "bg-purple-50 text-purple-600" },
    { label: "Total Users",    value: stats.totalUsers,               icon: Users,       color: "bg-green-50 text-green-600" },
    { label: "Revenue (₹)",    value: stats.totalRevenue !== undefined ? `₹${stats.totalRevenue}` : "—", icon: TrendingUp, color: "bg-orange-50 text-orange-600" },
    { label: "Pending Orders", value: stats.pendingOrders,            icon: Clock,       color: "bg-yellow-50 text-yellow-600" },
    { label: "Cancelled",      value: stats.cancelledOrders,          icon: Ban,         color: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={18} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{value ?? "—"}</p>
            <p className="text-xs text-gray-400 font-medium">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   ORDERS TAB
───────────────────────────────────────────── */
const Orders = ({ showToast }) => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [view, setView] = useState("active");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/api/v1/orders/admin/grouped");
      setActiveOrders(res.data.data.active || []);
      setCompletedOrders(res.data.data.completed || []);
    } catch { showToast("Failed to fetch orders", "error"); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await API.patch(`/api/v1/orders/${orderId}/status`, { status });
      const isCompleted = ["delivered", "cancelled"].includes(status);
      if (isCompleted) {
        setActiveOrders(prev => {
          const order = prev.find(o => o._id === orderId);
          if (order) setCompletedOrders(c => [{ ...order, orderStatus: status }, ...c]);
          return prev.filter(o => o._id !== orderId);
        });
      } else {
        setActiveOrders(prev => prev.map(o =>
          o._id === orderId ? { ...o, orderStatus: status } : o
        ));
      }
      showToast("Order status updated", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally { setUpdatingId(null); }
  };

  const handlePaymentStatusChange = async (orderId, paymentStatus) => {
    setUpdatingPaymentId(orderId);
    try {
      await API.patch(`/api/v1/orders/${orderId}/payment-status`, { paymentStatus });
      const updater = prev => prev.map(o => o._id === orderId ? { ...o, paymentStatus } : o);
      setActiveOrders(updater);
      setCompletedOrders(updater);
      showToast("Payment status updated", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update payment status", "error");
    } finally { setUpdatingPaymentId(null); }
  };

  const OrderCard = ({ order, editable }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-black text-gray-900">
            Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {order.user?.username || "Unknown"} · {order.user?.mobileNumber} · {new Date(order.createdAt).toLocaleDateString("en-IN")}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{order.deliveryAddress}, {order.city}</p>
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1
            ${order.paymentMethod === "cod" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
            {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
          </span>
        </div>
        <div className="text-right">
          <p className="text-base font-black text-blue-600">₹{order.totalAmount}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
            {order.paymentStatus}
          </span>
          {order.razorpayPaymentId && (
            <p className="text-xs text-gray-400 font-mono mt-0.5">{order.razorpayPaymentId}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {order.orderItems?.map((item, i) => (
          <span key={i} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-1 rounded-lg">
            {item.product?.name || "Product"} ({item.size}) × {item.quantity}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-600"}`}>
          {order.orderStatus}
        </span>
        {editable && (
          <div className="flex gap-1.5 flex-wrap">
            {ORDER_STATUSES.filter(s => s !== order.orderStatus).map(s => (
              <button key={s}
                onClick={() => handleStatusChange(order._id, s)}
                disabled={updatingId === order._id}
                className="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 font-medium capitalize"
              >
                {updatingId === order._id
                  ? <Loader2 size={11} className="animate-spin" />
                  : `→ ${s}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-50 flex-wrap">
        <span className="text-xs text-gray-400 font-medium">Payment:</span>
        {editable ? (
          <div className="relative">
            <select
              value={order.paymentStatus}
              disabled={updatingPaymentId === order._id}
              onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
              className="text-xs pl-2 pr-6 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium appearance-none cursor-pointer hover:border-blue-300 transition-colors disabled:opacity-50"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refund_initiated">Refund Initiated</option>
              <option value="refund_completed">Refund Completed</option>
            </select>
            {updatingPaymentId === order._id && (
              <Loader2 size={11} className="animate-spin absolute right-1.5 top-1/2 -translate-y-1/2 text-blue-500" />
            )}
          </div>
        ) : (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
            {order.paymentStatus}
          </span>
        )}
      </div>
    </div>
  );

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  const currentOrders = view === "active" ? activeOrders : completedOrders;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setView("active")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
            ${view === "active"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-400 hover:text-gray-600"}`}
        >
          <Clock size={14} />
          Active
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
            ${view === "active" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
            {activeOrders.length}
          </span>
        </button>
        <button
          onClick={() => setView("completed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
            ${view === "completed"
              ? "bg-white text-green-600 shadow-sm"
              : "text-gray-400 hover:text-gray-600"}`}
        >
          <CheckCircle size={14} />
          Completed
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
            ${view === "completed" ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}>
            {completedOrders.length}
          </span>
        </button>
      </div>

      <div className="space-y-3">
        {currentOrders.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2 bg-white border border-gray-100 rounded-2xl">
            <ShoppingBag size={28} className="text-gray-200" />
            <p className="text-gray-400 text-sm">
              {view === "active" ? "No active orders" : "No completed orders yet"}
            </p>
          </div>
        ) : currentOrders.map(order => (
          <OrderCard key={order._id} order={order} editable={view === "active"} />
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PRODUCT FORM MODAL
───────────────────────────────────────────── */
const ProductModal = ({ product, onClose, onSave, showToast }) => {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "",
    sizes: product?.sizes?.map(s => ({ size: s.size, price: s.price, stock: s.stock })) || [{ size: "", price: "", stock: "" }],
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState(product?.images || []);
  const [loading, setLoading] = useState(false);

  const handleSizeChange = (i, field, val) => {
    const updated = [...form.sizes];
    updated[i][field] = val;
    setForm({ ...form, sizes: updated });
  };

  const addSize = () => setForm({ ...form, sizes: [...form.sizes, { size: "", price: "", stock: "" }] });
  const removeSize = (i) => setForm({ ...form, sizes: form.sizes.filter((_, idx) => idx !== i) });

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || form.sizes.length === 0) {
      showToast("Name, category and at least one size are required", "error");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("category", form.category.toLowerCase().trim());
      data.append("sizes", JSON.stringify(form.sizes));
      images.forEach(img => data.append("images", img));

      if (isEdit) {
        await API.patch(`/api/v1/products/${product._id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Product updated", "success");
      } else {
        await API.post("/api/v1/products", data, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Product created", "success");
      }
      onSave();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save product", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-black text-gray-900">{isEdit ? "Edit Product" : "Add Product"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Product Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Category *</label>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. uniform, bag, stationery"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">Sizes *</label>
              <button onClick={addSize} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Size
              </button>
            </div>
            {form.sizes.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={s.size} onChange={e => handleSizeChange(i, "size", e.target.value)}
                  placeholder="Size" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={s.price} onChange={e => handleSizeChange(i, "price", e.target.value)}
                  placeholder="Price ₹" type="number" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={s.stock} onChange={e => handleSizeChange(i, "stock", e.target.value)}
                  placeholder="Stock" type="number" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form.sizes.length > 1 && (
                  <button onClick={() => removeSize(i)} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">Images (max 5)</label>
            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl px-4 py-3 transition-colors">
              <Upload size={15} className="text-gray-400" />
              <span className="text-xs text-gray-400">Click to upload images</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>
            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {previews.map((p, i) => (
                  <img key={i} src={p} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   STOCK MODAL
───────────────────────────────────────────── */
const StockModal = ({ product, onClose, showToast, onSave }) => {
  const [stocks, setStocks] = useState(
    product.sizes.map(s => ({ size: s.size, stock: s.stock }))
  );
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (size, stock) => {
    setLoading(true);
    try {
      await API.patch(`/api/v1/products/${product._id}/stock`, { size, stock: Number(stock) });
      showToast(`Stock updated for size ${size}`, "success");
      onSave();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update stock", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-black text-gray-900">Update Stock — {product.name}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {stocks.map((s, i) => (
            <div key={s.size} className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700 w-16">{s.size}</span>
              <input
                type="number"
                value={s.stock}
                min={0}
                onChange={e => {
                  const updated = [...stocks];
                  updated[i].stock = e.target.value;
                  setStocks(updated);
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleUpdate(s.size, s.stock)}
                disabled={loading}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PRODUCTS TAB
───────────────────────────────────────────── */
const Products = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/api/v1/products");
      setProducts(res.data.data || []);
    } catch { showToast("Failed to fetch products", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/api/v1/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      showToast("Product deleted", "success");
    } catch { showToast("Failed to delete product", "error"); }
    finally { setConfirm(null); }
  };

  const handleToggle = async (product) => {
    try {
      const res = await API.patch(`/api/v1/products/${product._id}/toggle-availability`);
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isAvailable: res.data.data.isAvailable } : p));
      showToast(`Product ${res.data.data.isAvailable ? "enabled" : "disabled"}`, "success");
    } catch { showToast("Failed to toggle availability", "error"); }
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">{products.length} products</p>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <Package size={32} className="text-gray-200" />
          <p className="text-gray-400 text-sm">No products yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {products.map(product => {
            const minPrice = product.sizes?.length ? Math.min(...product.sizes.map(s => s.price)) : null;
            const totalStock = product.sizes?.reduce((a, s) => a + s.stock, 0) || 0;

            return (
              <div key={product._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{product.category}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-blue-600 font-bold">
                        <Tag size={11} /> {minPrice !== null ? `₹${minPrice}` : "—"}
                      </span>
                      <span className="text-xs text-gray-400">{totalStock} in stock</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${product.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {product.isAvailable ? "Active" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setEditProduct(product)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all font-medium">
                    <Pencil size={11} /> Edit
                  </button>
                  <button onClick={() => setStockProduct(product)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all font-medium">
                    <RefreshCw size={11} /> Stock
                  </button>
                  <button onClick={() => handleToggle(product)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg transition-all font-medium
                      ${product.isAvailable
                        ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                        : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                    {product.isAvailable ? <EyeOff size={11} /> : <Eye size={11} />}
                    {product.isAvailable ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => setConfirm(product._id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-all font-medium">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && <ProductModal onClose={() => setShowAddModal(false)} onSave={fetchProducts} showToast={showToast} />}
      {editProduct && <ProductModal product={editProduct} onClose={() => setEditProduct(null)} onSave={fetchProducts} showToast={showToast} />}
      {stockProduct && <StockModal product={stockProduct} onClose={() => setStockProduct(null)} onSave={fetchProducts} showToast={showToast} />}
      {confirm && <ConfirmModal message="Delete this product? This cannot be undone." onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
};

/* ─────────────────────────────────────────────
   USERS TAB
───────────────────────────────────────────── */
const UsersTab = ({ showToast }) => {
  const [regularUsers, setRegularUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("users");
  const [actionId, setActionId] = useState(null);
  const [toggleAdminId, setToggleAdminId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Create user state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [createData, setCreateData] = useState({
    username: "", password: "", mobileNumber: "", email: "", role: "user"
  });
  const [createError, setCreateError] = useState("");

  const isMobileValid = /^[0-9]{10}$/.test(createData.mobileNumber);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [usersRes, adminsRes] = await Promise.all([
        API.get("/api/v1/users/admin/users"),
        API.get("/api/v1/users/admin/admins"),
      ]);
      setRegularUsers(usersRes.data.data || []);
      setAdmins(adminsRes.data.data || []);
    } catch { showToast("Failed to fetch users", "error"); }
    finally { setLoading(false); }
  };

  const updateBoth = (userId, patch) => {
    setRegularUsers(prev => prev.map(u => u._id === userId ? { ...u, ...patch } : u));
    setAdmins(prev => prev.map(u => u._id === userId ? { ...u, ...patch } : u));
  };

  const handleToggleBlock = async (userId) => {
    setActionId(userId);
    try {
      const res = await API.patch(`/api/v1/users/admin/users/${userId}/block`);
      updateBoth(userId, { isBlocked: res.data.data.isBlocked });
      showToast(`User ${res.data.data.isBlocked ? "blocked" : "unblocked"}`, "success");
    } catch { showToast("Failed to update user", "error"); }
    finally { setActionId(null); }
  };

  const handleToggleAdmin = async (userId) => {
    setToggleAdminId(userId);
    try {
      const res = await API.patch(`/api/v1/users/admin/users/${userId}/toggle-admin`);
      const newRole = res.data.data.role;
      if (newRole === "admin") {
        setRegularUsers(prev => {
          const user = prev.find(u => u._id === userId);
          if (user) setAdmins(a => [{ ...user, role: "admin" }, ...a]);
          return prev.filter(u => u._id !== userId);
        });
      } else {
        setAdmins(prev => {
          const user = prev.find(u => u._id === userId);
          if (user) setRegularUsers(a => [{ ...user, role: "user" }, ...a]);
          return prev.filter(u => u._id !== userId);
        });
      }
      showToast(
        `User ${newRole === "admin" ? "promoted to admin" : "demoted to user"}`,
        "success"
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update role", "error");
    } finally { setToggleAdminId(null); }
  };

  const handleDelete = async (userId) => {
    try {
      await API.delete(`/api/v1/users/admin/users/${userId}`);
      setRegularUsers(prev => prev.filter(u => u._id !== userId));
      setAdmins(prev => prev.filter(u => u._id !== userId));
      showToast("User deleted", "success");
    } catch { showToast("Failed to delete user", "error"); }
    finally { setConfirm(null); }
  };

  const handleResetPassword = async () => {
    if (!newPassword) { showToast("Enter a new password", "error"); return; }
    try {
      await API.patch(`/api/v1/users/admin/users/${resetModal}/reset-password`, { newPassword });
      showToast("Password reset successfully", "success");
      setResetModal(null);
      setNewPassword("");
    } catch { showToast("Failed to reset password", "error"); }
  };

  const handleCreateUser = async () => {
    if (!createData.username || !createData.password || !createData.mobileNumber) {
      setCreateError("Username, password and mobile number are required");
      return;
    }
    if (!isMobileValid) {
      setCreateError("Enter a valid 10-digit mobile number");
      return;
    }
    if (createData.password.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const res = await API.post("/api/v1/users/admin/create-user", createData);
      const newUser = res.data.data;

      // Add to the right list
      if (newUser.role === "admin") {
        setAdmins(prev => [newUser, ...prev]);
      } else {
        setRegularUsers(prev => [newUser, ...prev]);
      }

      showToast("User created successfully", "success");
      setShowCreateForm(false);
      setCreateData({ username: "", password: "", mobileNumber: "", email: "", role: "user" });

      // Switch to the relevant tab
      setView(newUser.role === "admin" ? "admins" : "users");
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const UserCard = ({ user }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <img src={user.avatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
          <div>
            <p className="text-sm font-bold text-gray-900 capitalize">{user.username}</p>
            <p className="text-xs text-gray-400">{user.mobileNumber} · {user.email || "No email"}</p>
            <p className="text-xs text-gray-400">Joined {new Date(user.createdAt).toLocaleDateString("en-IN")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
            {user.role === "admin" ? "Admin" : "User"}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${user.isBlocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
            {user.isBlocked ? "Blocked" : "Active"}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        <button
          onClick={() => handleToggleBlock(user._id)}
          disabled={actionId === user._id}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg transition-all font-medium disabled:opacity-50
            ${user.isBlocked
              ? "border-green-200 text-green-600 hover:bg-green-50"
              : "border-orange-200 text-orange-600 hover:bg-orange-50"}`}
        >
          {actionId === user._id ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />}
          {user.isBlocked ? "Unblock" : "Block"}
        </button>

        <button
          onClick={() => handleToggleAdmin(user._id)}
          disabled={toggleAdminId === user._id}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg transition-all font-medium disabled:opacity-50
            ${user.role === "admin"
              ? "border-purple-200 text-purple-600 hover:bg-purple-50"
              : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"}`}
        >
          {toggleAdminId === user._id
            ? <Loader2 size={11} className="animate-spin" />
            : user.role === "admin" ? <ShieldOff size={11} /> : <ShieldCheck size={11} />}
          {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
        </button>

        <button
          onClick={() => setResetModal(user._id)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium"
        >
          <RefreshCw size={11} /> Reset Password
        </button>

        <button
          onClick={() => setConfirm(user._id)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-all font-medium"
        >
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  const currentList = view === "users" ? regularUsers : admins;

  return (
    <div className="space-y-4">

      {/* Header row — toggle + create button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setView("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${view === "users" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Users size={14} />
            Users
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${view === "users" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
              {regularUsers.length}
            </span>
          </button>
          <button
            onClick={() => setView("admins")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${view === "admins" ? "bg-white text-purple-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <ShieldCheck size={14} />
            Admins
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${view === "admins" ? "bg-purple-100 text-purple-600" : "bg-gray-200 text-gray-500"}`}>
              {admins.length}
            </span>
          </button>
        </div>

        {/* Create User button */}
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(""); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all
            ${showCreateForm
              ? "bg-gray-100 border-gray-200 text-gray-600"
              : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"}`}
        >
          {showCreateForm ? <><X size={14} /> Cancel</> : <><UserPlus size={14} /> Create User</>}
        </button>
      </div>

      {/* ── Create User Form ── */}
      {showCreateForm && (
        <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus size={15} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Create New User</h3>
              <p className="text-xs text-gray-400">No OTP required — admin creates directly</p>
            </div>
          </div>

          {createError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-xs font-medium">
              <AlertCircle size={13} /> {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. john_doe"
                value={createData.username}
                onChange={e => setCreateData({ ...createData, username: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Mobile */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Mobile Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit number"
                value={createData.mobileNumber}
                onChange={e => setCreateData({ ...createData, mobileNumber: e.target.value.replace(/\D/, "") })}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all
                  ${createData.mobileNumber && !isMobileValid
                    ? "border-red-300 focus:ring-red-400"
                    : "border-gray-200 focus:ring-blue-500"}`}
              />
              {createData.mobileNumber && (
                <p className={`text-xs pl-0.5 ${isMobileValid ? "text-green-500" : "text-gray-400"}`}>
                  {createData.mobileNumber.length}/10 {isMobileValid && "✓"}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCreatePass ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={createData.password}
                  onChange={e => setCreateData({ ...createData, password: e.target.value })}
                  className="w-full px-3 py-2.5 pr-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePass(!showCreatePass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCreatePass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {createData.password && (
                <p className={`text-xs pl-0.5 ${createData.password.length >= 6 ? "text-green-500" : "text-gray-400"}`}>
                  {createData.password.length >= 6 ? "Strong enough ✓" : `${createData.password.length}/6 minimum`}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Email
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="email"
                placeholder="user@email.com"
                value={createData.email}
                onChange={e => setCreateData({ ...createData, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Role</label>
            <div className="flex gap-3">
              {["user", "admin"].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCreateData({ ...createData, role: r })}
                  className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl text-xs font-semibold transition-all capitalize
                    ${createData.role === r
                      ? r === "admin"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                >
                  {r === "admin" ? <ShieldCheck size={13} /> : <Users size={13} />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreateUser}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            {creating
              ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
              : <><UserPlus size={14} /> Create User</>}
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2 bg-white border border-gray-100 rounded-2xl">
            {view === "admins"
              ? <ShieldCheck size={28} className="text-gray-200" />
              : <Users size={28} className="text-gray-200" />}
            <p className="text-gray-400 text-sm">
              {view === "admins" ? "No admins yet" : "No users yet"}
            </p>
          </div>
        ) : currentList.map(user => (
          <UserCard key={user._id} user={user} />
        ))}
      </div>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-black text-gray-900">Reset Password</h3>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setResetModal(null); setNewPassword(""); }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleResetPassword}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          message="Delete this user permanently?"
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};
/* ─────────────────────────────────────────────
   MAIN ADMIN PAGE
───────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/"); return; }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [usersRes, ordersRes, productsRes, revenueRes, pendingRes] = await Promise.all([
        API.get("/api/v1/admin/get-total-users-count"),
        API.get("/api/v1/admin/get-all-orders-count"),
        API.get("/api/v1/admin/get-all-products-count"),
        API.get("/api/v1/admin/get-total-revenue"),
        API.get("/api/v1/admin/get-pending-orders-count"),
      ]);

      setStats({
        totalUsers:     usersRes.data.data,
        totalOrders:    ordersRes.data.data,
        totalProducts:  productsRes.data.data,
        totalRevenue:   revenueRes.data.data,
        pendingOrders:  pendingRes.data.data,
        cancelledOrders: "—",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">Admin Dashboard</h1>
            <p className="text-xs text-gray-400">Welcome back, {user?.username}</p>
          </div>
          <button onClick={() => navigate("/")}
            className="text-xs font-semibold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
            ← Back to Store
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all
                  ${activeTab === id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "overview"  && <Overview stats={stats} />}
        {activeTab === "orders"    && <Orders showToast={showToast} />}
        {activeTab === "products"  && <Products showToast={showToast} />}
        {activeTab === "users"     && <UsersTab showToast={showToast} />}
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}