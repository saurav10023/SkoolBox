import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/Product.model.js";

// Middleware: verifyjwt + verifyAdmin must run before this
const registerAdmin = asyncHandler(async (req, res) => {
  const { mobileNumber, email, userName, password } = req.body;

  if ([mobileNumber, email, userName, password].some(f => !f || f.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ mobileNumber }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const avatar = avatarLocalPath ? await uploadOnCloudinary(avatarLocalPath) : null;

  const user = await User.create({
    mobileNumber,
    email,
    password,
    userName: userName.toUpperCase(),
    avatar: avatar?.url || "https://api.dicebear.com/7.x/initials/svg?seed=User",
    role: "admin", // explicitly admin
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  return res.status(201).json(
    new ApiResponse(201, createdUser, "Admin registered successfully")
  );
});

/* ---------------- GET TOTAL PENDING ORDERS ---------------- */
// "Pending" = anything not yet fully resolved, matching the same
// active/completed business rule used in getOrdersGroupedAdmin:
//
//   orderStatus                 | condition                        | pending?
//   -----------------------------|----------------------------------|---------
//   placed / processing / shipped| any payment state                | yes
//   delivered                    | paymentStatus !== "paid"         | yes  (COD not settled yet)
//   delivered                    | paymentStatus === "paid"         | no
//   cancelled                    | paymentStatus in [paid,          | yes  (refund owed / in progress)
//                                 |   refund_initiated]              |
//   cancelled                    | paymentStatus in [pending,       | no
//                                 |   failed, refund_completed]      |
const getTotalPendingOrders = asyncHandler(async (req, res) => {
  const count = await Order.countDocuments({
    $or: [
      { orderStatus: { $in: ["placed", "processing", "shipped"] } },
      { orderStatus: "delivered", paymentStatus: { $ne: "paid" } },
      { orderStatus: "cancelled", paymentStatus: { $in: ["paid", "refund_initiated"] } },
    ],
  });

  return res.status(200).json(
    new ApiResponse(200, count, "Pending orders fetched successfully")
  );
});

const getTotalOrders = asyncHandler(async (req , res)=>{
  const count = await Order.countDocuments()

  return res.status(200).json(
    new ApiResponse(200 ,count ,"All Orders fetched Successfully" )
  )
})

const getTotalProducts = asyncHandler(async (req , res)=>{
  const count = await Product.countDocuments({
    isAvailable:true ,
  })

  return res.status(200).json(
    new ApiResponse(200 ,count ,"Available  Products fetched Successfully" )
  )
})

const getTotalUsers = asyncHandler(async (req , res)=>{
  const count = await User.countDocuments({
    isBlocked:false
  })

  return res.status(200).json(
    new ApiResponse(200 ,count ,"Users fetched Successfully" )
  )
})


const getTotalRevenue = asyncHandler(async (req, res) => {
  const result = await Order.aggregate([
    { $match: { orderStatus: "delivered" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  const revenue = result[0]?.total || 0;

  return res.status(200).json(
    new ApiResponse(200, revenue, "Total revenue fetched successfully")
  );
});

/* ---------------- GET USER ORDERS (BY ADMIN) ---------------- */
// NOTE: product details are NOT populated here — the `items.product` path
// caused a strictPopulate error, meaning the line-items field or its product
// ref is named differently in your Order schema (e.g. orderItems, products,
// cartItems, or productId instead of product). Share Order.model.js and this
// can be restored with the correct path so product name/image/price show up
// in the modal again.
// const getUserOrdersByAdmin = asyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   const { page = 1, limit = 10 } = req.query;

//   if (!userId) {
//     throw new ApiError(400, "User ID is required");
//   }

//   const user = await User.findById(userId).select(
//     "username email mobileNumber avatar role isBlocked createdAt"
//   );

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   const skip = (Number(page) - 1) * Number(limit);

//   const [orders, totalOrders] = await Promise.all([
//     Order.find({ user: userId })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit)),
//     Order.countDocuments({ user: userId }),
//   ]);

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         user,
//         orders,
//         pagination: {
//           total: totalOrders,
//           page: Number(page),
//           limit: Number(limit),
//           totalPages: Math.ceil(totalOrders / Number(limit)),
//         },
//       },
//       "User orders fetched successfully"
//     )
//   );
// });

/* ---------------- GET USER ORDERS (BY ADMIN) ---------------- */
const getUserOrdersByAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const user = await User.findById(userId).select(
    "username email mobileNumber avatar role isBlocked createdAt"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, totalOrders] = await Promise.all([
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("orderItems.product", "name images"),
    Order.countDocuments({ user: userId }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        orders,
        pagination: {
          total: totalOrders,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalOrders / Number(limit)),
        },
      },
      "User orders fetched successfully"
    )
  );
});


/* ---------------- SEARCH USERS (ADMIN) ---------------- */
// Searches across username, email, and mobileNumber.
// Optional role filter ("user" | "admin") and pagination.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchUsers = asyncHandler(async (req, res) => {
  const { query = "", role, page = 1, limit = 20 } = req.query;

  const filter = {};
  const trimmed = query.trim();

  if (trimmed) {
    const safe = escapeRegex(trimmed);
    const regex = new RegExp(safe, "i");
    filter.$or = [
      { username: regex },
      { email: regex },
      { mobileNumber: regex },
    ];
  }

  if (role === "admin" || role === "user") {
    filter.role = role;
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken -otp -otpExpiry")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Users fetched successfully"
    )
  );
});

/* ---------------- SEARCH ORDERS (ADMIN) ---------------- */
// Searches customerName, email, phoneNumber, city, deliveryAddress, orderNumber,
// plus the linked registered user's username/email/mobileNumber (if any).
// Optional filters: orderStatus, paymentStatus, date range (createdAt).
// No paymentMethod filter — this store only accepts online payments.
const searchOrders = asyncHandler(async (req, res) => {
  const {
    query = "",
    status,          // orderStatus
    paymentStatus,
    startDate,        // YYYY-MM-DD
    endDate,          // YYYY-MM-DD
    page = 1,
    limit = 20,
  } = req.query;

  const trimmed = query.trim();
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
  ];

  const matchConditions = [];

  if (trimmed) {
    const safe = escapeRegex(trimmed);
    const regex = new RegExp(safe, "i");
    const orConditions = [
      { customerName: regex },
      { email: regex },
      { phoneNumber: regex },
      { city: regex },
      { deliveryAddress: regex },
      { "userInfo.username": regex },
      { "userInfo.email": regex },
      { "userInfo.mobileNumber": regex },
    ];
    if (/^\d+$/.test(trimmed)) {
      orConditions.push({ orderNumber: Number(trimmed) });
    }
    matchConditions.push({ $or: orConditions });
  }

  const validStatuses = ["placed", "processing", "shipped", "delivered", "cancelled"];
  if (status && validStatuses.includes(status)) {
    matchConditions.push({ orderStatus: status });
  }

  const validPaymentStatuses = ["pending", "paid", "failed", "refund_initiated", "refund_completed"];
  if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
    matchConditions.push({ paymentStatus });
  }

  if (startDate || endDate) {
    const dateFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    matchConditions.push({ createdAt: dateFilter });
  }

  if (matchConditions.length) {
    pipeline.push({ $match: { $and: matchConditions } });
  }

  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({
    $facet: {
      ids: [{ $skip: skip }, { $limit: limitNum }, { $project: { _id: 1 } }],
      totalCount: [{ $count: "count" }],
    },
  });

  const aggResult = await Order.aggregate(pipeline);
  const matchedIds = (aggResult[0]?.ids || []).map((d) => d._id);
  const total = aggResult[0]?.totalCount[0]?.count || 0;

  const orders = await Order.find({ _id: { $in: matchedIds } })
    .populate("user", "username email mobileNumber")
    .populate("orderItems.product", "name images");

  // Aggregation already sorted/paginated correctly — $in doesn't preserve
  // order, so re-sort the populated results to match matchedIds.
  const orderMap = new Map(orders.map((o) => [o._id.toString(), o]));
  const sortedOrders = matchedIds.map((id) => orderMap.get(id.toString())).filter(Boolean);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders: sortedOrders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Orders fetched successfully"
    )
  );
});

export{registerAdmin , getTotalOrders , getTotalPendingOrders , getTotalProducts , getTotalUsers,getTotalRevenue , getUserOrdersByAdmin, searchUsers , searchOrders}