import {
  ShoppingBag, Package, Users, TrendingUp, Clock, Ban,
} from "lucide-react";

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

export default Overview;