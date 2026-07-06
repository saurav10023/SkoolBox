import express from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getAllProducts,
  getProductById,
  getProductByCategory,
  toggleAvailability
} from "../controllers/product.controller.js";

import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

/* ---------------- PUBLIC ROUTES ---------------- */
router.get("/", getAllProducts);
router.get("/category/:category", getProductByCategory);
router.get("/:productId", getProductById);

/* ---------------- ADMIN ONLY ROUTES ---------------- */
router.post("/", verifyjwt, verifyAdmin, upload.array("images", 5), createProduct);
router.patch("/:productId", verifyjwt, verifyAdmin, upload.array("images", 5), updateProduct);
router.delete("/:productId", verifyjwt, verifyAdmin, deleteProduct);
router.patch("/:productId/stock", verifyjwt, verifyAdmin, updateStock);
router.patch("/:productId/toggle-availability", verifyjwt, verifyAdmin, toggleAvailability);

export default router;