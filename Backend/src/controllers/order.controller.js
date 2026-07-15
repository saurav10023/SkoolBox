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
  const { deliveryAddress, city, phoneNumber, paymentMethod, buyNow, items } = req.body;

  if (!deliveryAddress || !city || !phoneNumber || !paymentMethod) {
    throw new ApiError(400, "All fields are required");
  }

  const validPaymentMethods = ["cod", "online"];
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method. Use 'cod' or 'online'");
  }

  let totalAmount = 0;
  const orderItems = [];
  let cart = null; // only populated/used for the cart-based flow

  if (buyNow) {
    // ── Buy Now flow: build the order from the items the client sent,
    // never touch the user's cart ──
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "No items provided for Buy Now order");
    }

    for (const item of items) {
      const { product: productId, size, quantity } = item;

      if (!productId || !size || !quantity) {
        throw new ApiError(400, "Each item requires product, size and quantity");
      }

      const product = await Product.findById(productId);
      if (!product) throw new ApiError(404, "Product not found");

      const sizeData = product.sizes.find(s => s.size === size);
      if (!sizeData) throw new ApiError(400, `Size not available for ${product.name}`);
      if (sizeData.stock < quantity) {
        throw new ApiError(400, `${product.name} (${size}) only has ${sizeData.stock} items left`);
      }

      // Trust the server-side price, not whatever the client sent, to avoid
      // a tampered payload undercharging the customer.
      const safePrice = sizeData.price;

      totalAmount += safePrice * quantity;
      orderItems.push({
        product: product._id,
        quantity,
        price: safePrice,
        size
      });

      await Product.updateOne(
        { _id: product._id, "sizes.size": size },
        { $inc: { "sizes.$.stock": -quantity } }
      );
    }
  } else {
    // ── Regular cart-based flow ──
    cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

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

  // Only clear the cart if this order actually came from the cart —
  // a Buy Now purchase never touched it, so there's nothing to clear.
  if (!buyNow && cart) {
    cart.items = [];
    await cart.save();
  }

  // Always return the order
  // Frontend will call POST /api/payment/create-order next if paymentMethod = "online"
  return res.status(201).json(
    new ApiResponse(201, order, "Order placed successfully")
  );
});

