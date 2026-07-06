import Razorpay from "razorpay";
import crypto from "crypto";
import { Order } from "../models/order.model.js";
import { Product } from "../models/Product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ---------------- CREATE RAZORPAY ORDER ---------------- */
const createOrderPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  // fetch from DB — never trust amount from frontend
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  if (order.paymentMethod !== "online") {
    throw new ApiError(400, "This is a COD order, no payment needed");
  }

const razorpayOrder = await razorpay.orders.create({
    amount: order.totalAmount * 100,  // paise, from DB not frontend
    currency: "INR",
    receipt: `receipt_${order._id}`,  // no comma, use order _id
  });

  // link Razorpay order to your DB order
  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  return res.status(200).json(
    new ApiResponse(200, {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    }, "Razorpay order created")
  );
});

/* ---------------- VERIFY PAYMENT ---------------- */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed — invalid signature");
  }

  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) throw new ApiError(404, "Order not found");

  order.paymentStatus = "paid";
  order.razorpayPaymentId = razorpay_payment_id;
  order.orderStatus = "processing";
  await order.save();

  return res.status(200).json(
    new ApiResponse(200, order, "Payment verified successfully")
  );
});

/* ---------------- HANDLE PAYMENT FAILURE ---------------- */
const handlePaymentFailure = asyncHandler(async (req, res) => {
  const { razorpay_order_id } = req.body;

  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) throw new ApiError(404, "Order not found");

  for (const item of order.orderItems) {
    await Product.updateOne(
      { _id: item.product, "sizes.size": item.size },
      { $inc: { "sizes.$.stock": item.quantity } }
    );
  }

  order.paymentStatus = "failed";
  order.orderStatus = "cancelled";
  await order.save();

  return res.status(200).json(
    new ApiResponse(200, order, "Payment failed — stock restored")
  );
});

export { createOrderPayment, verifyPayment, handlePaymentFailure };