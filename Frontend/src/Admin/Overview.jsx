import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag, Package, Users, TrendingUp, Clock, Ban,
  IndianRupee, Wallet, Smartphone, AlertTriangle, Crown, ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import API from "../api/axios";

/* ═══════════════════════════════════════════════════════════
   API WIRING
   Swap API_BASE / the fetch calls in `loadDashboardData` for
   your real axios instance. If the calls fail (e.g. previewing
   this file standalone, no backend reachable) the dashboard
   falls back to generated demo data so the page never breaks.
═══════════════════════════════════════════════════════════ */

async function fetchJSON(path, params = {}) {
  const res = await API.get(`/api/v1/admin/analytics${path}`, { params });
  return res.data.data; // adjust if your backend's success shape differs
}

async function loadDashboardData() {
  const [
    overviewStats,
    revenueOverTime,
    revenueByCategory,
    paymentSplit,
    sizeDemand,
    stockRisk,
    topCustomers,
  ] = await Promise.all([
    fetchJSON("/overview-stats"),
    fetchJSON("/revenue-over-time", { period: "daily" }),
    fetchJSON("/revenue-by-category"),
    fetchJSON("/payment-split"),
    fetchJSON("/size-demand"),
    fetchJSON("/stock-out-risk"),
    fetchJSON("/orders-by-customer"),
  ]);

  return {
    stats: overviewStats,
    analytics: { revenueOverTime, revenueByCategory, paymentSplit, sizeDemand, stockRisk, topCustomers },
  };
}

/* ─────────────────────────────────────────────
   DEMO DATA — used only if the live API call
   above fails, so this page always renders
   something real-looking.
───────────────────────────────────────────── */
function generateDemoData() {
  const days = 14;
  const revenueOverTime = Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const base = 4000 + Math.sin(i / 2) * 1200;
    const revenue = Math.round(base + Math.random() * 1500);
    return {
      period: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      revenue,
      orderCount: Math.round(revenue / 550),
    };
  });

  const revenueByCategory = [
    { category: "socks", revenue: 182400, unitsSold: 2210 },
    { category: "bags", revenue: 146200, unitsSold: 640 },
    { category: "stationery", revenue: 68300, unitsSold: 1890 },
  ];

  const paymentSplit = [
    { paymentMethod: "cod", orderCount: 320, totalAmount: 168000 },
    { paymentMethod: "online", orderCount: 540, totalAmount: 228900 },
  ];

  const sizeDemand = [
    { product: "Ankle Socks", category: "socks", size: "M", unitsSold: 640 },
    { product: "Ankle Socks", category: "socks", size: "L", unitsSold: 510 },
    { product: "Crew Socks", category: "socks", size: "S", unitsSold: 300 },
    { product: "Tote Bag", category: "bags", size: "One Size", unitsSold: 210 },
    { product: "Backpack", category: "bags", size: "One Size", unitsSold: 180 },
    { product: "Notebook", category: "stationery", size: "A5", unitsSold: 720 },
    { product: "Notebook", category: "stationery", size: "A4", unitsSold: 410 },
  ];

  const stockRisk = [
    { productId: "1", name: "Ankle Socks", category: "socks", size: "M", currentStock: 6, unitsSoldInWindow: 42, daysUntilStockOut: 4 },
    { productId: "2", name: "Tote Bag", category: "bags", size: "One Size", currentStock: 9, unitsSoldInWindow: 18, daysUntilStockOut: 12 },
    { productId: "3", name: "A5 Notebook", category: "stationery", size: "A5", currentStock: 15, unitsSoldInWindow: 20, daysUntilStockOut: 20 },
    { productId: "4", name: "Crew Socks", category: "socks", size: "S", currentStock: 3, unitsSoldInWindow: 0, daysUntilStockOut: null },
  ];

  const topCustomers = [
    { userId: "1", username: "Ritika Sharma", orderCount: 14, totalSpent: 18400, lastOrderDate: new Date(Date.now() - 86400000).toISOString() },
    { userId: "2", username: "Aman Verma", orderCount: 11, totalSpent: 15200, lastOrderDate: new Date(Date.now() - 3 * 86400000).toISOString() },
    { userId: "3", username: "Priya Singh", orderCount: 9, totalSpent: 12100, lastOrderDate: new Date().toISOString() },
    { userId: "4", username: "Rohit Das", orderCount: 8, totalSpent: 9800, lastOrderDate: new Date(Date.now() - 6 * 86400000).toISOString() },
    { userId: "5", username: "Sneha Kapoor", orderCount: 7, totalSpent: 8600, lastOrderDate: new Date(Date.now() - 2 * 86400000).toISOString() },
  ];

  const totalRevenue = revenueOverTime.reduce((a, d) => a + d.revenue, 0);

  return {
    stats: {
      totalOrders: 860,
      totalProducts: 46,
      totalUsers: 512,
      totalRevenue,
      pendingOrders: 23,
      cancelledOrders: 11,
    },
    analytics: { revenueOverTime, revenueByCategory, paymentSplit, sizeDemand, stockRisk, topCustomers },
  };
}

