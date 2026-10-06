import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag, Package, Users, TrendingUp, TrendingDown, Clock, Ban,
  AlertTriangle, Crown, ChevronRight, BarChart3, Ruler, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import API from "../api/axios";

/* ═══ API ═══ (unchanged) ═══════════════════════════════════ */
async function fetchJSON(path, params = {}) {
  const res = await API.get(`/api/v1/admin/analytics${path}`, { params });
  return res.data.data;
}

async function loadDashboardData() {
  const [overviewStats, revenueOverTime, revenueByCategory, sizeDemand, stockRisk, topCustomers] = await Promise.all([
    fetchJSON("/overview-stats"),
    fetchJSON("/revenue-over-time", { period: "daily" }),
    fetchJSON("/revenue-by-category"),
    fetchJSON("/size-demand"),
    fetchJSON("/stock-out-risk"),
    fetchJSON("/orders-by-customer"),
  ]);
  return {
    stats: overviewStats,
    analytics: { revenueOverTime, revenueByCategory, sizeDemand, stockRisk, topCustomers },
  };
}

/* Demo data — only used if the live call fails */
function generateDemoData() {
  const days = 14;
  const revenueOverTime = Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const revenue = Math.round(4000 + Math.sin(i / 2) * 1200 + Math.random() * 1500);
    return { period: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), revenue, orderCount: Math.round(revenue / 550) };
  });
  const revenueByCategory = [
    { category: "socks", revenue: 182400, unitsSold: 2210 },
    { category: "bags", revenue: 146200, unitsSold: 640 },
    { category: "stationery", revenue: 68300, unitsSold: 1890 },
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
  const ago = (n) => new Date(Date.now() - n * 86400000).toISOString();
  const topCustomers = [
    { userId: "1", username: "Ritika Sharma", orderCount: 14, totalSpent: 18400, lastOrderDate: ago(1) },
    { userId: "2", username: "Aman Verma", orderCount: 11, totalSpent: 15200, lastOrderDate: ago(3) },
    { userId: "3", username: "Priya Singh", orderCount: 9, totalSpent: 12100, lastOrderDate: ago(0) },
    { userId: "4", username: "Rohit Das", orderCount: 8, totalSpent: 9800, lastOrderDate: ago(6) },
    { userId: "5", username: "Sneha Kapoor", orderCount: 7, totalSpent: 8600, lastOrderDate: ago(2) },
  ];
  return {
    stats: {
      totalOrders: 860, totalProducts: 46, totalUsers: 512,
      totalRevenue: revenueOverTime.reduce((a, d) => a + d.revenue, 0),
      pendingOrders: 23, cancelledOrders: 11,
    },
    analytics: { revenueOverTime, revenueByCategory, sizeDemand, stockRisk, topCustomers },
  };
}

