import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, ShoppingBag,
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  AlertCircle, CheckCircle, X, ChevronDown,
  TrendingUp, Clock, Ban, Loader2, Upload, Tag,
  RefreshCw, Eye, EyeOff, ShieldCheck, ShieldOff,
  UserPlus, FilePlus2, Minus  // ✅ added FilePlus2, Minus for the Create Order section
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

// ✅ Tab config pulled from constants.js
import { TABS } from "../Admin/constants";

// ✅ Component imports — one per tab/section
import Overview from "../Admin/Overview";
import Orders from "../Admin/Orders";
import CreateOrder from "../Admin/CreateOrder";
import Products from "../Admin/Products";
import UsersTab from "../Admin/UsersTab";
import Toast from "../Admin/Toast";

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
        {activeTab === "overview"     && <Overview stats={stats} />}
        {activeTab === "orders"       && <Orders showToast={showToast} />}
        {activeTab === "create-order" && <CreateOrder showToast={showToast} />}
        {activeTab === "products"     && <Products showToast={showToast} />}
        {activeTab === "users"        && <UsersTab showToast={showToast} />}
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}