/* ─────────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────────── */
const formatINR = (n) =>
  n === undefined || n === null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`;

const relativeDate = (dateStr) => {
  if (!dateStr) return "—";
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const CATEGORY_COLORS = {
  socks: "#6366F1",
  bags: "#F59E0B",
  stationery: "#14B8A6",
};
const categoryColor = (cat) => CATEGORY_COLORS[cat?.toLowerCase()] || "#94A3B8";

/* ─────────────────────────────────────────────
   MINI SPARKLINE
───────────────────────────────────────────── */
const Sparkline = ({ values, stroke }) => {
  if (!values || values.length < 2) return null;
  const w = 100, h = 28;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible w-16 sm:w-[100px]" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
};

/* ─────────────────────────────────────────────
   SKELETON — shown while data is loading
───────────────────────────────────────────── */
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-16 w-full rounded-2xl" />
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   STOCK ALERT STRIP — Overview quick-glance,
   deep-links into the Analytics tab
───────────────────────────────────────────── */
const StockAlertStrip = ({ stockRisk = [], onViewAll }) => {
  const critical = stockRisk.filter((s) => s.daysUntilStockOut !== null && s.daysUntilStockOut <= 14);
  if (critical.length === 0) return null;
  const preview = critical.slice(0, 2).map((u) => `${u.name} (${u.size})`).join(", ");

  return (
    <button
      onClick={onViewAll}
      className="w-full text-left bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between gap-3 hover:bg-red-100/70 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
          <AlertTriangle size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">
            {critical.length} item{critical.length > 1 ? "s" : ""} running low
          </p>
          <p className="text-xs text-gray-500 truncate">{preview}{critical.length > 2 ? `, +${critical.length - 2} more` : ""}</p>
        </div>
      </div>
      <ChevronRight size={16} className="shrink-0 text-red-400" />
    </button>
  );
};

/* ─────────────────────────────────────────────
   OVERVIEW TAB
───────────────────────────────────────────── */
const Overview = ({ stats = {}, revenueOverTime = [], stockRisk = [], onViewStockRisk }) => {
  const orderTrend = revenueOverTime.map((d) => d.orderCount);
  const revenueTrend = revenueOverTime.map((d) => d.revenue);

  const cards = [
    { label: "Total Orders",   value: stats.totalOrders,                icon: ShoppingBag, color: "bg-blue-50 text-blue-600",     stroke: "#2563EB", trend: orderTrend },
    { label: "Total Products", value: stats.totalProducts,              icon: Package,     color: "bg-purple-50 text-purple-600" },
    { label: "Total Users",    value: stats.totalUsers,                 icon: Users,       color: "bg-green-50 text-green-600" },
    { label: "Revenue",        value: formatINR(stats.totalRevenue),    icon: TrendingUp,  color: "bg-orange-50 text-orange-600", stroke: "#F97316", trend: revenueTrend },
    { label: "Pending Orders", value: stats.pendingOrders,              icon: Clock,       color: "bg-yellow-50 text-yellow-600" },
    { label: "Cancelled",      value: stats.cancelledOrders,            icon: Ban,         color: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="space-y-4">
      <StockAlertStrip stockRisk={stockRisk} onViewAll={onViewStockRisk} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {cards.map(({ label, value, icon: Icon, color, stroke, trend }) => (
          <div
            key={label}
            className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between min-h-[112px]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={17} />
              </div>
              {trend && trend.length > 1 && <Sparkline values={trend} stroke={stroke} />}
            </div>
            <div className="mt-3">
              <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{value ?? "—"}</p>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   KPI STRIP
───────────────────────────────────────────── */
const KpiStrip = ({ revenueOverTime = [], paymentSplit = [] }) => {
  const totalRevenue = revenueOverTime.reduce((a, d) => a + d.revenue, 0);
  const totalOrders = revenueOverTime.reduce((a, d) => a + d.orderCount, 0);
  const aov = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const onlineShare = (() => {
    const totalAmt = paymentSplit.reduce((a, p) => a + p.totalAmount, 0);
    const online = paymentSplit.find((p) => p.paymentMethod === "online")?.totalAmount || 0;
    return totalAmt ? Math.round((online / totalAmt) * 100) : 0;
  })();

  const revenueTrend = revenueOverTime.map((d) => d.revenue);

  const kpis = [
    { label: "Total Revenue",    value: formatINR(totalRevenue), icon: IndianRupee, color: "bg-orange-50 text-orange-600", stroke: "#F97316" },
    { label: "Avg. Order Value", value: formatINR(aov),          icon: Wallet,      color: "bg-blue-50 text-blue-600",     stroke: "#2563EB" },
    { label: "Paid Online",      value: `${onlineShare}%`,       icon: Smartphone,  color: "bg-green-50 text-green-600",   stroke: "#16A34A" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {kpis.map(({ label, value, icon: Icon, color, stroke }) => (
        <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={17} />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-gray-900">{value}</p>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">{label}</p>
            </div>
          </div>
          <div className="hidden xs:block">
            <Sparkline values={revenueTrend} stroke={stroke} />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   REVENUE TREND
───────────────────────────────────────────── */
const RevenueTrendCard = ({ data = [] }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm font-bold text-gray-900">Revenue trend</p>
        <p className="text-xs text-gray-400 font-medium">Paid orders over time</p>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -20, right: 10, top: 5 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#F1F5F9" />
        <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} minTickGap={20} />
        <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          formatter={(v) => [formatINR(v), "Revenue"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #F1F5F9", fontSize: 12 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} fill="url(#revFill)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

/* ─────────────────────────────────────────────
   PAYMENT METHOD SPLIT
───────────────────────────────────────────── */
const PaymentSplitCard = ({ data = [] }) => {
  const chartData = data.map((d) => ({ name: d.paymentMethod === "cod" ? "COD" : "Online", value: d.totalAmount }));
  const colors = { COD: "#F59E0B", Online: "#2563EB" };
  const total = chartData.reduce((a, d) => a + d.value, 0) || 1;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
      <p className="text-sm font-bold text-gray-900 mb-1">Payment split</p>
      <p className="text-xs text-gray-400 font-medium mb-4">COD vs. online, by revenue</p>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={52} paddingAngle={3} strokeWidth={0}>
              {chartData.map((d) => (
                <Cell key={d.name} fill={colors[d.name]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3 flex-1 min-w-0">
          {chartData.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[d.name] }} />
                {d.name}
              </span>
              <span className="font-bold text-gray-900">{Math.round((d.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   REVENUE BY CATEGORY
───────────────────────────────────────────── */
const CategoryRevenueCard = ({ data = [] }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
    <p className="text-sm font-bold text-gray-900 mb-1">Revenue by category</p>
    <p className="text-xs text-gray-400 font-medium mb-4">Socks · bags · stationery</p>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid horizontal={false} stroke="#F1F5F9" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          formatter={(v, key) => [key === "revenue" ? formatINR(v) : v, key === "revenue" ? "Revenue" : "Units"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #F1F5F9", fontSize: 12 }}
        />
        <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={22}>
          {data.map((d) => (
            <Cell key={d.category} fill={categoryColor(d.category)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/* ─────────────────────────────────────────────
   SIZE-WISE DEMAND
───────────────────────────────────────────── */
const SizeDemandCard = ({ data = [] }) => {
  const categories = useMemo(() => ["all", ...new Set(data.map((d) => d.category))], [data]);
  const [active, setActive] = useState("all");

  const filtered = active === "all" ? data : data.filter((d) => d.category === active);

  const bySize = useMemo(() => {
    const map = new Map();
    filtered.forEach((d) => map.set(d.size, (map.get(d.size) || 0) + d.unitsSold));
    return [...map.entries()]
      .map(([size, unitsSold]) => ({ size, unitsSold }))
      .sort((a, b) => b.unitsSold - a.unitsSold);
  }, [filtered]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900">Size-wise demand</p>
          <p className="text-xs text-gray-400 font-medium">Units sold by size</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                active === c ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bySize} margin={{ left: -20, right: 10 }}>
          <CartesianGrid vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="size" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip formatter={(v) => [v, "Units sold"]} contentStyle={{ borderRadius: 12, border: "1px solid #F1F5F9", fontSize: 12 }} />
          <Bar dataKey="unitsSold" radius={[8, 8, 0, 0]} fill={active === "all" ? "#6366F1" : categoryColor(active)} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ─────────────────────────────────────────────
   STOCK-OUT RISK
───────────────────────────────────────────── */
const urgency = (days) => {
  if (days === null) return { label: "No recent sales", border: "border-l-gray-300", badge: "bg-gray-50 text-gray-500" };
  if (days <= 7) return { label: `${days}d left`, border: "border-l-red-500", badge: "bg-red-50 text-red-600" };
  if (days <= 14) return { label: `${days}d left`, border: "border-l-orange-500", badge: "bg-orange-50 text-orange-600" };
  return { label: `${days}d left`, border: "border-l-yellow-500", badge: "bg-yellow-50 text-yellow-700" };
};

const StockRiskCard = ({ data = [] }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
    <div className="flex items-center gap-2 mb-1">
      <AlertTriangle size={15} className="text-red-500" />
      <p className="text-sm font-bold text-gray-900">Stock-out risk</p>
    </div>
    <p className="text-xs text-gray-400 font-medium mb-4">Low stock, ranked by how soon it runs out</p>

    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {data.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">Nothing at risk right now.</p>}
      {data.map((item) => {
        const u = urgency(item.daysUntilStockOut);
        return (
          <div
            key={`${item.productId}_${item.size}`}
            className={`flex items-center justify-between gap-3 border-l-4 ${u.border} bg-gray-50/60 rounded-r-xl pl-3 pr-3 py-2.5`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-400 font-medium capitalize">{item.category} · size {item.size} · {item.currentStock} left</p>
            </div>
            <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${u.badge}`}>{u.label}</span>
          </div>
        );
      })}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   TOP CUSTOMERS