/* ═══ Helpers ═══════════════════════════════════════════════ */
const formatINR = (n) => (n === undefined || n === null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`);

const relativeDate = (dateStr) => {
  if (!dateStr) return "—";
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const CATEGORY_COLORS = { socks: "#6366F1", bags: "#F59E0B", stationery: "#14B8A6" };
const categoryColor = (cat) => CATEGORY_COLORS[cat?.toLowerCase()] || "#94A3B8";

// Accent colours as "r,g,b" so each card can tint its glass via --c
const ACCENT = {
  blue: "37,99,235", purple: "147,51,234", green: "22,163,74", amber: "217,119,6",
  yellow: "202,138,4", red: "220,38,38", indigo: "79,70,229", teal: "13,148,136", gray: "107,114,128",
};

const tooltipStyle = {
  borderRadius: 14, border: "1px solid rgba(255,255,255,0.9)", fontSize: 12,
  background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)",
  boxShadow: "0 12px 28px -14px rgba(37,99,235,0.4)",
};
const axisTick = { fontSize: 11, fill: "#64748B" };

/* ═══ Small building blocks ═════════════════════════════════ */
const Sparkline = ({ values, stroke }) => {
  if (!values || values.length < 2) return null;
  const w = 100, h = 30;
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / range) * (h - 4)]);
  const line = pts.map((p) => p.join(",")).join(" ");
  const id = `sp-${stroke.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 sm:w-24 h-7 overflow-visible" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const SectionLabel = ({ children }) => (
  <p className="text-xs font-semibold text-gray-500 mb-2.5 px-1">{children}</p>
);

const Chip = ({ icon: Icon, accent = "gray", size = "md" }) => (
  <span className={`db-chip ${size === "lg" ? "db-chip--lg" : size === "sm" ? "db-chip--sm" : ""}`} style={{ "--c": ACCENT[accent] }}>
    <Icon size={size === "sm" ? 14 : 16} />
  </span>
);

const CardHeader = ({ icon, accent, title, subtitle, right }) => (
  <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
    <div className="flex items-center gap-3 min-w-0">
      <Chip icon={icon} accent={accent} />
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);

const CardEmptyState = ({ icon: Icon = BarChart3, label = "Nothing to show yet", height = 200 }) => (
  <div className="flex flex-col items-center justify-center gap-2 text-center" style={{ height }}>
    <span className="db-chip db-chip--lg" style={{ "--c": ACCENT.gray }}><Icon size={18} /></span>
    <p className="text-xs text-gray-400 font-medium max-w-[220px]">{label}</p>
  </div>
);

const Skeleton = ({ className = "" }) => <div className={`db-skeleton rounded-3xl ${className}`} />;

const DashboardSkeleton = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
    </div>
    <Skeleton className="h-72" />
  </div>
);

