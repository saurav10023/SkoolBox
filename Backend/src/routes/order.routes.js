import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  getAllOrders,
  getOrderByIdAdmin,
  getUserOrdersAdmin,
  getOrdersGroupedAdmin,
  createOrderAdmin,
  cancelOrderAdmin,
  deleteOrder,
} from "../controllers/order.controller.js";

import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";

const router = express.Router();

/* =========================
   ADMIN ROUTES
========================= */

// Create order as admin
router.post(
  "/admin/create",
  verifyjwt,
  verifyAdmin,
  createOrderAdmin
);

// Get all orders
router.get(
  "/",
  verifyjwt,
  verifyAdmin,
  getAllOrders
);

// Get grouped orders
router.get(
  "/admin/grouped",
  verifyjwt,
  verifyAdmin,
  getOrdersGroupedAdmin
);

// Get orders of a specific user
router.get(
  "/admin/user/:userId",
  verifyjwt,
  verifyAdmin,
  getUserOrdersAdmin
);

// Get single order
router.get(
  "/admin/:orderId",
  verifyjwt,
  verifyAdmin,
  getOrderByIdAdmin
);

router.delete("/admin/:orderId", verifyjwt,verifyAdmin, deleteOrder);

// Update order status
router.patch(
  "/admin/:orderId/status",
  verifyjwt,
  verifyAdmin,
  updateOrderStatus
);

// Update payment status
router.patch(
  "/admin/:orderId/payment-status",
  verifyjwt,
  verifyAdmin,
  updatePaymentStatus
);

// Cancel order
router.patch(
  "/admin/:orderId/cancel",
  verifyjwt,
  verifyAdmin,
  cancelOrderAdmin
);

/* =========================
   USER ROUTES
========================= */

// Create order
router.post(
  "/",
  verifyjwt,
  createOrder
);

// Get logged-in user's orders
router.get(
  "/my-orders",
  verifyjwt,
  getUserOrders
);

// Get single order
router.get(
  "/:orderId",
  verifyjwt,
  getOrderById
);

// Cancel own order
router.patch(
  "/:orderId/cancel",
  verifyjwt,
  cancelOrder
);

export default router;