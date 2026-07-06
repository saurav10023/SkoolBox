import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/Product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// NO Razorpay imports here — that lives in payment.controller.js
// import Razorpay from "razorpay"
/* ---------------- CREATE ORDER ---------------- */
const createOrder = asyncHandler(async (req, res) => {
  const { deliveryAddress, city, phoneNumber, paymentMethod } = req.body;

  if (!deliveryAddress || !city || !phoneNumber || !paymentMethod) {
    throw new ApiError(400, "All fields are required");
  }

  const validPaymentMethods = ["cod", "online"];
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method. Use 'cod' or 'online'");
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.product;
    if (!product) throw new ApiError(404, "Product not found");

    const sizeData = product.sizes.find(s => s.size === item.size);
    if (!sizeData) throw new ApiError(400, `Size not available for ${product.name}`);
    if (sizeData.stock < item.quantity) {
      throw new ApiError(400, `${product.name} (${item.size}) only has ${sizeData.stock} items left`);
    }

    totalAmount += item.price * item.quantity;
    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: item.price,
      size: item.size
    });

    await Product.updateOne(
      { _id: product._id, "sizes.size": item.size },
      { $inc: { "sizes.$.stock": -item.quantity } }
    );
  }

  // Just create DB order — no Razorpay here
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    totalAmount,
    deliveryAddress,
    city,
    phoneNumber,
    paymentMethod,
    paymentStatus: "pending"
  });

  cart.items = [];
  await cart.save();

  // Always return the order
  // Frontend will call POST /api/payment/create-order next if paymentMethod = "online"
  return res.status(201).json(
    new ApiResponse(201, order, "Order placed successfully")
  );
});

/* ---------------- GET USER ORDERS ---------------- */
const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("orderItems.product")
    .sort({ createdAt: -1 });

  if (!orders.length) {
    return res.status(200).json(new ApiResponse(200, [], "No orders found"));
  }

  return res.status(200).json(
    new ApiResponse(200, orders, "Orders fetched successfully")
  );
});

/* ---------------- GET ORDER BY ID ---------------- */
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId).populate("orderItems.product");
  if (!order) throw new ApiError(404, "Order not found");

  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to access this order");
  }

  return res.status(200).json(
    new ApiResponse(200, order, "Order fetched successfully")
  );
});

/* ---------------- UPDATE ORDER STATUS — Admin only ---------------- */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (status === "cancelled") {
    throw new ApiError(400, "Use the cancel order route to cancel an order");
  }

  const validStatuses = ["placed", "processing", "shipped", "delivered"];
  if (!status || !validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus: status },
    { new: true }
  );

  if (!order) throw new ApiError(404, "Order not found");

  return res.status(200).json(
    new ApiResponse(200, order, "Order status updated successfully")
  );
});

/* ---------------- CANCEL ORDER ---------------- */
// const cancelOrder = asyncHandler(async (req, res) => {
//   const { orderId } = req.params;

//   const order = await Order.findById(orderId);
//   if (!order) throw new ApiError(404, "Order not found");

//   if (order.user.toString() !== req.user._id.toString()) {
//     throw new ApiError(403, "Unauthorized to cancel this order");
//   }

//   if (order.orderStatus === "shipped" || order.orderStatus === "delivered") {
//     throw new ApiError(400, "Cannot cancel an order that is already shipped or delivered");
//   }

//   if (order.orderStatus === "cancelled") {
//     throw new ApiError(400, "Order is already cancelled");
//   }

//   for (const item of order.orderItems) {
//     await Product.updateOne(
//       { _id: item.product, "sizes.size": item.size },
//       { $inc: { "sizes.$.stock": item.quantity } }
//     );
//   }
//   order.orderStatus = "cancelled";
//   if (order.paymentStatus === "paid") {
//     const razorpay = new Razorpay({ key_id, key_secret });
//     await razorpay.payments.refund(order.razorpayPaymentId, {
//     amount: order.totalAmount * 100 // in paise
//     });
//   }
//   await order.save();

//   return res.status(200).json(
//     new ApiResponse(200, order, "Order cancelled successfully")
//   );
// });

const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to cancel this order");
  }

  if (order.orderStatus === "shipped" || order.orderStatus === "delivered") {
    throw new ApiError(400, "Cannot cancel an order that is already shipped or delivered");
  }

  if (order.orderStatus === "cancelled") {
    throw new ApiError(400, "Order is already cancelled");
  }

  for (const item of order.orderItems) {
    await Product.updateOne(
      { _id: item.product, "sizes.size": item.size },
      { $inc: { "sizes.$.stock": item.quantity } }
    );
  }

  order.orderStatus = "cancelled";

  // ✅ Just mark refund_initiated — you'll do it manually in Razorpay dashboard
  // then update to refund_completed via Admin Dashboard
  if (order.paymentStatus === "paid") {
    order.paymentStatus = "refund_initiated";
  }

  await order.save();

  return res.status(200).json(
    new ApiResponse(200, order, "Order cancelled successfully")
  );
});
/* ---------------- UPDATE PAYMENT STATUS — Admin only ---------------- */
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentStatus, transactionId } = req.body;

  const validStatuses = ["pending", "paid", "failed", "refund_initiated","refund_completed"];
  if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
    throw new ApiError(400, "Invalid payment status");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (paymentStatus === "failed") {
    for (const item of order.orderItems) {
      await Product.updateOne(
        { _id: item.product, "sizes.size": item.size },
        { $inc: { "sizes.$.stock": item.quantity } }
      );
    }
    order.orderStatus = "cancelled";
  }

  order.paymentStatus = paymentStatus;
  if (transactionId) order.transactionId = transactionId;
  await order.save();

  return res.status(200).json(
    new ApiResponse(200, order, "Payment status updated successfully")
  );
});

/* ---------------- GET ALL ORDERS — Admin only ---------------- */
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("orderItems.product")
    .populate("user", "username email mobileNumber")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, orders, "All orders fetched successfully")
  );
});

const getOrderByIdAdmin = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate("orderItems.product")
    .populate("user", "username email mobileNumber");

  if (!order) throw new ApiError(404, "Order not found");

  return res.status(200).json(
    new ApiResponse(200, order, "Order fetched successfully")
  );
});

const getOrdersGroupedAdmin = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("orderItems.product")
    .populate("user", "username email mobileNumber")
    .sort({ createdAt: -1 });

  const active = orders.filter(o =>
    ["placed", "processing", "shipped"].includes(o.orderStatus)
  );

  const completed = orders.filter(o =>
    ["delivered", "cancelled"].includes(o.orderStatus)
  );

  return res.status(200).json(
    new ApiResponse(200, { active, completed }, "Orders fetched successfully")
  );
});

const getUserOrdersAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const orders = await Order.find({ user: userId })
    .populate("orderItems.product")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, orders, "User orders fetched successfully")
  );
});

export {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  getAllOrders,
  getOrderByIdAdmin,
  getUserOrdersAdmin,
  getOrdersGroupedAdmin
};