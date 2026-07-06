import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { OtpSession } from "../models/OtpSession.model.js";
import { sendPasswordOTP } from "../utils/sendPasswordOtp.js";
import { sendRegisterationOtpEmail } from "../utils/sendRegisterationOTP.js";

/* ----------------------------------------------------- */
/* GENERATE TOKENS */
/* ----------------------------------------------------- */
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh token");
  }
};

/* ----------------------------------------------------- */
/* REGISTER USER */
/* ----------------------------------------------------- */
// email verification flow 

// const sendRegistrationOTP = asyncHandler(async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     throw new ApiError(400, "Email is required");
//   }

//   // Check if email already exists
//   const existingUser = await User.findOne({ email });
//   if (existingUser) {
//     throw new ApiError(409, "Email already exists");
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const hashedOtp = await bcrypt.hash(otp, 10);

//   await OtpSession.findOneAndUpdate(
//     { email },
//     {
//       email,
//       otp: hashedOtp,
//       expiresAt: new Date(Date.now() + 10 * 60 * 1000),
//       verified: false
//     },
//     {
//       upsert: true,
//       new: true
//     }
//   );

//   await sendRegisterationOtpEmail(email, otp);

//   return res.status(200).json(
//     new ApiResponse(200, {}, "OTP sent to your email")
//   );
// });

// const verifyRegistrationOTP = asyncHandler(async (req, res) => {
//   const { email, otp } = req.body;

//   if (!email || !otp) {
//     throw new ApiError(400, "Email and OTP are required");
//   }

//   const session = await OtpSession.findOne({ email });

//   if (!session) {
//     throw new ApiError(400, "OTP not requested");
//   }

//   if (session.expiresAt < new Date()) {
//     await OtpSession.deleteOne({ email });
//     throw new ApiError(400, "OTP has expired");
//   }

//   const isValid = await bcrypt.compare(otp, session.otp);

//   if (!isValid) {
//     throw new ApiError(400, "Invalid OTP");
//   }

//   // mark verified TRUE
//   session.verified = true;

//   await session.save();

//   return res.status(200).json(
//     new ApiResponse(200, {}, "Email verified successfully")
//   );
// });

// const registerUser = asyncHandler(async (req, res) => {
//   const { mobileNumber, email, username, password, address } = req.body;

//   if ([mobileNumber, email, username, password].some(f => !f || f.trim() === "")) {
//     throw new ApiError(400, "All fields are required");
//   }

//   let existedUser;

//   existedUser = await User.findOne({ email });
//   if (existedUser) {
//     throw new ApiError(409, "Email already exists");
//   }

//   existedUser = await User.findOne({ mobileNumber });
//   if (existedUser) {
//     throw new ApiError(409, "Mobile number already exists");
//   }

//   existedUser = await User.findOne({
//     username: username.toLowerCase()
//   });

//   if (existedUser) {
//     throw new ApiError(409, "Username already exists");
//   }

//   // Verify email OTP
//   const otpSession = await OtpSession.findOne({
//     mobileNumber,
//     verified: true
//   });

//   if (!otpSession) {
//     throw new ApiError(400, "Please verify your email first");
//   }

//   const avatarLocalPath = req.files?.avatar?.[0]?.path;

//   const avatar = avatarLocalPath
//     ? await uploadOnCloudinary(avatarLocalPath)
//     : null;

//   const user = await User.create({
//     mobileNumber,
//     email,
//     password,
//     username: username.toLowerCase(),
//     avatar:
//       avatar?.url ||
//       "https://cdn-icons-png.flaticon.com/512/149/149071.png",
//     role: "user",
//     addresses: address ? [address] : []
//   });

//   // Remove OTP session after successful registration
//   await OtpSession.deleteOne({ email });

//   const createdUser = await User.findById(user._id)
//     .select("-password -refreshToken");

//   return res.status(201).json(
//     new ApiResponse(201, createdUser, "User registered successfully")
//   );
// });


