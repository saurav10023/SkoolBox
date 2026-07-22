import { Router } from "express";
import {
  getRevenueOverTime,
  getRevenueByCategory,
  getPaymentMethodSplit,
  getSizeWiseDemand,
  getStockOutRisk,
  getOrdersByCustomer,
  getOverviewStats
} from "../controllers/analytics.controller.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";


const router = Router();

router.use(verifyjwt, verifyAdmin);
router.get("/overview-stats", getOverviewStats);
router.get("/revenue-over-time", getRevenueOverTime);
router.get("/revenue-by-category", getRevenueByCategory);
router.get("/payment-split", getPaymentMethodSplit);
router.get("/size-demand", getSizeWiseDemand);
router.get("/stock-out-risk", getStockOutRisk);
router.get("/orders-by-customer", getOrdersByCustomer);

export default router;