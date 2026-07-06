import { Router } from "express";
import {
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
  deleteUser,
  changePassword,
  removeAvatar,
  resetUserPassword,
  requestPasswordReset,
  verifyOtp,
  resetPassword,
  getUserById,
  // sendRegistrationOTP,
  // verifyRegistrationOTP,
  toggleAdminStatus,
  getAllAdmins,
  verifyMobileOTP,
  createUser
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/authAdmin.middleware.js";
import { verifyFirebaseToken } from "../middlewares/firebaseAuth.middleware.js";

const router = Router();

/* ===================================================== */
/* AUTH ROUTES */
/* ===================================================== */

// REGISTER (step 3 after OTP verification)
// router.post(
//   "/register",
//   upload.fields([{ name: "avatar", maxCount: 1 }]),
//   registerUser
// );

router.post(
    "/verify-mobile",
    verifyFirebaseToken,
    verifyMobileOTP
);

router.post(
    "/register",
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    verifyFirebaseToken,
    registerUser
);


// email verification version 
// // SEND REGISTRATION OTP
// router.post("/send-registration-otp", sendRegistrationOTP);

// // VERIFY REGISTRATION OTP
// router.post("/verify-registration-otp", verifyRegistrationOTP);

// LOGIN
router.post("/login", loginUser);

// LOGOUT
router.post("/logout", verifyjwt, logoutUser);

// REFRESH TOKEN
router.post("/refresh-token", refreshAccessToken);


/* ===================================================== */
/* USER ROUTES (AUTH REQUIRED) */
/* ===================================================== */

router.get("/current-user", verifyjwt, getCurrentUser);

router.patch("/update-account", verifyjwt, updateAccountDetails);

router.patch(
  "/update-avatar",
  verifyjwt,
  upload.single("avatar"),
  updateUserAvatarPath
);

router.post("/change-password", verifyjwt, changePassword);

router.delete("/remove-avatar", verifyjwt, removeAvatar);


/* ===================================================== */
/* ADDRESS ROUTES (AUTH REQUIRED) */
/* ===================================================== */

router.get("/addresses", verifyjwt, getUserAddresses);

router.post("/addresses", verifyjwt, addAddress);

router.delete("/addresses/:addressId", verifyjwt, deleteAddress);


/* ===================================================== */
/* FORGOT PASSWORD ROUTES */
/* ===================================================== */

// STEP 1: request OTP
router.post("/request-password-reset",verifyFirebaseToken, requestPasswordReset);

// STEP 2: verify OTP
// router.post("/verify-otp", verifyOtp);

// STEP 3: reset password
router.post("/reset-password", verifyFirebaseToken , resetPassword);


/* ===================================================== */
/* ADMIN ROUTES */
/* ===================================================== */

router.get(
  "/admin/users",
  verifyjwt,
  verifyAdmin,
  getAllUsers
);
router.get(
  "/admin/admins",
  verifyjwt,
  verifyAdmin,
  getAllAdmins
);


router.get(
  "/admin/users/:userId",
  verifyjwt,
  verifyAdmin,
  getUserById
);

router.patch(
  "/admin/users/:userId/block",
  verifyjwt,
  verifyAdmin,
  toggleBlockUser
);

router.patch(
  "/admin/users/:userId/reset-password",
  verifyjwt,
  verifyAdmin,
  resetUserPassword
);

router.delete(
  "/admin/users/:userId",
  verifyjwt,
  verifyAdmin,
  deleteUser
);

router.post(
  "/admin/create-user",
  verifyjwt,
  verifyAdmin,
  createUser
);

router.patch("/admin/toggle/:userId", verifyjwt,verifyAdmin, toggleAdminStatus);

/* ===================================================== */

export default router;