// mobile verification
const verifyMobileOTP = asyncHandler(async (req, res) => {

    const { mobileNumber } = req.firebaseUser;

    if (!mobileNumber) {
        throw new ApiError(400, "Mobile verification failed");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ mobileNumber });

    if (existingUser) {
        throw new ApiError(409, "Mobile number already registered");
    }

    // Mark this mobile as verified
    await OtpSession.findOneAndUpdate(
        { mobileNumber },
        {
            mobileNumber,
            verified: true
        },
        {
            upsert: true,
            new: true
        }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Mobile number verified successfully"
        )
    );

});

const registerUser = asyncHandler(async (req, res) => {

    const {
        username,
        password,
        email,
        address
    } = req.body;

    const mobileNumber = req.firebaseUser?.mobileNumber;
    const firebaseUid = req.firebaseUser?.uid;

    if (!mobileNumber) {
        throw new ApiError(400, "Please verify your mobile number first");
    }

    if (!username || !password) {
        throw new ApiError(
            400,
            "Username and password are required"
        );
    }

    // Check verification session
    const otpSession = await OtpSession.findOne({
        mobileNumber,
        verified: true
    });

    if (!otpSession) {
        throw new ApiError(
            400,
            "Please verify your mobile number first"
        );
    }

    // Duplicate mobile
    let existedUser = await User.findOne({ mobileNumber });

    if (existedUser) {
        throw new ApiError(
            409,
            "Mobile number already exists"
        );
    }

    // Duplicate username
    existedUser = await User.findOne({
        username: username.toLowerCase()
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "Username already exists"
        );
    }

    // Duplicate email (only if provided)
    if (email) {

        existedUser = await User.findOne({ email });

        if (existedUser) {
            throw new ApiError(
                409,
                "Email already exists"
            );
        }

    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    const avatar = avatarLocalPath
        ? await uploadOnCloudinary(avatarLocalPath)
        : null;

    const user = await User.create({

        firebaseUid,

        mobileNumber,

        email: email || undefined,

        password,

        username: username.toLowerCase(),

        avatar:
            avatar?.url ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png",

        role: "user",

        addresses: address ? [address] : []

    });

    // Remove verification session
    await OtpSession.deleteOne({ mobileNumber });

    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );

});


/* ----------------------------------------------------- */
/* LOGIN USER */
/* ----------------------------------------------------- */
// const loginUser = asyncHandler(async (req, res) => {
//   const { loginId, password } = req.body;

//   if (!loginId || !password)
//     throw new ApiError(400, "Username/mobile number and password are required");

//   let existedUser

//   existedUser = await User.findOne({ $or: [{mobileNumber:loginId} , {username:loginId.toLowerCase()}] });
//   if (!existedUser) throw new ApiError(409, "Invalid Mobile number/username  does not  exists");

//   const user = await User.findOne({
//     $or: [
//       { mobileNumber: loginId },
//       { username: loginId.toLowerCase() }
//     ]
//   }).select("+password");

//   if (!user) throw new ApiError(404, "User does not exist");

//   if (user.isBlocked) throw new ApiError(403, "User account is blocked");

//   const isPasswordValid = await user.isPasswordCorrect(password);
//   if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

//   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

//   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

//   const options = {
//   httpOnly: true,
//   secure: true,
//   sameSite: "none"
//   };

//   return res
//     .status(200)
//     .cookie("accessToken", accessToken, options)
//     .cookie("refreshToken", refreshToken, options)
//     .json(
//       new ApiResponse(
//         200,
//         { user: loggedInUser, accessToken, refreshToken },
//         "User logged in successfully"
//       )
//     );
// });


