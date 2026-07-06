import rateLimit from "express-rate-limit";

export const smsWebhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many webhook requests",
  },
});