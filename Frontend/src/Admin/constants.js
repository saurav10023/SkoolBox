import {
  LayoutDashboard, Package, Users, ShoppingBag, FilePlus2,
} from "lucide-react";

/* ─────────────────────────────────────────────
   TABS
───────────────────────────────────────────── */
export const TABS = [
  { id: "overview",     label: "Overview",     icon: LayoutDashboard },
  { id: "orders",       label: "Orders",       icon: ShoppingBag },
  { id: "create-order", label: "Create Order", icon: FilePlus2 }, // ✅ new tab
  { id: "products",     label: "Products",     icon: Package },
  { id: "users",        label: "Users",        icon: Users },
];

export const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered"];

export const STATUS_COLORS = {
  placed:     "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};

export const PAYMENT_COLORS = {
  pending:           "bg-yellow-100 text-yellow-700",
  paid:              "bg-green-100 text-green-700",
  failed:            "bg-red-100 text-red-700",
  refund_initiated:  "bg-orange-100 text-orange-700",
  refund_completed:  "bg-teal-100 text-teal-700",
};