/* ---------------- GET USER ORDERS ---------------- */
const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .select("-createdByAdmin") // ✅ admin-only field hidden from customer-facing response
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

  const order = await Order.findById(orderId)
    .select("-createdByAdmin") // ✅ admin-only field hidden from customer-facing response
    .populate("orderItems.product");
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
/* ---------------- DELETE ORDER — permanent (customer) ---------------- */
// HARD delete — this permanently removes the order document from the DB.
// Only allowed once the order is in a final state (delivered/cancelled),
// so an active/in-progress order can't be wiped out from under fulfillment
// or an in-flight refund.
const deleteOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete this order");
  }

  const deletableStatuses = ["delivered", "cancelled"];
  if (!deletableStatuses.includes(order.orderStatus)) {
    throw new ApiError(400, "Only delivered or cancelled orders can be permanently deleted");
  }

  // Block deleting an order that still has money in limbo — force it
  // through a refund/settlement first so records stay consistent.
  if (order.paymentStatus === "refund_initiated") {
    throw new ApiError(400, "Cannot delete an order with a refund in progress");
  }

  await Order.findByIdAndDelete(orderId);

  return res.status(200).json(
    new ApiResponse(200, null, "Order permanently deleted")
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

// const getOrdersGroupedAdmin = asyncHandler(async (req, res) => {
//   const orders = await Order.find()
//     .populate("orderItems.product")
//     .populate("user", "username email mobileNumber")
//     .sort({ createdAt: -1 });

//   const active = orders.filter(o =>
//     ["placed", "processing", "shipped"].includes(o.orderStatus)
//   );

//   const completed = orders.filter(o =>
//     ["delivered", "cancelled"].includes(o.orderStatus)
//   );

//   return res.status(200).json(
//     new ApiResponse(200, { active, completed }, "Orders fetched successfully")
//   );
// });

const getOrdersGroupedAdmin = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("orderItems.product")
    .populate("user", "username email mobileNumber")
    .sort({ createdAt: -1 });

  // Normalize so we only ever compare against known-good values.
  // Anything that isn't exactly "paid" (unpaid, failed, refunded, missing, null) counts as "not paid".
  const isPaid = (o) => o.paymentStatus === "paid";
  const isRefundComplete = (o) => o.refundStatus === "complete";

  /**
   * Business rule (explicit truth table):
   *
   * orderStatus   | paymentStatus | refundStatus   | bucket
   * --------------|---------------|----------------|----------
   * placed        | any           | n/a            | active
   * processing    | any           | n/a            | active
   * shipped       | any           | n/a            | active
   * delivered     | paid          | n/a            | completed
   * delivered     | not paid      | n/a            | active   (delivered but payment/COD not settled)
   * cancelled     | paid          | complete        | completed (refunded)
   * cancelled     | paid          | pending/none    | active   (refund still owed)
   * cancelled     | not paid      | any             | completed (nothing to refund)
   * <unknown/missing orderStatus> | any | any        | active   (fail-safe, flagged)
   */
  const classify = (o) => {
    switch (o.orderStatus) {
      case "delivered":
        return isPaid(o) ? "completed" : "active";

      case "cancelled":
        if (!isPaid(o)) return "completed"; // never paid, no refund owed
        return isRefundComplete(o) ? "completed" : "active";

      case "placed":
      case "processing":
      case "shipped":
        return "active";

      default:
        // Unknown/missing orderStatus — don't silently misclassify, surface it.
        console.warn(
          `[getOrdersGroupedAdmin] Order ${o._id} has unrecognized orderStatus: "${o.orderStatus}"`
        );
        return "active";
    }
  };

  const active = [];
  const completed = [];

  for (const order of orders) {
    (classify(order) === "completed" ? completed : active).push(order);
  }

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

/* ---------------- CREATE ORDER — Admin only (manual/offline order) ---------------- */
const createOrderAdmin = asyncHandler(async (req, res) => {
  const {
    customerName,
    mobileNumber,
    email,
    deliveryAddress,
    city,
    pincode,
    orderItems,
    totalAmount,
    orderStatus,
    paymentMethod,
    paymentStatus,
  } = req.body;

  if (!customerName || !mobileNumber || !deliveryAddress || !city || !paymentMethod) {
    throw new ApiError(400, "customerName, mobileNumber, deliveryAddress, city and paymentMethod are required");
  }

  const validPaymentMethods = ["cod", "online"];
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method. Use 'cod' or 'online'");
  }

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ApiError(400, "At least one order item is required");
  }

  const validOrderStatuses = ["placed", "processing", "shipped", "delivered", "cancelled"];
  const finalOrderStatus = validOrderStatuses.includes(orderStatus) ? orderStatus : "placed";

  const validPaymentStatuses = ["pending", "paid", "failed", "refund_initiated", "refund_completed"];
  const finalPaymentStatus = validPaymentStatuses.includes(paymentStatus) ? paymentStatus : "pending";

  let computedTotal = 0;
  const finalOrderItems = [];

  for (const item of orderItems) {
    const { product: productId, size, quantity, price } = item;

    if (!productId || !size || !quantity || price == null) {
      throw new ApiError(400, "Each order item requires product, size, quantity and price");
    }

    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, `Product not found: ${productId}`);

    const sizeData = product.sizes.find(s => s.size === size);
    if (!sizeData) throw new ApiError(400, `Size not available for ${product.name}`);
    if (sizeData.stock < quantity) {
      throw new ApiError(400, `${product.name} (${size}) only has ${sizeData.stock} items left`);
    }

    computedTotal += price * quantity;
    finalOrderItems.push({ product: product._id, quantity, price, size });

    await Product.updateOne(
      { _id: product._id, "sizes.size": size },
      { $inc: { "sizes.$.stock": -quantity } }
    );
  }

  const order = await Order.create({
    user: null,
    customerName,
    email: email || null,
    orderItems: finalOrderItems,
    totalAmount: totalAmount != null ? totalAmount : computedTotal,
    deliveryAddress,
    city,
    pincode: pincode || null,
    phoneNumber: mobileNumber,
    paymentMethod,
    paymentStatus: finalPaymentStatus,
    orderStatus: finalOrderStatus,
    createdByAdmin: true,
  });

  return res.status(201).json(
    new ApiResponse(201, order, "Order created successfully by admin")
  );
});

/* ---------------- CANCEL ORDER — Admin only (no ownership check) ---------------- */
const cancelOrderAdmin = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

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

  // If it was already paid, mark refund as initiated (admin handles refund manually in Razorpay dashboard)
  if (order.paymentStatus === "paid") {
    order.paymentStatus = "refund_initiated";
  }

  await order.save();

  return res.status(200).json(
    new ApiResponse(200, order, "Order cancelled successfully by admin")
  );
});

export {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  updatePaymentStatus,
  getAllOrders,
  getOrderByIdAdmin,
  getUserOrdersAdmin,
  getOrdersGroupedAdmin,
  createOrderAdmin,
  cancelOrderAdmin
};