/* ═══ Overview ══════════════════════════════════════════════ */
const StockAlertStrip = ({ stockRisk = [], onViewAll }) => {
  const critical = stockRisk.filter((s) => s.daysUntilStockOut !== null && s.daysUntilStockOut <= 14);
  if (critical.length === 0) return null;
  const preview = critical.slice(0, 2).map((u) => `${u.name} (${u.size})`).join(", ");
  return (
    <button onClick={onViewAll} className="db-alert db-focus group w-full text-left rounded-3xl p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Chip icon={AlertTriangle} accent="red" size="lg" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">{critical.length} item{critical.length > 1 ? "s" : ""} running low</p>
          <p className="text-xs text-gray-500 truncate">{preview}{critical.length > 2 ? `, +${critical.length - 2} more` : ""}</p>
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-red-400 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
};

const Overview = ({ stats = {}, revenueOverTime = [], stockRisk = [], onViewStockRisk }) => {
  const orderTrend = revenueOverTime.map((d) => d.orderCount);
  const revenueTrend = revenueOverTime.map((d) => d.revenue);
  const cards = [
    { label: "Total orders", value: stats.totalOrders, icon: ShoppingBag, accent: "blue", stroke: "#2563EB", trend: orderTrend },
    { label: "Revenue", value: formatINR(stats.totalRevenue), icon: TrendingUp, accent: "amber", stroke: "#D97706", trend: revenueTrend },
    { label: "Total products", value: stats.totalProducts, icon: Package, accent: "purple" },
    { label: "Total users", value: stats.totalUsers, icon: Users, accent: "green" },
    { label: "Pending orders", value: stats.pendingOrders, icon: Clock, accent: "yellow" },
    { label: "Cancelled", value: stats.cancelledOrders, icon: Ban, accent: "red" },
  ];
  return (
    <div className="space-y-4 sm:space-y-5">
      <StockAlertStrip stockRisk={stockRisk} onViewAll={onViewStockRisk} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {cards.map(({ label, value, icon, accent, stroke, trend }) => (
          <div key={label} className="db-card db-card--lift rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[128px]" style={{ "--c": ACCENT[accent] }}>
            <div className="flex items-start justify-between gap-2">
              <Chip icon={icon} accent={accent} size="lg" />
              {trend && trend.length > 1 && <Sparkline values={trend} stroke={stroke} />}
            </div>
            <div className="mt-4">
              <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-none tabular-nums tracking-tight">{value ?? "—"}</p>
              <p className="text-xs text-gray-500 font-medium mt-1.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══ Analytics ═════════════════════════════════════════════ */
const AnalyticsSummaryStrip = ({ revenueByCategory = [], stockRisk = [], topCustomers = [] }) => {
  const topCategory = revenueByCategory.length ? [...revenueByCategory].sort((a, b) => b.revenue - a.revenue)[0] : null;
  const itemsAtRisk = stockRisk.filter((s) => s.daysUntilStockOut !== null && s.daysUntilStockOut <= 14).length;
  const topCustomer = topCustomers[0] || null;
  const totalUnits = revenueByCategory.reduce((a, d) => a + (d.unitsSold || 0), 0);
  const items = [
    { key: "cat", icon: Package, accent: "indigo", label: "Top category", value: topCategory ? topCategory.category : "—", sub: topCategory ? formatINR(topCategory.revenue) : "No sales yet", cap: true },
    { key: "risk", icon: AlertTriangle, accent: itemsAtRisk > 0 ? "red" : "gray", label: "Items at risk", value: itemsAtRisk, sub: itemsAtRisk > 0 ? "Selling out within 14 days" : "Stock looks healthy" },
    { key: "cust", icon: Crown, accent: "amber", label: "Top customer", value: topCustomer ? topCustomer.username : "—", sub: topCustomer ? `${topCustomer.orderCount} orders` : "No repeat buyers yet", cap: true },
    { key: "units", icon: TrendingUp, accent: "green", label: "Units sold", value: totalUnits || "—", sub: "Across all categories" },
  ];
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {items.map(({ key, icon, accent, label, value, sub, cap }) => (
        <div key={key} className="db-card rounded-3xl p-4 min-w-0" style={{ "--c": ACCENT[accent] }}>
          <Chip icon={icon} accent={accent} size="sm" />
          <p className={`text-base font-black text-gray-900 truncate mt-3 ${cap ? "capitalize" : "tabular-nums"}`}>{value}</p>
          <p className="text-xs text-gray-600 font-semibold mt-0.5">{label}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
};

const RevenueTrendCard = ({ data = [] }) => {
  const totalRevenue = data.reduce((a, d) => a + d.revenue, 0);
  const totalOrders = data.reduce((a, d) => a + d.orderCount, 0);
  const aov = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const growth = useMemo(() => {
    if (data.length < 4) return null;
    const half = Math.floor(data.length / 2);
    const prior = data.slice(0, half).reduce((a, d) => a + d.revenue, 0);
    const recent = data.slice(half).reduce((a, d) => a + d.revenue, 0);
    return prior ? Math.round(((recent - prior) / prior) * 100) : null;
  }, [data]);

  return (
    <div className="db-card rounded-3xl p-4 sm:p-6">
      <CardHeader icon={TrendingUp} accent="blue" title="Revenue trend" subtitle={data.length ? `Paid orders over the last ${data.length} days` : "Paid orders over time"} />
      <div className="db-inset grid grid-cols-3 gap-2 sm:gap-4 rounded-2xl px-3 py-3 sm:px-5 mb-5">
        <div>
          <p className="text-[11px] text-gray-500 font-medium">Revenue</p>
          <p className="text-sm sm:text-xl font-black text-gray-900 tabular-nums truncate">{formatINR(totalRevenue)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500 font-medium">Avg. order</p>
          <p className="text-sm sm:text-xl font-black text-gray-900 tabular-nums truncate">{formatINR(aov)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500 font-medium">Trend</p>
          {growth !== null ? (
            <p className={`flex items-center gap-1 text-sm sm:text-xl font-black tabular-nums ${growth >= 0 ? "text-green-600" : "text-red-500"}`}>
              {growth >= 0 ? <TrendingUp size={15} className="shrink-0" /> : <TrendingDown size={15} className="shrink-0" />}
              {Math.abs(growth)}%
            </p>
          ) : <p className="text-sm sm:text-xl font-black text-gray-300">—</p>}
        </div>
      </div>

      {data.length === 0 ? (
        <CardEmptyState icon={TrendingUp} label="No revenue recorded for this period yet" height={220} />
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={data} margin={{ left: -20, right: 10, top: 5 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(100,116,139,0.15)" strokeDasharray="3 4" />
            <XAxis dataKey="period" tick={axisTick} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
            <Tooltip formatter={(v) => [formatINR(v), "Revenue"]} contentStyle={tooltipStyle} cursor={{ stroke: "#2563EB", strokeOpacity: 0.25 }} />
            <Area type="monotone" dataKey="revenue" stroke="url(#revLine)" strokeWidth={2.75} fill="url(#revFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const CategoryRevenueCard = ({ data = [] }) => (
  <div className="db-card rounded-3xl p-4 sm:p-5">
    <CardHeader icon={Package} accent="indigo" title="Revenue by category" subtitle="Socks, bags and stationery" />
    {data.length === 0 ? (
      <CardEmptyState icon={Package} label="No category revenue yet — sales will appear here once orders come in" />
    ) : (
      <>
        <ResponsiveContainer width="100%" height={data.length * 46 + 20} minHeight={140}>
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }}>
            <CartesianGrid horizontal={false} stroke="rgba(100,116,139,0.15)" strokeDasharray="3 4" />
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: "#334155", fontWeight: 600 }} axisLine={false} tickLine={false} width={72} />
            <Tooltip
              formatter={(v, key) => [key === "revenue" ? formatINR(v) : v, key === "revenue" ? "Revenue" : "Units"]}
              contentStyle={tooltipStyle} cursor={{ fill: "rgba(37,99,235,0.05)" }}
            />
            <Bar dataKey="revenue" radius={[0, 10, 10, 0]} barSize={22}>
              {data.map((d) => <Cell key={d.category} fill={categoryColor(d.category)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 pt-3 border-t border-white/60 space-y-2">
          {data.map((d) => (
            <div key={d.category} className="flex items-center justify-between text-xs gap-2">
              <span className="flex items-center gap-2 text-gray-600 font-medium capitalize truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColor(d.category) }} />
                {d.category}
              </span>
              <span className="text-gray-900 font-bold tabular-nums shrink-0 text-right">
                {formatINR(d.revenue)} <span className="text-gray-400 font-medium">· {d.unitsSold} units</span>
              </span>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

const SizeDemandCard = ({ data = [] }) => {
  const categories = useMemo(() => ["all", ...new Set(data.map((d) => d.category))], [data]);
  const [active, setActive] = useState("all");
  const filtered = active === "all" ? data : data.filter((d) => d.category === active);
  const bySize = useMemo(() => {
    const map = new Map();
    filtered.forEach((d) => map.set(d.size, (map.get(d.size) || 0) + d.unitsSold));
    return [...map.entries()].map(([size, unitsSold]) => ({ size, unitsSold })).sort((a, b) => b.unitsSold - a.unitsSold);
  }, [filtered]);

  return (
    <div className="db-card rounded-3xl p-4 sm:p-5">
      <CardHeader
        icon={Ruler} accent="teal" title="Size-wise demand" subtitle="Units sold by size"
        right={data.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((c) => (
              <button key={c} onClick={() => setActive(c)} aria-pressed={active === c} className={`db-pill db-focus capitalize ${active === c ? "db-pill--active" : ""}`}>
                {c}
              </button>
            ))}
          </div>
        )}
      />
      {data.length === 0 ? (
        <CardEmptyState icon={Ruler} label="No size demand data yet — will populate once sizes start selling" />
      ) : bySize.length === 0 ? (
        <CardEmptyState icon={Ruler} label={`No sales in "${active}" yet`} />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={bySize} margin={{ left: -20, right: 10 }}>
            <CartesianGrid vertical={false} stroke="rgba(100,116,139,0.15)" strokeDasharray="3 4" />
            <XAxis dataKey="size" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
            <Tooltip formatter={(v) => [v, "Units sold"]} contentStyle={tooltipStyle} cursor={{ fill: "rgba(37,99,235,0.05)" }} />
            <Bar dataKey="unitsSold" radius={[10, 10, 0, 0]} fill={active === "all" ? "#6366F1" : categoryColor(active)} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const urgency = (days) => {
  if (days === null) return { label: "No recent sales", bar: "#9CA3AF", badge: "bg-gray-100/80 text-gray-500" };
  if (days <= 7) return { label: `${days}d left`, bar: "#EF4444", badge: "bg-red-100/80 text-red-600" };
  if (days <= 14) return { label: `${days}d left`, bar: "#F97316", badge: "bg-orange-100/80 text-orange-600" };
  return { label: `${days}d left`, bar: "#EAB308", badge: "bg-yellow-100/80 text-yellow-700" };
};

const StockRiskCard = ({ data = [] }) => (
  <div className="db-card rounded-3xl p-4 sm:p-5">
    <CardHeader icon={AlertTriangle} accent="red" title="Stock-out risk" subtitle="Low stock, ranked by how soon it runs out" />
    {data.length === 0 ? (
      <CardEmptyState icon={AlertTriangle} label="Nothing at risk right now — stock levels look healthy" height={160} />
    ) : (
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {data.map((item) => {
          const u = urgency(item.daysUntilStockOut);
          return (
            <div key={`${item.productId}_${item.size}`} className="db-inset relative flex items-center justify-between gap-3 rounded-2xl pl-5 pr-3 py-2.5 overflow-hidden">
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full" style={{ background: u.bar }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 capitalize">{item.category} · size {item.size} · {item.currentStock} left</p>
              </div>
              <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border border-white/70 ${u.badge}`}>{u.label}</span>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const TopCustomersCard = ({ data = [] }) => (
  <div className="db-card rounded-3xl p-4 sm:p-5">
    <CardHeader icon={Crown} accent="amber" title="Top customers" subtitle="By order count" />
    {data.length === 0 ? (
      <CardEmptyState icon={Crown} label="No repeat customers yet" height={160} />
    ) : (
      <div className="divide-y divide-white/60">
        {data.slice(0, 6).map((c, i) => (
          <div key={c.userId} className="flex items-center gap-3 py-2.5">
            <span className="db-avatar" data-top={i === 0}>{c.username?.[0]?.toUpperCase() || "?"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{c.username || "Guest"}</p>
              <p className="text-xs text-gray-500">{relativeDate(c.lastOrderDate)} · {formatINR(c.totalSpent)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-gray-900 tabular-nums">{c.orderCount}</p>
              <p className="text-[11px] text-gray-400">orders</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const Analytics = ({ analytics = {} }) => {
  const { revenueOverTime = [], revenueByCategory = [], sizeDemand = [], stockRisk = [], topCustomers = [] } = analytics;
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <SectionLabel>At a glance</SectionLabel>
        <AnalyticsSummaryStrip revenueByCategory={revenueByCategory} stockRisk={stockRisk} topCustomers={topCustomers} />
      </div>
      <RevenueTrendCard data={revenueOverTime} />
      <div>
        <SectionLabel>Catalog performance</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <CategoryRevenueCard data={revenueByCategory} />
          <SizeDemandCard data={sizeDemand} />
        </div>
      </div>
      <div>
        <SectionLabel>Fulfillment &amp; customers</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <StockRiskCard data={stockRisk} />
          <TopCustomersCard data={topCustomers} />
        </div>
      </div>
    </div>
  );
};

/* ═══ Shell ═════════════════════════════════════════════════ */
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "analytics", label: "Analytics" },
];

const hasUrgentStock = (analytics) =>
  (analytics?.stockRisk || []).some((s) => s.daysUntilStockOut !== null && s.daysUntilStockOut <= 7);

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

  useEffect(() => { load(); }, []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="db max-w-5xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-5 relative overflow-x-hidden" style={{ "--brand": "37,99,235", "--brand-2": "245,158,11" }}>
      <div className="db-blob db-blob--1 absolute -top-24 -left-16 w-72 h-72 rounded-full pointer-events-none -z-10" />
      <div className="db-blob db-blob--2 absolute top-1/3 -right-20 w-72 h-72 rounded-full pointer-events-none -z-10" />

      {/* Header capsule */}
      <header className="db-header rounded-3xl px-4 py-3 sm:px-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Chip icon={BarChart3} accent="blue" size="lg" />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-tight">Dashboard</h1>
            <p className="text-xs text-gray-500 truncate">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} aria-label="Refresh data" title="Refresh" className="db-icon-btn db-focus">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="db-seg flex p-1 rounded-full" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                className={`db-focus px-3.5 sm:px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                  tab === t.key ? "db-seg-active text-blue-700" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {t.label}
                {t.key === "analytics" && hasUrgentStock(analytics) && <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-label="Urgent stock alerts" />}
              </button>
            ))}
          </div>
        </div>
      </header>

      {usingDemoData && !loading && (
        <div className="db-notice text-xs font-medium text-amber-800 rounded-2xl px-4 py-2.5">
          Showing demo data — couldn't reach the analytics API. Check your backend connection and refresh.
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div key={tab} className="db-enter">
          {tab === "overview" ? (
            <Overview stats={stats} revenueOverTime={analytics.revenueOverTime} stockRisk={analytics.stockRisk} onViewStockRisk={() => setTab("analytics")} />
          ) : (
            <Analytics analytics={analytics} />
          )}
        </div>
      )}

      <style>{`
        .db-focus:focus-visible { outline: 2px solid rgba(var(--brand),.7); outline-offset: 2px; }

        /* Cards: frosted glass with a top highlight and a soft tint from --c */
        .db-card {
          --c: 37,99,235;
          position: relative;
          background: linear-gradient(160deg, rgba(255,255,255,.78), rgba(255,255,255,.52));
          border: 1px solid rgba(255,255,255,.85);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          backdrop-filter: blur(18px) saturate(160%);
          box-shadow: 0 16px 36px -22px rgba(var(--c),.35), 0 2px 8px -4px rgba(15,23,42,.06), inset 0 1px 0 rgba(255,255,255,.95);
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
        }
        .db-card--lift:hover { transform: translateY(-3px); box-shadow: 0 22px 42px -20px rgba(var(--c),.5), inset 0 1px 0 #fff; }
        .db-header {
          background: linear-gradient(160deg, rgba(255,255,255,.85), rgba(255,255,255,.58));
          border: 1px solid rgba(255,255,255,.9);
          -webkit-backdrop-filter: blur(18px) saturate(160%); backdrop-filter: blur(18px) saturate(160%);
          box-shadow: 0 18px 40px -22px rgba(var(--brand),.45), inset 0 1px 0 #fff;
        }
        .db-inset { background: rgba(255,255,255,.5); border: 1px solid rgba(255,255,255,.7); box-shadow: inset 0 1px 0 rgba(255,255,255,.8); }

        /* Icon chip tinted by --c (icon and tint share the accent, so the icon is always visible) */
        .db-chip {
          width: 2.25rem; height: 2.25rem; flex-shrink: 0; border-radius: .875rem;
          display: inline-flex; align-items: center; justify-content: center;
          color: rgb(var(--c));
          background: linear-gradient(150deg, rgba(var(--c),.2), rgba(var(--c),.07));
          border: 1px solid rgba(255,255,255,.8);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.75), 0 8px 16px -10px rgba(var(--c),.55);
        }
        .db-chip--lg { width: 2.75rem; height: 2.75rem; border-radius: 1rem; }
        .db-chip--sm { width: 2rem; height: 2rem; border-radius: .75rem; }

        .db-icon-btn {
          width: 2.25rem; height: 2.25rem; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center;
          color: rgb(75,85,99); background: rgba(255,255,255,.55); border: 1px solid rgba(255,255,255,.85); transition: background .25s ease, color .25s ease;
        }
        .db-icon-btn:hover { background: rgba(255,255,255,.95); color: rgb(37,99,235); }
        .db-seg { background: rgba(255,255,255,.45); border: 1px solid rgba(255,255,255,.7); }
        .db-seg-active { background: rgba(255,255,255,.98); box-shadow: 0 6px 14px -6px rgba(var(--brand),.45), inset 0 1px 0 #fff; }

        .db-pill {
          padding: .3rem .8rem; border-radius: 9999px; font-size: 12px; font-weight: 600; color: rgb(75,85,99);
          background: rgba(255,255,255,.6); border: 1px solid rgba(255,255,255,.9); white-space: nowrap;
          transition: background .2s ease, color .2s ease, border-color .2s ease;
        }
        .db-pill:hover { border-color: rgba(var(--brand),.4); }
        .db-pill--active { color: #fff; background: linear-gradient(135deg, rgba(59,130,246,.95), rgba(29,78,216,.98)); border-color: rgba(255,255,255,.4); box-shadow: 0 8px 16px -8px rgba(var(--brand),.6); }

        .db-alert {
          background: linear-gradient(160deg, rgba(254,242,242,.85), rgba(254,226,226,.55));
          border: 1px solid rgba(252,165,165,.55); box-shadow: 0 14px 30px -20px rgba(220,38,38,.5), inset 0 1px 0 rgba(255,255,255,.9);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .db-alert:hover { transform: translateY(-2px); }
        .db-notice { background: rgba(255,251,235,.8); border: 1px solid rgba(252,211,77,.55); }

        .db-avatar {
          width: 2rem; height: 2rem; border-radius: 9999px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #fff; background: linear-gradient(150deg, #334155, #0f172a); border: 1px solid rgba(255,255,255,.5);
        }
        .db-avatar[data-top="true"] { background: linear-gradient(150deg, #F59E0B, #D97706); box-shadow: 0 0 0 3px rgba(var(--brand-2),.25); }

        .db-skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,.4) 25%, rgba(255,255,255,.7) 37%, rgba(255,255,255,.4) 63%);
          background-size: 400% 100%; border: 1px solid rgba(255,255,255,.7); animation: dbShimmer 1.6s ease-in-out infinite;
        }
        @keyframes dbShimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

        /* Tab switch: content settles in once, in response to the click */
        .db-enter { animation: dbEnter .45s cubic-bezier(.22,1,.36,1); }
        @keyframes dbEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        .db-blob { filter: blur(70px); opacity: .16; }
        .db-blob--1 { background: radial-gradient(circle at 40% 30%, rgba(var(--brand),.55), transparent 70%); animation: dbDrift1 17s ease-in-out infinite; }
        .db-blob--2 { background: radial-gradient(circle at 60% 50%, rgba(var(--brand-2),.45), transparent 70%); animation: dbDrift2 14s ease-in-out infinite; }
        @keyframes dbDrift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-18px,16px) scale(1.06); } }
        @keyframes dbDrift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(16px,-14px) scale(1.05); } }

        @media (prefers-reduced-motion: reduce) {
          .db *, .db *::before, .db *::after { animation: none !important; transition-duration: .01ms !important; }
        }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .db-card, .db-header { background: rgba(255,255,255,.95); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
export { Overview, Analytics };