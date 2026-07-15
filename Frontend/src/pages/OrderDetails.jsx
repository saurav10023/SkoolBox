import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Package, MapPin, Phone, CreditCard,
  Clock, CheckCircle, Truck, XCircle, AlertCircle,
  ShoppingBag, Loader2, Ban, Trash2, FileDown
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { generateInvoice } from "../utils/generateInvoice.js";

const STATUS_STEPS = ["placed", "processing", "shipped", "delivered"];

const STATUS_STYLES = {
  placed:     { color: "bg-blue-100 text-blue-700",    icon: <Clock size={14} />,        label: "Placed" },
  processing: { color: "bg-yellow-100 text-yellow-700", icon: <AlertCircle size={14} />, label: "Processing" },
  shipped:    { color: "bg-purple-100 text-purple-700", icon: <Truck size={14} />,       label: "Shipped" },
  delivered:  { color: "bg-green-100 text-green-700",  icon: <CheckCircle size={14} />, label: "Delivered" },
  cancelled:  { color: "bg-red-100 text-red-700",      icon: <XCircle size={14} />,     label: "Cancelled" },
};

const PAYMENT_STATUS_STYLES = {
  pending:          "bg-yellow-100 text-yellow-700",
  paid:             "bg-green-100 text-green-700",
  failed:           "bg-red-100 text-red-700",
  refund_initiated: "bg-orange-100 text-orange-700",
};

