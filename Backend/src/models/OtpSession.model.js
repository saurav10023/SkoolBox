// models/otpSession.model.js
import mongoose from "mongoose";

const otpSessionSchema = new mongoose.Schema({
  mobileNumber:     { type: String, required: true, unique: true },
  verified: {
        type: Boolean,
        default: false
    }
});

otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const OtpSession = mongoose.model("OtpSession", otpSessionSchema);