import { Order } from "../models/order.model.js";
import { Product } from "../models/Product.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
/* ---------------- REVENUE OVER TIME (daily / weekly / monthly) ---------------- */
const getRevenueOverTime = asyncHandler(async (req, res) => {
  const { period = "daily", startDate, endDate } = req.query;

  const dateFormatMap = {
    daily: "%Y-%m-%d",
    weekly: "%G-W%V", // ISO week
    monthly: "%Y-%m"
  };

  const dateFormat = dateFormatMap[period];
  if (!dateFormat) {
    throw new ApiError(400, "period must be one of: daily, weekly, monthly");
  }

  const match = { paymentStatus: "paid" };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const revenue = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        period: "$_id",
        revenue: 1,
        orderCount: 1
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, revenue, "Revenue over time fetched successfully"));
});

/* ---------------- REVENUE BY CATEGORY ---------------- */
const getRevenueByCategory = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const match = { paymentStatus: "paid" };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const revenueByCategory = await Order.aggregate([
    { $match: match },
    { $unwind: "$orderItems" },
    {
      $lookup: {
        from: "products",
        localField: "orderItems.product",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" },
    {
      $group: {
        _id: "$productDetails.category",
        revenue: {
          $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] }
        },
        unitsSold: { $sum: "$orderItems.quantity" }
      }
    },
    { $sort: { revenue: -1 } },
    {
      $project: {
        _id: 0,
        category: "$_id",
        revenue: 1,
        unitsSold: 1
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, revenueByCategory, "Revenue by category fetched successfully"));
});

/* ---------------- COD VS ONLINE SPLIT ---------------- */
const getPaymentMethodSplit = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const split = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$paymentMethod",
        orderCount: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" }
      }
    },
    {
      $project: {
        _id: 0,
        paymentMethod: "$_id",
        orderCount: 1,
        totalAmount: 1
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, split, "Payment method split fetched successfully"));
});

/* ---------------- SIZE-WISE DEMAND ---------------- */
const getSizeWiseDemand = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const pipeline = [
    { $match: { paymentStatus: "paid" } },
    { $unwind: "$orderItems" },
    {
      $lookup: {
        from: "products",
        localField: "orderItems.product",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" }
  ];

  if (category) {
    pipeline.push({ $match: { "productDetails.category": category } });
  }

  pipeline.push(
    {
      $group: {
        _id: {
          product: "$productDetails.name",
          category: "$productDetails.category",
          size: "$orderItems.size"
        },
        unitsSold: { $sum: "$orderItems.quantity" }
      }
    },
    { $sort: { unitsSold: -1 } },
    {
      $project: {
        _id: 0,
        product: "$_id.product",
        category: "$_id.category",
        size: "$_id.size",
        unitsSold: 1
      }
    }
  );

  const sizeWiseDemand = await Order.aggregate(pipeline);

  return res
    .status(200)
    .json(new ApiResponse(200, sizeWiseDemand, "Size-wise demand fetched successfully"));
});

/* ---------------- STOCK-OUT RISK ---------------- */
const getStockOutRisk = asyncHandler(async (req, res) => {
  // threshold = minimum stock considered "safe"
  // windowDays = how far back to look for sales velocity
  const { threshold = 10, windowDays = 30 } = req.query;

  const since = new Date();
  since.setDate(since.getDate() - Number(windowDays));

  // sales velocity per product+size within the window
  const salesVelocity = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: { product: "$orderItems.product", size: "$orderItems.size" },
        unitsSold: { $sum: "$orderItems.quantity" }
      }
    }
  ]);

  const velocityMap = new Map(
    salesVelocity.map(v => [`${v._id.product}_${v._id.size}`, v.unitsSold])
  );

  const products = await Product.find({ isAvailable: true }).lean();

  const atRisk = [];

  for (const product of products) {
    for (const sizeEntry of product.sizes) {
      if (sizeEntry.stock <= Number(threshold)) {
        const key = `${product._id}_${sizeEntry.size}`;
        const unitsSoldInWindow = velocityMap.get(key) || 0;
        const dailyVelocity = unitsSoldInWindow / Number(windowDays);
        const daysUntilStockOut =
          dailyVelocity > 0 ? Math.floor(sizeEntry.stock / dailyVelocity) : null;

        atRisk.push({
          productId: product._id,
          name: product.name,
          category: product.category,
          size: sizeEntry.size,
          currentStock: sizeEntry.stock,
          unitsSoldInWindow,
          daysUntilStockOut // null = no recent sales, can't estimate
        });
      }
    }
  }

  // most urgent first: lowest stock relative to demand
  atRisk.sort((a, b) => {
    if (a.daysUntilStockOut === null) return 1;
    if (b.daysUntilStockOut === null) return -1;
    return a.daysUntilStockOut - b.daysUntilStockOut;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, atRisk, "Stock-out risk fetched successfully"));
});

/* ---------------- ORDERS BY CUSTOMER ---------------- */
const getOrdersByCustomer = asyncHandler(async (req, res) => {
  const { minOrders = 1 } = req.query;

  const ordersByCustomer = await Order.aggregate([
    { $match: { user: { $ne: null } } },
    {
      $group: {
        _id: "$user",
        orderCount: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
        lastOrderDate: { $max: "$createdAt" }
      }
    },
    { $match: { orderCount: { $gte: Number(minOrders) } } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userDetails"
      }
    },
    { $unwind: "$userDetails" },
    { $sort: { orderCount: -1 } },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        username: "$userDetails.username",
        mobileNumber: "$userDetails.mobileNumber",
        orderCount: 1,
        totalSpent: 1,
        lastOrderDate: 1
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, ordersByCustomer, "Orders by customer fetched successfully"));
});

const getOverviewStats = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    totalProducts,
    totalUsers,
    revenueAgg,
    pendingOrders,
    cancelledOrders,
  ] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments(),
    User.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments({ orderStatus: "pending" }),
    Order.countDocuments({ orderStatus: "cancelled" }),
  ]);

  const stats = {
    totalOrders,
    totalProducts,
    totalUsers,
    totalRevenue: revenueAgg[0]?.total || 0,
    pendingOrders,
    cancelledOrders,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Overview stats fetched successfully"));
});

export {
  getRevenueOverTime,
  getRevenueByCategory,
  getPaymentMethodSplit,
  getSizeWiseDemand,
  getStockOutRisk,
  getOrdersByCustomer,
  getOverviewStats
};