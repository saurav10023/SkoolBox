import express from "express"
import { verifyjwt } from "../middlewares/auth.middleware.js"

import { createOrderPayment, handlePaymentFailure, verifyPayment } from "../controllers/payment.controller.js";
const router = express.Router();
router.post("/create-order" ,verifyjwt , createOrderPayment );
router.post("/verify" ,verifyjwt , verifyPayment)
router.post("/failure" , verifyjwt , handlePaymentFailure)

export  default router;