// Small reusable confirm dialog — used for both Cancel and Delete so the
// two destructive actions look and behave consistently.
const ConfirmDialog = ({ icon, title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center px-4 py-4">
    <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-gray-900">{title}</p>
          <p className="text-xs text-gray-400">{message}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${confirmColor}`}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  const [cancelling, setCancelling]     = useState(false);
  const [cancelError, setCancelError]   = useState("");
  const [cancelSuccess, setCancelSuccess] = useState("");
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError]     = useState("");

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
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      const res = await API.get(`/api/v1/orders/${id}`);
      setOrder(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelError("");
    setShowConfirmCancel(false);
    try {
      const res = await API.patch(`/api/v1/orders/${id}/cancel`);
      setOrder(res.data.data);
      setCancelSuccess("Order cancelled successfully.");
    } catch (err) {
      setCancelError(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  // Permanently deletes THIS order, then returns to the order list —
  // there's nothing left here to show once it's gone.
  const handleDeleteOrder = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await API.delete(`/api/v1/orders/${id}`);
      navigate("/profile", { state: { orderDeleted: true } });
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete order.");
      setShowConfirmDelete(false);
      setDeleting(false);
    }
  };

  const handlePayNow = async () => {
    setPaymentLoading(true);
    setPaymentError("");

    try {
      const res = await API.post("/api/v1/payment/create-order", {
        orderId: order._id
      });

      const { razorpayOrderId, amount, currency, key } = res.data.data;

      const options = {
        key,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: "Your School Store",
        description: `Order #${order.orderNumber}`,
        handler: async function (response) {
          try {
            const verifyRes = await API.post("/api/v1/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            setOrder(verifyRes.data.data);
          } catch (err) {
            setPaymentError("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: async function () {
            try {
              const failRes = await API.post("/api/v1/payment/failure", {
                razorpay_order_id: razorpayOrderId
              });
              setOrder(failRes.data.data);
              setPaymentError("Payment cancelled. Order has been cancelled.");
            } catch (err) {
              setPaymentError("Something went wrong. Please contact support.");
            }
          }
        },
        prefill: {
          contact: order.phoneNumber,
        },
        theme: { color: "#2563eb" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setPaymentError(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const currentStepIndex = STATUS_STEPS.indexOf(order?.orderStatus);
  const isCancelled = order?.orderStatus === "cancelled";
  const canCancel   = order?.orderStatus === "placed" || order?.orderStatus === "processing";
  const canPay      = order?.paymentMethod === "online" && order?.paymentStatus === "pending" && order?.orderStatus === "placed";
  // Mirrors the backend rule: only delivered/cancelled orders (and no refund
  // in progress) can be permanently deleted.
  const canDelete   = order &&
    ["delivered", "cancelled"].includes(order.orderStatus) &&
    order.paymentStatus !== "refund_initiated";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="h-24 bg-white rounded-2xl border border-gray-100" />
          <div className="h-40 bg-white rounded-2xl border border-gray-100" />
          <div className="h-48 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-500 text-base">{error || "Order not found"}</p>
        <button onClick={() => navigate("/profile")}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
          Back to Profile
        </button>
      </div>
    );
  }

  const status = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.placed;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        <button onClick={() => navigate("/profile")}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">
          <ArrowLeft size={16} /> Back to Profile
        </button>

        {/* Header */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Order</p>
              <h1 className="text-lg sm:text-xl font-black text-gray-900 break-all">
                #{order.orderNumber || order._id.slice(-6).toUpperCase()}
              </h1>
              <p className="text-xs text-gray-400">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                {status.icon} {status.label}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${PAYMENT_STATUS_STYLES[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback messages */}
        {cancelError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} className="shrink-0" /> {cancelError}
          </div>
        )}
        {cancelSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            <CheckCircle size={15} className="shrink-0" /> {cancelSuccess}
          </div>
        )}
        {paymentError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} className="shrink-0" /> {paymentError}
          </div>
        )}
        {deleteError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} className="shrink-0" /> {deleteError}
          </div>
        )}

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 overflow-x-auto">
            <h2 className="text-sm font-black text-gray-900 mb-5">Order Progress</h2>
            <div className="flex items-center justify-between relative min-w-[320px]">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-blue-500 z-0 transition-all duration-500"
                style={{ width: currentStepIndex >= 0 ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` : "0%" }}
              />
              {STATUS_STEPS.map((step, i) => {
                const isDone = i <= currentStepIndex;
                const isActive = i === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center gap-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                      ${isDone ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}
                      ${isActive ? "ring-4 ring-blue-100" : ""}`}>
                      {isDone
                        ? <CheckCircle size={15} className="text-white" />
                        : <div className="w-2 h-2 bg-gray-300 rounded-full" />
                      }
                    </div>
                    <p className={`text-xs font-semibold capitalize text-center ${isDone ? "text-blue-600" : "text-gray-400"}`}>
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-4 sm:px-5 py-4 rounded-2xl">
            <XCircle size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700">Order Cancelled</p>
              <p className="text-xs text-red-500">This order has been cancelled.</p>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 sm:px-5 py-4 border-b border-gray-100">
            <Package size={16} className="text-blue-600" />
            <h2 className="text-sm font-black text-gray-900">Items ({order.orderItems?.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.orderItems?.map((item, i) => {
              const name  = item.product?.name || "Product";
              const image = item.product?.images?.[0];
              return (
                <div key={i} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 cursor-pointer"
                    onClick={() => item.product?._id && navigate(`/products/${item.product._id}`)}
                  >
                    {image ? (
                      <img src={image} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={18} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold text-gray-800 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => item.product?._id && navigate(`/products/${item.product._id}`)}
                    >
                      {name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-lg">
                        Size: {item.size}
                      </span>
                      <span className="text-xs text-gray-400">× {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</p>
                    <p className="text-xs text-gray-400">₹{item.price} each</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 sm:px-5 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-sm font-bold text-gray-700">Order Total</span>
            <span className="text-lg font-black text-blue-600">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Delivery + Payment Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-blue-600" />
              <h3 className="text-sm font-black text-gray-900">Delivery Address</h3>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-800">{order.deliveryAddress}</p>
              <p className="text-xs text-gray-500">{order.city}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <Phone size={11} /> {order.phoneNumber}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-blue-600" />
              <h3 className="text-sm font-black text-gray-900">Payment Info</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Method</span>
                <span className="font-bold text-gray-700 uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${PAYMENT_STATUS_STYLES[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.transactionId && (
                <div className="flex justify-between text-xs gap-2">
                  <span className="text-gray-400 shrink-0">Transaction ID</span>
                  <span className="font-mono text-gray-600 text-xs truncate">{order.transactionId}</span>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div className="flex justify-between text-xs gap-2">
                  <span className="text-gray-400 shrink-0">Payment ID</span>
                  <span className="font-mono text-gray-600 text-xs truncate">{order.razorpayPaymentId}</span>
                </div>
              )}
              <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
                <span className="text-gray-400">Total Paid</span>
                <span className="font-black text-blue-600">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pay Now card */}
        {canPay && (
          <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-bold text-gray-800">Complete your payment</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Your order is reserved. Pay ₹{order.totalAmount} to confirm it.
                </p>
              </div>
              <button
                onClick={handlePayNow}
                disabled={paymentLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                {paymentLoading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <CreditCard size={14} />
                }
                {paymentLoading ? "Loading..." : `Pay ₹${order.totalAmount}`}
              </button>
            </div>
          </div>
        )}

        {/* Cancel Order */}
        {canCancel && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-bold text-gray-800">Need to cancel?</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  You can cancel this order as it hasn't been shipped yet.
                </p>
              </div>
              <button
                onClick={() => setShowConfirmCancel(true)}
                disabled={cancelling}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                {cancelling ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        )}

        {/* Invoice + Delete row */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <button
            onClick={() => generateInvoice(order)}
            className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium w-full sm:w-auto"
          >
            <FileDown size={12} />
            Download Invoice
          </button>

          {/* Permanently delete this order — only once it's in a final
              state, mirroring the backend's own guard. */}
          {canDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={deleting}
              className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-all font-medium disabled:opacity-50 w-full sm:w-auto"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {deleting ? "Deleting..." : "Delete Order"}
            </button>
          )}
        </div>

        {/* Confirm Cancel Modal */}
        {showConfirmCancel && (
          <ConfirmDialog
            icon={<XCircle size={20} className="text-red-500" />}
            title="Cancel Order?"
            message="This action cannot be undone."
            confirmLabel="Yes, Cancel"
            confirmColor="bg-red-500 hover:bg-red-600"
            onCancel={() => setShowConfirmCancel(false)}
            onConfirm={handleCancelOrder}
            loading={cancelling}
          />
        )}

        {/* Confirm Delete Modal */}
        {showConfirmDelete && (
          <ConfirmDialog
            icon={<Trash2 size={20} className="text-red-500" />}
            title="Permanently Delete Order?"
            message="This will remove the order from your history forever. This cannot be undone."
            confirmLabel="Yes, Delete"
            confirmColor="bg-red-600 hover:bg-red-700"
            onCancel={() => setShowConfirmDelete(false)}
            onConfirm={handleDeleteOrder}
            loading={deleting}
          />
        )}

      </div>
    </div>
  );
}