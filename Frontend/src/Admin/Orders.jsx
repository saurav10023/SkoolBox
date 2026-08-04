import { useEffect, useState } from "react";
import {
  CheckCircle, Clock, Loader2, ShoppingBag, UserCog,
  Phone, MapPin, CalendarDays, Package, IndianRupee, Trash2, Pencil, X,
  Search, SlidersHorizontal, ChevronDown, PackageSearch, Filter,
} from "lucide-react";
import API from "../api/axios";
import { ORDER_STATUSES, STATUS_COLORS, PAYMENT_COLORS } from "./constants";

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refund_initiated", "refund_completed"];
const label = (str) => str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Mirrors the backend's isOrderSettled rule exactly, so the list here never
// disagrees with what the server considers "completed":
//  - delivered orders only count as done once payment is actually paid
//    (or refunded) — a delivered COD order still pending collection isn't done.
//  - cancelled orders count as done unless a refund is actively in progress.
const isOrderSettled = (order) => {
  if (order.orderStatus === "delivered") {
    return ["paid", "refund_completed"].includes(order.paymentStatus);
  }
  if (order.orderStatus === "cancelled") {
    return order.paymentStatus !== "refund_initiated";
  }
  return false;
};

/* Small pill used in the collapsed row — compact version of the full badges */
const Pill = ({ children, className }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${className}`}>
    {children}
  </span>
);

/* ─────────────────────────────────────────────
   ORDERS TAB
───────────────────────────────────────────── */
const Orders = ({ showToast }) => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [view, setView] = useState("active");
  const [sourceFilter, setSourceFilter] = useState("all"); // "all" | "admin" | "customer"
  // Completed orders are read-only by default — an admin has to explicitly
  // opt into editing one, so a status/payment correction is a deliberate
  // action rather than something that can happen by accident.
  const [editingIds, setEditingIds] = useState(new Set());
  // Cards render collapsed by default — tapping the summary row reveals
  // full details (address, items, payment method, controls).
  const [expandedIds, setExpandedIds] = useState(new Set());

  // ── Search & filter state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  const activeFilterCount = [statusFilter, paymentFilter, startDate, endDate].filter(Boolean).length;
  const isSearchMode = searchQuery.trim().length > 0 || activeFilterCount > 0;

  useEffect(() => { fetchOrders(); }, []);

  // Animate the filter sheet in on next frame after mount, so the
  // translate-y transition actually has something to animate from.
  useEffect(() => {
    if (showFilters) {
      const raf = requestAnimationFrame(() => setFilterSheetVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setFilterSheetVisible(false);
  }, [showFilters]);

  // Debounced search — refires on query, filters, or page changes
  useEffect(() => {
    if (!isSearchMode) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(runSearch, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, paymentFilter, startDate, endDate, searchPage]);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/api/v1/orders/admin/grouped");
      setActiveOrders(res.data.data.active || []);
      setCompletedOrders(res.data.data.completed || []);
    } catch { showToast("Failed to fetch orders", "error"); }
    finally { setLoading(false); }
  };

  const runSearch = async () => {
    try {
      const res = await API.get("/api/v1/orders/admin/search", {
        params: {
          query: searchQuery.trim(),
          status: statusFilter || undefined,
          paymentStatus: paymentFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: searchPage,
          limit: 15,
        },
      });
      setSearchResults(res.data.data.orders || []);
      setSearchTotal(res.data.data.pagination?.total ?? 0);
      setSearchTotalPages(res.data.data.pagination?.totalPages ?? 1);
    } catch {
      showToast("Search failed", "error");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleFilterChange = (setter) => (val) => { setter(val); setSearchPage(1); };
  const clearFilters = () => {
    setStatusFilter(""); setPaymentFilter(""); setStartDate(""); setEndDate("");
    setSearchPage(1);
  };
  const clearSearch = () => { setSearchQuery(""); clearFilters(); };

  const toggleEditing = (orderId) => {
    setEditingIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const toggleExpanded = (orderId) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  // Applies a partial update to an order wherever it currently lives — in
  // Active, Completed, or the flat search results — then re-buckets it into
  // Active or Completed based on whether it's actually settled now, and
  // patches it in place within search results too so the search view never
  // shows stale status/payment info after an edit.
  const applyOrderUpdate = (orderId, updates) => {
    const existing =
      activeOrders.find(o => o._id === orderId) ||
      completedOrders.find(o => o._id === orderId) ||
      searchResults.find(o => o._id === orderId);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    const settled = isOrderSettled(updated);

    setActiveOrders(prev => {
      const withoutOrder = prev.filter(o => o._id !== orderId);
      return settled ? withoutOrder : [updated, ...withoutOrder];
    });

    setCompletedOrders(prev => {
      const withoutOrder = prev.filter(o => o._id !== orderId);
      return settled ? [updated, ...withoutOrder] : withoutOrder;
    });

    setSearchResults(prev => prev.map(o => o._id === orderId ? updated : o));
  };

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await API.patch(`/api/v1/orders/admin/${orderId}/status`, { status });
      applyOrderUpdate(orderId, { orderStatus: status });
      showToast("Order status updated", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally { setUpdatingId(null); }
  };

  const handlePaymentStatusChange = async (orderId, paymentStatus) => {
    setUpdatingPaymentId(orderId);
    try {
      await API.patch(`/api/v1/orders/admin/${orderId}/payment-status`, { paymentStatus });
      applyOrderUpdate(orderId, { paymentStatus });
      showToast("Payment status updated", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update payment status", "error");
    } finally { setUpdatingPaymentId(null); }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    setUpdatingId(orderId);
    try {
      await API.patch(`/api/v1/orders/admin/${orderId}/cancel`);

      const order =
        activeOrders.find((o) => o._id === orderId) ||
        searchResults.find((o) => o._id === orderId);
      const nextPaymentStatus = order?.paymentStatus === "paid"
        ? "refund_initiated"
        : order?.paymentStatus;

      applyOrderUpdate(orderId, {
        orderStatus: "cancelled",
        paymentStatus: nextPaymentStatus,
      });

      showToast("Order cancelled successfully", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to cancel order", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Permanently removes a completed order (delivered/cancelled) — used to
  // sanitize the list of test orders after QA. Backend re-validates the
  // status guard, but we mirror it here too so the button only ever shows
  // where it's actually allowed to succeed.
  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm("Permanently delete this order? This cannot be undone.");
    if (!confirmed) return;

    setDeletingId(orderId);
    try {
      await API.delete(`/api/v1/orders/admin/${orderId}`);
      setCompletedOrders((prev) => prev.filter((o) => o._id !== orderId));
      setSearchResults((prev) => prev.filter((o) => o._id !== orderId));
      showToast("Order permanently deleted", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete order", "error");
    } finally {
      setDeletingId(null);
    }
  };

  /* ─────────────────────────────────────────────
     ORDER CARD — collapsed summary + expandable detail
  ───────────────────────────────────────────── */
  const OrderCard = ({ order, editable, isEditing, onToggleEdit, isExpanded, onToggleExpand }) => {
    const isManual = !!order.createdByAdmin;
    const customerName = order.user?.username || order.customerName || "Unknown";
    const customerPhone = order.user?.mobileNumber || order.phoneNumber || "—";
    const canDelete = ["delivered", "cancelled"].includes(order.orderStatus)
      && order.paymentStatus !== "refund_initiated";
    const showControls = editable || isEditing;
    const shortDate = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

    return (
      <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors
        ${isExpanded ? "border-gray-200" : "border-gray-100"}
        ${isEditing ? "ring-2 ring-amber-200 border-amber-300" : ""}`}>

        {/* ── Collapsed summary row — always visible, tap to expand ── */}
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center gap-3 p-3.5 text-left active:bg-gray-50 transition-colors"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
            ${isManual ? "bg-purple-50 text-purple-500" : "bg-blue-50 text-blue-500"}`}>
            {isManual ? <UserCog size={17} /> : <ShoppingBag size={17} />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-sm font-black text-gray-900 shrink-0">
                #{order.orderNumber || order._id.slice(-6).toUpperCase()}
              </span>
              <span className="text-xs text-gray-500 capitalize truncate">{customerName}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Pill className={STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-600"}>
                {order.orderStatus}
              </Pill>
              <Pill className={PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-600"}>
                {label(order.paymentStatus)}
              </Pill>
              <span className="text-[11px] text-gray-400 font-medium">{shortDate}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="flex items-center text-sm font-black text-gray-900">
              <IndianRupee size={13} />{order.totalAmount}
            </span>
            <ChevronDown
              size={16}
              className={`text-gray-300 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {/* ── Expandable detail — CSS-grid accordion, no JS height math ── */}
        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="border-t border-gray-100 p-4 space-y-4">

              {/* Source + edit toggle + full date */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full
                  ${isManual ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}`}>
                  {isManual ? <UserCog size={11} /> : <ShoppingBag size={11} />}
                  {isManual ? "Admin Created" : "Customer Order"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                    <CalendarDays size={11} />
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </span>
                  {!editable && (
                    <button
                      onClick={onToggleEdit}
                      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full transition-colors
                        ${isEditing
                          ? "bg-amber-600 text-white"
                          : "bg-white text-gray-500 border border-gray-200 hover:border-amber-300 hover:text-amber-600"}`}
                    >
                      {isEditing ? <X size={11} /> : <Pencil size={11} />}
                      {isEditing ? "Done" : "Edit"}
                    </button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs font-semibold">
                  <Pencil size={11} className="shrink-0" /> Correcting status or payment here will move this order between Active and Completed automatically.
                </div>
              )}

              {/* Contact + address */}
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Phone size={12} className="shrink-0 text-gray-400" /> {customerPhone}
                </p>
                <p className="flex items-start gap-1.5 text-xs text-gray-600">
                  <MapPin size={12} className="shrink-0 mt-0.5 text-gray-400" />
                  <span>{order.deliveryAddress}, {order.city}</span>
                </p>
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full
                  ${order.paymentMethod === "cod" ? "bg-green-50 text-green-600" : "bg-indigo-50 text-indigo-600"}`}>
                  {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                </span>
                {order.razorpayPaymentId && (
                  <p className="text-[10px] text-gray-400 font-mono pt-1">{order.razorpayPaymentId}</p>
                )}
              </div>

              {/* Items */}
              {order.orderItems?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
                  {order.orderItems.map((item, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                      <Package size={11} className="text-gray-400" />
                      {item.product?.name || "Product"} ({item.size}) × {item.quantity}
                    </span>
                  ))}
                </div>
              )}

              {/* Order status control */}
              {showControls && (
                <div className="pt-3 border-t border-gray-50 space-y-2">
                  <span className="text-xs text-gray-400 font-medium">Update status</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {ORDER_STATUSES.filter(s => s !== order.orderStatus).map(s => (
                      <button key={s}
                        onClick={() => handleStatusChange(order._id, s)}
                        disabled={updatingId === order._id}
                        className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 font-medium capitalize"
                      >
                        {updatingId === order._id
                          ? <Loader2 size={11} className="animate-spin" />
                          : `→ ${s}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment status control */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Payment</span>
                {showControls ? (
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

              {/* Cancel Order */}
              {showControls && !["cancelled", "shipped", "delivered"].includes(order.orderStatus) && (
                <div className="pt-3 border-t border-gray-50 flex justify-end">
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    disabled={updatingId === order._id}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold shadow-sm"
                  >
                    {updatingId === order._id ? (
                      <><Loader2 size={15} className="animate-spin" /> Cancelling...</>
                    ) : (
                      <><Package size={15} /> Cancel Order</>
                    )}
                  </button>
                </div>
              )}

              {/* Delete Order — settled orders only */}
              {!showControls && canDelete && (
                <div className="pt-3 border-t border-gray-50 flex justify-end">
                  <button
                    onClick={() => handleDeleteOrder(order._id)}
                    disabled={deletingId === order._id}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold shadow-sm"
                  >
                    {deletingId === order._id ? (
                      <><Loader2 size={15} className="animate-spin" /> Deleting...</>
                    ) : (
                      <><Trash2 size={15} /> Delete Order</>
                    )}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-[72px] bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  const baseOrders = view === "active" ? activeOrders : completedOrders;

  const currentOrders = baseOrders.filter(order => {
    if (sourceFilter === "admin") return !!order.createdByAdmin;
    if (sourceFilter === "customer") return !order.createdByAdmin;
    return true;
  });

  const sourceCounts = {
    all: baseOrders.length,
    admin: baseOrders.filter(o => !!o.createdByAdmin).length,
    customer: baseOrders.filter(o => !o.createdByAdmin).length,
  };

  return (
    <div className="space-y-4 pb-4">

      {/* ── Search bar ── */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-100 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 rounded-full px-4 py-3 shadow-sm transition-all min-w-0">
          {searching
            ? <Loader2 size={16} className="text-blue-500 animate-spin shrink-0" />
            : <Search size={16} className="text-gray-400 shrink-0" />}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchPage(1); }}
            placeholder="Search orders..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 min-w-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-300 hover:text-gray-500 shrink-0">
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(true)}
          className={`relative flex items-center justify-center w-11 h-11 rounded-full border shrink-0 transition-all
            ${activeFilterCount > 0
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"}`}
        >
          <SlidersHorizontal size={16} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] bg-amber-500 text-white rounded-full font-bold ring-2 ring-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {isSearchMode && !searching && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-400">
            {searchTotal === 0 ? "No orders match your search" : `${searchTotal} order${searchTotal === 1 ? "" : "s"} found`}
          </p>
          <button onClick={clearSearch} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            <X size={12} /> Clear search
          </button>
        </div>
      )}

      {/* ── Filter bottom sheet ── */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setShowFilters(false)}
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${filterSheetVisible ? "opacity-100" : "opacity-0"}`}
          />
          <div
            className={`relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto transition-all duration-300 ease-out
              ${filterSheetVisible ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-6 opacity-0"}`}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                <Filter size={14} /> Filter Orders
              </h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Order Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize bg-white"
                >
                  <option value="">All statuses</option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">{label(s)}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Payment Status</label>
              <div className="relative">
                <select
                  value={paymentFilter}
                  onChange={(e) => handleFilterChange(setPaymentFilter)(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All payment statuses</option>
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{label(s)}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">From</label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => handleFilterChange(setStartDate)(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">To</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => handleFilterChange(setEndDate)(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search results mode ── */}
      {isSearchMode ? (
        <>
          <div className="space-y-2.5">
            {searching ? (
              [1, 2, 3].map(i => <div key={i} className="h-[72px] bg-gray-100 rounded-2xl animate-pulse" />)
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-2 bg-white border border-gray-100 rounded-2xl">
                <PackageSearch size={28} className="text-gray-200" />
                <p className="text-gray-400 text-sm">No orders match your search</p>
              </div>
            ) : searchResults.map(order => {
              const settled = isOrderSettled(order);
              return (
                <OrderCard
                  key={order._id}
                  order={order}
                  editable={!settled}
                  isEditing={editingIds.has(order._id)}
                  onToggleEdit={() => toggleEditing(order._id)}
                  isExpanded={expandedIds.has(order._id)}
                  onToggleExpand={() => toggleExpanded(order._id)}
                />
              );
            })}
          </div>

          {searchTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setSearchPage((p) => Math.max(1, p - 1))}
                disabled={searchPage === 1}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <span className="text-xs text-gray-400">Page {searchPage} of {searchTotalPages}</span>
              <button
                onClick={() => setSearchPage((p) => Math.min(searchTotalPages, p + 1))}
                disabled={searchPage === searchTotalPages}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── Active / Completed — full-width segmented control on mobile ── */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
            <button
              onClick={() => setView("active")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${view === "active" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
            >
              <Clock size={14} />
              Active
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${view === "active" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
                {activeOrders.length}
              </span>
            </button>
            <button
              onClick={() => setView("completed")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${view === "completed" ? "bg-white text-green-600 shadow-sm" : "text-gray-400"}`}
            >
              <CheckCircle size={14} />
              Completed
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${view === "completed" ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}>
                {completedOrders.length}
              </span>
            </button>
          </div>

          {/* ── Source filter — horizontally scrollable chip row, no wrap ── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { key: "all", icon: null, text: "All", count: sourceCounts.all, active: "bg-gray-900 text-white" },
              { key: "admin", icon: UserCog, text: "Admin", count: sourceCounts.admin, active: "bg-purple-600 text-white" },
              { key: "customer", icon: ShoppingBag, text: "Customer", count: sourceCounts.customer, active: "bg-blue-600 text-white" },
            ].map(({ key, icon: Icon, text, count, active }) => (
              <button
                key={key}
                onClick={() => setSourceFilter(key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all
                  ${sourceFilter === key ? `${active} shadow-sm` : "bg-white border border-gray-100 text-gray-500 hover:border-gray-200"}`}
              >
                {Icon && <Icon size={12} />}
                {text}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                  ${sourceFilter === key ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ── List — single column, collapsible cards ── */}
          <div className="space-y-2.5">
            {currentOrders.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-2 bg-white border border-gray-100 rounded-2xl">
                <ShoppingBag size={28} className="text-gray-200" />
                <p className="text-gray-400 text-sm">
                  {sourceFilter === "all"
                    ? (view === "active" ? "No active orders" : "No completed orders yet")
                    : `No ${sourceFilter === "admin" ? "admin-created" : "customer"} orders in ${view === "active" ? "active" : "completed"}`}
                </p>
              </div>
            ) : currentOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                editable={view === "active"}
                isEditing={editingIds.has(order._id)}
                onToggleEdit={() => toggleEditing(order._id)}
                isExpanded={expandedIds.has(order._id)}
                onToggleExpand={() => toggleExpanded(order._id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;