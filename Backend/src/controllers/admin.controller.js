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

const getTotalPendingOrders = asyncHandler(async (req , res)=>{
  const count = await Order.countDocuments({
    orderStatus:{
      $in: ["processing", "shipped"]
    }
  })

  return res.status(200).json(
    new ApiResponse(200 ,count ,"Pending orders fetched Successfully" )
  )
})

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




export{registerAdmin , getTotalOrders , getTotalPendingOrders , getTotalProducts , getTotalUsers,getTotalRevenue}