const loginUser = asyncHandler(async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    throw new ApiError(
      400,
      "Username/mobile number and password are required"
    );
  }

  const user = await User.findOne({
    $or: [
      { mobileNumber: loginId },
      { username: loginId.toLowerCase() }
    ]
  }).select("+password");

  if (!user) {
    throw new ApiError(409, "Invalid Mobile number/username does not exists");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "User account is blocked");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    );
});
/* ----------------------------------------------------- */
/* LOGOUT USER */
/* ----------------------------------------------------- */
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = {
  httpOnly: true,
  secure: true,
  sameSite: "none"
};

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/* ----------------------------------------------------- */
/* GET CURRENT USER */
/* ----------------------------------------------------- */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user, "Current user fetched successfully")
  );
});

/* ----------------------------------------------------- */
/* UPDATE ACCOUNT DETAILS */
/* ----------------------------------------------------- */
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { mobileNumber, username, email } = req.body;

    if (!mobileNumber && !username && !email) {
        throw new ApiError(400, "At least one field is required");
    }

    if (mobileNumber || email) {
        const conflict = await User.findOne({
            _id: { $ne: req.user._id },
            $or: [
                ...(mobileNumber ? [{ mobileNumber }] : []),
                ...(email ? [{ email }] : [])
            ]
        });

        if (conflict) {
            throw new ApiError(409, "Mobile number or email already in use");
        }
    }

    const updateFields = {};
    if (mobileNumber) updateFields.mobileNumber = mobileNumber;
    if (username) updateFields.username = username.toLowerCase();
    if (email) updateFields.email = email;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, user, "Account details updated successfully")
    );
});

/* ----------------------------------------------------- */
/* UPDATE USER AVATAR */
/* ----------------------------------------------------- */
const updateUserAvatarPath = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file missing");

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) throw new ApiError(400, "Error uploading avatar");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(200, user, "Avatar updated successfully")
  );
});


/* ----------------------------------------------------- */
/* REMOVE AVATAR — set back to default */
/* ----------------------------------------------------- */
const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
      }
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(200, user, "Avatar removed successfully")
  );
});

/* ----------------------------------------------------- */
/* ADD ADDRESS */
/* ----------------------------------------------------- */
const addAddress = asyncHandler(async (req, res) => {
    const { name, phone, fullAddress, isDefault } = req.body;

    if (!name || !phone || !fullAddress) {
        throw new ApiError(400, "All address fields are required");
    }

    const currentUser = await User.findById(req.user._id).select("addresses");

    if (currentUser.addresses.length >= 5) {
        throw new ApiError(400, "Maximum 5 addresses allowed");
    }

    if (isDefault) {
        await User.updateOne(
            { _id: req.user._id },
            { $set: { "addresses.$[].isDefault": false } }
        );
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $push: {
                addresses: { name, phone, fullAddress, isDefault: !!isDefault }
            }
        },
        { new: true }
    ).select("addresses");

    return res.status(200).json(
        new ApiResponse(200, user.addresses, "Address added successfully")
    );
});
/* ----------------------------------------------------- */
/* DELETE ADDRESS */
/* ----------------------------------------------------- */
const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        addresses: { _id: addressId }
      }
    },
    { new: true }
  ).select("addresses");

  return res.status(200).json(
    new ApiResponse(200, user.addresses, "Address removed successfully")
  );
});


const getUserAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("addresses");

  return res.status(200).json(
    new ApiResponse(200, user.addresses, "Addresses fetched successfully")
  );
});


/* ----------------------------------------------------- */
/* REFRESH ACCESS TOKEN */
/* ----------------------------------------------------- */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken._id);

  if (!user) throw new ApiError(401, "Invalid refresh token");

  if (user.refreshToken !== incomingRefreshToken)
    throw new ApiError(401, "Refresh token is expired or already used");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const options = {
  httpOnly: true,
  secure: true,
  sameSite: "none"
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed successfully"
      )
    );
});

