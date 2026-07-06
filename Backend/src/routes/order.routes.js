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
} from "../controllers/order.controller.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";

const router = express.Router();

/* ---------------- USER ROUTES ---------------- */
router.post("/", verifyjwt, createOrder);
router.get("/my-orders", verifyjwt, getUserOrders);
router.get("/:orderId", verifyjwt, getOrderById);
router.patch("/:orderId/cancel", verifyjwt, cancelOrder);

/* ---------------- ADMIN ROUTES ---------------- */
router.get("/", verifyjwt, verifyAdmin, getAllOrders);
router.patch("/:orderId/status", verifyjwt, verifyAdmin, updateOrderStatus);
router.patch("/:orderId/payment-status", verifyjwt, verifyAdmin, updatePaymentStatus);
router.get("/admin/user/:userId", verifyjwt, verifyAdmin, getUserOrdersAdmin);
router.get("/admin/grouped" ,verifyjwt,verifyAdmin,getOrdersGroupedAdmin);
router.get("/admin/:orderId", verifyjwt, verifyAdmin, getOrderByIdAdmin);

export default router;