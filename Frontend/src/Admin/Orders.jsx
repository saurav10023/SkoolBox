import { useEffect, useState } from "react";
import {
  CheckCircle, Clock, Loader2, ShoppingBag, UserCog,
  Phone, MapPin, CalendarDays, Package, IndianRupee, Filter, Trash2, Pencil, X,
} from "lucide-react";
import API from "../api/axios";
import { ORDER_STATUSES, STATUS_COLORS, PAYMENT_COLORS } from "./constants";

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

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/api/v1/orders/admin/grouped");
      setActiveOrders(res.data.data.active || []);
      setCompletedOrders(res.data.data.completed || []);
    } catch { showToast("Failed to fetch orders", "error"); }
    finally { setLoading(false); }
  };

  const toggleEditing = (orderId) => {
    setEditingIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  // Applies a partial update to an order wherever it currently lives, then
  // re-buckets it into Active or Completed based on whether it's actually
  // settled now — so correcting a mistake (e.g. reverting an accidentally
  // "delivered" order) moves it back to Active automatically, and marking
  // an unpaid delivered order "paid" moves it into Completed.
  const applyOrderUpdate = (orderId, updates) => {
    const existing =
      activeOrders.find(o => o._id === orderId) ||
      completedOrders.find(o => o._id === orderId);
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
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    setUpdatingId(orderId);

    try {
      await API.patch(`/api/v1/orders/admin/${orderId}/cancel`);

      const order = activeOrders.find((o) => o._id === orderId);
      const nextPaymentStatus = order?.paymentStatus === "paid"
        ? "refund_initiated"
        : order?.paymentStatus;

      applyOrderUpdate(orderId, {
        orderStatus: "cancelled",
        paymentStatus: nextPaymentStatus,
      });

      showToast("Order cancelled successfully", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to cancel order",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Permanently removes a completed order (delivered/cancelled) — used to
  // sanitize the list of test orders after QA. Backend re-validates the
  // status guard, but we mirror it here too so the button only ever shows
  // where it's actually allowed to succeed.
  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Permanently delete this order? This cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(orderId);

    try {
      await API.delete(`/api/v1/orders/admin/${orderId}`);
      setCompletedOrders((prev) => prev.filter((o) => o._id !== orderId));
      showToast("Order permanently deleted", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete order",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const OrderCard = ({ order, editable, isEditing, onToggleEdit }) => {
    const isManual = !!order.createdByAdmin;
    const customerName = order.user?.username || order.customerName || "Unknown";
    const customerPhone = order.user?.mobileNumber || order.phoneNumber || "—";
    const canDelete = ["delivered", "cancelled"].includes(order.orderStatus)
      && order.paymentStatus !== "refund_initiated";
    // Completed cards are read-only unless explicitly toggled into edit mode.
    const showControls = editable || isEditing;

    return (
      <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all
        ${isEditing ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-100"}`}>

        {/* ── Top strip: order # · source badge · date — always visible, same on every screen ── */}
        <div className={`flex items-center justify-between gap-2 px-4 py-2.5 border-b
          ${isManual ? "bg-purple-50/60 border-purple-100" : "bg-blue-50/40 border-blue-100"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-black text-gray-900 shrink-0">
              #{order.orderNumber || order._id.slice(-6).toUpperCase()}
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0
              ${isManual ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}`}>
              {isManual ? <UserCog size={11} /> : <ShoppingBag size={11} />}
              {isManual ? "Admin Created" : "Customer Order"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
            <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
              <CalendarDays size={11} />
              {new Date(order.createdAt).toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 border-b border-amber-100 text-amber-700 text-xs font-semibold">
            <Pencil size={11} /> Editing — correcting status or payment here will move this order between Active and Completed automatically.
          </div>
        )}

        <div className="p-4 space-y-4">

          {/* ── Customer + amount — stacks on mobile, side-by-side from sm up ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 capitalize truncate">{customerName}</p>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Phone size={11} className="shrink-0" /> {customerPhone}
              </p>
              <p className="flex items-start gap-1 text-xs text-gray-500">
                <MapPin size={11} className="shrink-0 mt-0.5" />
                <span>{order.deliveryAddress}, {order.city}</span>
              </p>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1
                ${order.paymentMethod === "cod" ? "bg-green-50 text-green-600" : "bg-indigo-50 text-indigo-600"}`}>
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
              </span>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 shrink-0 sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
              <span className="flex items-center gap-0.5 text-lg font-black text-blue-600">
                <IndianRupee size={15} />{order.totalAmount}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                {order.paymentStatus}
              </span>
              {order.razorpayPaymentId && (
                <p className="text-[10px] text-gray-400 font-mono">{order.razorpayPaymentId}</p>
              )}
            </div>
          </div>

          {/* ── Items — chip grid, wraps naturally on all screens ── */}
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

          {/* ── Order status — label + current badge + editable control, stacks cleanly on mobile ── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400 font-medium w-16 sm:w-auto">Status:</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-600"}`}>
                {order.orderStatus}
              </span>
            </div>
            {showControls && (
              <div className="flex gap-1.5 flex-wrap sm:ml-auto">
                {ORDER_STATUSES.filter(s => s !== order.orderStatus).map(s => (
                  <button key={s}
                    onClick={() => handleStatusChange(order._id, s)}
                    disabled={updatingId === order._id}
                    className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 font-medium capitalize"
                  >
                    {updatingId === order._id
                      ? <Loader2 size={11} className="animate-spin" />
                      : `→ ${s}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Payment status — matches status row pattern for consistency ── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-gray-50">
            <span className="text-xs text-gray-400 font-medium w-16 sm:w-auto shrink-0">Payment:</span>
            {showControls ? (
              <div className="relative sm:ml-auto">
                <select
                  value={order.paymentStatus}
                  disabled={updatingPaymentId === order._id}
                  onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
                  className="w-full sm:w-auto text-xs pl-2 pr-6 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium appearance-none cursor-pointer hover:border-blue-300 transition-colors disabled:opacity-50"
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
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full sm:ml-auto ${PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                {order.paymentStatus}
              </span>
            )}
          </div>

          {/* Cancel Order — active orders only */}
          {editable &&
            !["cancelled", "shipped", "delivered"].includes(order.orderStatus) && (
              <div className="pt-3 border-t border-gray-50">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    disabled={updatingId === order._id}
                    className="
                      w-full sm:w-auto
                      inline-flex items-center justify-center gap-2
                      px-4 py-2.5
                      rounded-xl
                      border border-red-200
                      bg-red-50
                      text-red-600
                      hover:bg-red-100
                      hover:border-red-300
                      active:scale-[0.98]
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      transition-all duration-200
                      text-sm font-semibold
                      shadow-sm
                    "
                  >
                    {updatingId === order._id ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <Package size={15} />
                        Cancel Order
                      </>
                    )}
                  </button>
                </div>
              </div>
          )}

          {/* Delete Order — completed orders only (delivered/cancelled),
              used to sanitize test/junk orders after QA */}
          {!editable && canDelete && (
            <div className="pt-3 border-t border-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => handleDeleteOrder(order._id)}
                  disabled={deletingId === order._id}
                  className="
                    w-full sm:w-auto
                    inline-flex items-center justify-center gap-2
                    px-4 py-2.5
                    rounded-xl
                    border border-red-200
                    bg-red-50
                    text-red-600
                    hover:bg-red-100
                    hover:border-red-300
                    active:scale-[0.98]
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    transition-all duration-200
                    text-sm font-semibold
                    shadow-sm
                  "
                >
                  {deletingId === order._id ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      Delete Order
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  const baseOrders = view === "active" ? activeOrders : completedOrders;

  // ── Apply source filter (all / admin-created / customer-placed) ──
  const currentOrders = baseOrders.filter(order => {
    if (sourceFilter === "admin") return !!order.createdByAdmin;
    if (sourceFilter === "customer") return !order.createdByAdmin;
    return true;
  });

  // Counts reflect the active/completed set currently in view, unfiltered by source,
  // so switching source filters doesn't make the Active/Completed counts jump around.
  const sourceCounts = {
    all: baseOrders.length,
    admin: baseOrders.filter(o => !!o.createdByAdmin).length,
    customer: baseOrders.filter(o => !o.createdByAdmin).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* ── Active / Completed tabs ── */}
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

        {/* ── Source filter: All / Admin Created / Customer Order — applies within whichever tab is active ── */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <Filter size={13} className="text-gray-400 ml-1.5 shrink-0" />
          <button
            onClick={() => setSourceFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${sourceFilter === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"}`}
          >
            All
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold
              ${sourceFilter === "all" ? "bg-gray-200 text-gray-600" : "bg-gray-200 text-gray-500"}`}>
              {sourceCounts.all}
            </span>
          </button>
          <button
            onClick={() => setSourceFilter("admin")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${sourceFilter === "admin"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600"}`}
          >
            <UserCog size={12} />
            Admin
            <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold
              ${sourceFilter === "admin" ? "bg-purple-100 text-purple-600" : "bg-gray-200 text-gray-500"}`}>
              {sourceCounts.admin}
            </span>
          </button>
          <button
            onClick={() => setSourceFilter("customer")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${sourceFilter === "customer"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600"}`}
          >
            <ShoppingBag size={12} />
            Customer
            <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold
              ${sourceFilter === "customer" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
              {sourceCounts.customer}
            </span>
          </button>
        </div>
      </div>

      {/* ── Grid: 1 col mobile, 1 col tablet (roomier cards read better), 2 col desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {currentOrders.length === 0 ? (
          <div className="lg:col-span-2 flex flex-col items-center py-16 gap-2 bg-white border border-gray-100 rounded-2xl">
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
          />
        ))}
      </div>
    </div>
  );
};

export default Orders;