/* ----------------------------------------------------- */
/* CHANGE PASSWORD */
/* ----------------------------------------------------- */
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    throw new ApiError(400, "Old and new password are required");

  const user = await User.findById(req.user._id).select("+password");

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) throw new ApiError(401, "Invalid old password");

  if (oldPassword === newPassword)
    throw new ApiError(400, "New password cannot be same as old password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully")
  );
});



/* ----------------------------------------------------- */
/* STEP 1 — REQUEST OTP */
/* ----------------------------------------------------- */
// email version
// const requestPasswordReset = asyncHandler(async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     throw new ApiError(400, "Email is required");
//   }

//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   // Generate 6-digit OTP
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   // Hash OTP
//   const hashedOtp = await bcrypt.hash(otp, 10);

//   user.otp = hashedOtp;
//   user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
//   user.passwordResetVerified = false;

//   await user.save({ validateBeforeSave: false });

//   await sendPasswordOTP(email, otp);

//   return res.status(200).json(
//     new ApiResponse(200, {}, "OTP sent to your email")
//   );
// });

// mobile version

const requestPasswordReset = asyncHandler(async (req, res) => {
    const { mobileNumber } = req.firebaseUser;

    if (!mobileNumber) {
        throw new ApiError(400, "Mobile verification failed");
    }

    const user = await User.findOne({ mobileNumber });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.passwordResetVerified = true;
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {}, "Mobile number verified successfully")
    );
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.otp || !user.otpExpiry) {
    throw new ApiError(400, "OTP not requested");
  }

  if (user.otpExpiry < new Date()) {
    user.otp = null;
    user.otpExpiry = null;
    user.passwordResetVerified = false;

    await user.save({ validateBeforeSave: false });

    throw new ApiError(400, "OTP has expired");
  }

  const isOtpValid = await bcrypt.compare(otp, user.otp);

  if (!isOtpValid) {
    throw new ApiError(400, "Invalid OTP");
  }

  // OTP verified
  user.otp = null;
  user.otpExpiry = null;
  user.passwordResetVerified = true;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, {}, "OTP verified successfully")
  );
});

// const resetPassword = asyncHandler(async (req, res) => {
//   const { email, newPassword } = req.body;

//   if (!email || !newPassword) {
//     throw new ApiError(400, "Email and new password are required");
//   }

//   const user = await User.findOne({ email }).select("+password");

//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   if (!user.passwordResetVerified) {
//     throw new ApiError(400, "Please verify OTP first");
//   }

//   if (await user.isPasswordCorrect(newPassword)) {
//     throw new ApiError(
//       400,
//       "New password cannot be the same as the current password"
//     );
//   }

//   user.password = newPassword;

//   // Reset verification state
//   user.passwordResetVerified = false;

//   // Clear refresh token to log out all devices
//   user.refreshToken = "";

//   await user.save({ validateBeforeSave: false });

//   return res.status(200).json(
//     new ApiResponse(200, {}, "Password reset successfully")
//   );
// });

// ////////// Admin Contollers ////////

const resetPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;
    const mobileNumber = req.firebaseUser?.mobileNumber;

    if (!mobileNumber || !newPassword) {
        throw new ApiError(400, "Mobile number and new password are required");
    }

    const user = await User.findOne({ mobileNumber }).select("+password");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.passwordResetVerified) {
        throw new ApiError(400, "Please verify your mobile number first");
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
        user.passwordResetVerified = false;
        user.otpExpiry = null;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(400, "Reset session expired. Please verify again");
    }

    if (await user.isPasswordCorrect(newPassword)) {
        throw new ApiError(400, "New password cannot be the same as the current password");
    }

    user.password = newPassword;
    user.passwordResetVerified = false;
    user.otpExpiry = null;
    user.refreshToken = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully")
    );
});

/* ----------------------------------------------------- */
/* GET ALL USERS — Admin only */
/* ----------------------------------------------------- */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({role: "user"})
    .select("-password -refreshToken")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, users, "Users fetched successfully")
  );
});