───────────────────────────────────────────── */
const TopCustomersCard = ({ data = [] }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
    <div className="flex items-center gap-2 mb-1">
      <Crown size={15} className="text-amber-500" />
      <p className="text-sm font-bold text-gray-900">Top customers</p>
    </div>
    <p className="text-xs text-gray-400 font-medium mb-4">By order count</p>

    <div className="divide-y divide-gray-50">
      {data.slice(0, 6).map((c) => (
        <div key={c.userId} className="flex items-center gap-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {c.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{c.username || "Guest"}</p>
            <p className="text-xs text-gray-400 font-medium">{relativeDate(c.lastOrderDate)} · {formatINR(c.totalSpent)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-black text-gray-900">{c.orderCount}</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">orders</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   ANALYTICS TAB
───────────────────────────────────────────── */
const Analytics = ({ analytics = {} }) => {
  const {
    revenueOverTime = [],
    revenueByCategory = [],
    paymentSplit = [],
    sizeDemand = [],
    stockRisk = [],
    topCustomers = [],
  } = analytics;

  return (
    <div className="space-y-4">
      <KpiStrip revenueOverTime={revenueOverTime} paymentSplit={paymentSplit} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2">
          <RevenueTrendCard data={revenueOverTime} />
        </div>
        <PaymentSplitCard data={paymentSplit} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <CategoryRevenueCard data={revenueByCategory} />
        <SizeDemandCard data={sizeDemand} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <StockRiskCard data={stockRisk} />
        <TopCustomersCard data={topCustomers} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   DASHBOARD SHELL — fetches real data on mount,
   falls back to demo data if the API call fails
───────────────────────────────────────────── */
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "analytics", label: "Analytics" },
];

function stockRiskAlert(analytics) {
  return (analytics?.stockRisk || []).some((s) => s.daysUntilStockOut !== null && s.daysUntilStockOut <= 7);
}

const Dashboard = () => {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [usingDemoData, setUsingDemoData] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { stats: s, analytics: a } = await loadDashboardData();
      setStats(s);
      setAnalytics(a);
      setUsingDemoData(false);
    } catch (err) {
      console.warn("Live analytics fetch failed, showing demo data:", err.message);
      const { stats: s, analytics: a } = generateDemoData();
      setStats(s);
      setAnalytics(a);
      setUsingDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg sm:text-xl font-black text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            title="Refresh"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="flex bg-gray-100 rounded-full p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-1 ${
                  tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {t.label}
                {t.key === "analytics" && stockRiskAlert(analytics) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {usingDemoData && !loading && (
        <div className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          Showing demo data — couldn't reach the analytics API. Point <code className="font-mono">API_BASE</code> at your backend and refresh.
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : tab === "overview" ? (
        <Overview
          stats={stats}
          revenueOverTime={analytics.revenueOverTime}
          stockRisk={analytics.stockRisk}
          onViewStockRisk={() => setTab("analytics")}
        />
      ) : (
        <Analytics analytics={analytics} />
      )}
    </div>
  );
};

export default Dashboard;
export { Overview, Analytics };