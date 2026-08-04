import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

// Tab config pulled from constants.js
import { TABS } from "../Admin/constants";

// Component imports — one per tab/section
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
  const [statsLoading, setStatsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Refs for the mobile tab strip — used to auto-scroll the active tab
  // into view whenever it changes, so switching tabs never leaves you
  // wondering if the pill you picked actually registered off-screen.
  const tabRefs = useRef({});

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/"); return; }
    fetchStats();
    // Poll every 30s so a new pending order shows up without a reload
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeTab]);

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
        totalUsers:      usersRes.data.data,
        totalOrders:     ordersRes.data.data,
        totalProducts:   productsRes.data.data,
        totalRevenue:    revenueRes.data.data,
        pendingOrders:   pendingRes.data.data,
        cancelledOrders: "—",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setStatsLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const pendingCount = Number(stats.pendingOrders) || 0;
  const activeLabel = TABS.find((t) => t.id === activeTab)?.label ?? "";

  return (
    <div className="min-h-screen bg-gray-50 md:flex md:items-start">

      {/* Sidebar — sticky, scoped to this page only. Scrolls away before any footer below it. */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:sticky md:top-0 md:h-screen border-r border-gray-100 bg-white">
        <div className="px-5 py-5 border-b border-gray-100">
          <h1 className="text-lg font-black text-gray-900 tracking-tight">Admin</h1>
          <p className="text-xs text-gray-400 mt-0.5 truncate">Welcome back, {user?.username}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const showBadge = id === "orders" && pendingCount > 0;
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors
                  ${isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
              >
                <Icon size={17} className="shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {showBadge && (
                  <span
                    className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full
                               bg-red-500 text-white text-[11px] font-bold leading-none"
                    title={`${pendingCount} pending order${pendingCount > 1 ? "s" : ""}`}
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => navigate("/")}
            className="w-full text-xs font-semibold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all"
          >
            ← Back to Store
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="md:hidden">
              <h1 className="text-lg font-black text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-400">Welcome back, {user?.username}</p>
            </div>
            <div className="hidden md:block">
              <h2 className="text-base font-bold text-gray-900">{activeLabel}</h2>
            </div>
            <button
              onClick={() => navigate("/")}
              className="md:hidden text-xs font-semibold text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all shrink-0"
            >
              ← Store
            </button>
            {statsLoading && (
              <span className="hidden md:inline text-xs text-gray-400">Refreshing…</span>
            )}
          </div>
        </header>

        {/* ── Mobile tab strip — segmented pill track with scroll-snap and edge fades ── */}
        <nav className="md:hidden sticky top-[65px] z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-3 py-2.5">
          <div className="relative">
            {/* Edge fades hint there's more to scroll without needing an arrow icon */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-gray-100 to-transparent z-10 rounded-l-2xl" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-gray-100 to-transparent z-10 rounded-r-2xl" />

            <div
              className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 overflow-x-auto scroll-smooth snap-x snap-proximity
                [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {TABS.map(({ id, label, icon: Icon }) => {
                const showBadge = id === "orders" && pendingCount > 0;
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    ref={(el) => (tabRefs.current[id] = el)}
                    onClick={() => setActiveTab(id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 snap-start
                      transition-all duration-200 active:scale-95
                      ${isActive
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Icon
                      size={15}
                      className={`shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
                    />
                    {label}
                    {showBadge && (
                      <span
                        className={`flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold leading-none shrink-0
                          ${isActive ? "bg-blue-600 text-white" : "bg-red-500 text-white"}`}
                      >
                        {pendingCount > 99 ? "99+" : pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-5xl w-full mx-auto">
          {activeTab === "overview"     && <Overview stats={stats} />}
          {activeTab === "orders"       && <Orders showToast={showToast} />}
          {activeTab === "create-order" && <CreateOrder showToast={showToast} />}
          {activeTab === "products"     && <Products showToast={showToast} />}
          {activeTab === "users"        && <UsersTab showToast={showToast} />}
        </main>
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}