const getAllAdmins = asyncHandler(async (req, res) => {
  const users = await User.find({role: "admin"})
    .select("-password -refreshToken")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, users, "Admins fetched successfully")
  );
});


const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(
    new ApiResponse(200, user, "User fetched successfully")
  );
});

/* ----------------------------------------------------- */
/* BLOCK / UNBLOCK USER — Admin only */
/* ----------------------------------------------------- */
const toggleBlockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(403, "Cannot block an admin");

  user.isBlocked = !user.isBlocked;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      { isBlocked: user.isBlocked },
      `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`
    )
  );
});

/* ----------------------------------------------------- */
/* RESET USER PASSWORD — Admin only */
/* ----------------------------------------------------- */
const resetUserPassword = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) throw new ApiError(400, "New password is required");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(403, "Cannot reset admin password");

  user.password = newPassword; // pre-save hook will hash it
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, {}, "Password reset successfully")
  );
});

/* ----------------------------------------------------- */
/* DELETE USER — Admin only */
/* ----------------------------------------------------- */
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(403, "Cannot delete an admin");

  await User.findByIdAndDelete(userId);

  return res.status(200).json(
    new ApiResponse(200, {}, "User deleted successfully")
  );
});

/* ----------------------------------------------------- */
/* SUPERUSER ALLOWLIST — only these usernames can
   promote/demote admins. Edit as needed.                */
/* ----------------------------------------------------- */
const SUPER_ADMIN_USERNAMES = process.env.SUPER_ADMIN_USERNAMES?.split(",").map(u => u.trim()) ?? [];

/* ----------------------------------------------------- */
/* TOGGLE ADMIN STATUS — Superuser only                  */
/* ----------------------------------------------------- */
const toggleAdminStatus = asyncHandler(async (req, res) => {
  // 1. Gate: only allowlisted usernames may call this
  if (!SUPER_ADMIN_USERNAMES.includes(req.user.username)) {
    throw new ApiError(403, "You are not authorised to perform this action");
  }

  const { userId } = req.params;

  // 2. Target user must exist
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // 3. Prevent a superuser from accidentally demoting themselves
  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot change your own admin status");
  }

  // 4. Toggle: "user" → "admin" and vice-versa
  user.role = user.role === "admin" ? "user" : "admin";
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      { role: user.role },
      `User ${user.role === "admin" ? "promoted to admin" : "demoted to user"} successfully`
    )
  );
});


/* ----------------------------------------------------- */
/* CREATE USER — Admin only                              */
/* ----------------------------------------------------- */
const createUser = asyncHandler(async (req, res) => {
    const { username, password, mobileNumber, email, role } = req.body;

    if (!username || !password || !mobileNumber) {
        throw new ApiError(400, "Username, password and mobile number are required");
    }

    if (!/^[0-9]{10}$/.test(mobileNumber)) {
        throw new ApiError(400, "Enter a valid 10-digit mobile number");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    // Duplicate checks
    let existed = await User.findOne({ mobileNumber });
    if (existed) throw new ApiError(409, "Mobile number already exists");

    existed = await User.findOne({ username: username.toLowerCase() });
    if (existed) throw new ApiError(409, "Username already exists");

    if (email) {
        existed = await User.findOne({ email });
        if (existed) throw new ApiError(409, "Email already exists");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        password,
        mobileNumber,
        email: email || undefined,
        role: role === "admin" ? "admin" : "user",
        avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    });

    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    );
});

/* ----------------------------------------------------- */
export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatarPath,
  addAddress,
  deleteAddress,
  getUserAddresses,
  refreshAccessToken,
  getAllUsers,
  toggleBlockUser,
  deleteUser,changePassword,
  removeAvatar,
  resetUserPassword,
  requestPasswordReset ,
  verifyOtp,
  resetPassword,
  getUserById,
  // sendRegistrationOTP,
  // verifyRegistrationOTP,
  toggleAdminStatus,
  getAllAdmins,
  verifyMobileOTP,
  createUser
};