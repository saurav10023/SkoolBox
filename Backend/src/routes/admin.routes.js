import { Router } from "express";
import { getTotalOrders, getTotalPendingOrders, getTotalProducts, getTotalRevenue, getTotalUsers, getUserOrdersByAdmin, registerAdmin, searchOrders, searchUsers } from "../controllers/admin.controller.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js"; // new middleware
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

// Only admins can create new admins
router.get("/usersearch", verifyjwt, verifyAdmin, searchUsers);
router.get("/admin/searchorders", verifyjwt, verifyAdmin, searchOrders);
router.post("/register-admin",
  verifyjwt,
  verifyAdmin,
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  registerAdmin
);

router.get("/get-total-users-count", verifyjwt, verifyAdmin, getTotalUsers);
router.get("/get-all-orders-count", verifyjwt, verifyAdmin, getTotalOrders);
router.get("/get-all-products-count", verifyjwt, verifyAdmin, getTotalProducts);
router.get("/get-total-revenue", verifyjwt, verifyAdmin, getTotalRevenue);
router.get("/get-pending-orders-count", verifyjwt, verifyAdmin, getTotalPendingOrders);
router.get(
  "/users/:userId/orders",
  verifyjwt,
  verifyAdmin,
  getUserOrdersByAdmin
);

export default router;