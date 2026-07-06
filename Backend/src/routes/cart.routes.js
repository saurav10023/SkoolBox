import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from "../controllers/cart.controller.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ---------------- CART ROUTES ---------------- */
router.get("/", verifyjwt, getCart);
router.post("/", verifyjwt, addToCart);
router.patch("/", verifyjwt, updateCartItem);
router.delete("/item", verifyjwt, removeCartItem);
router.delete("/", verifyjwt, clearCart);

export default router;