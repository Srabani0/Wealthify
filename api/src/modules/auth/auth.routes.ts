import { Router } from "express";
import rateLimit from "express-rate-limit";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@wealthify/shared";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as authController from "./auth.controller.js";

const router = Router();

// Scoped tightly to auth endpoints only — these are the only routes that
// take credentials, so they're the only ones worth rate-limiting.
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/register",
  authRateLimit,
  validate(registerSchema),
  asyncHandler(authController.register),
);
router.post("/login", authRateLimit, validate(loginSchema), asyncHandler(authController.login));
router.get("/me", authMiddleware, asyncHandler(authController.me));
router.post(
  "/forgot-password",
  authRateLimit,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
router.post(
  "/reset-password",
  authRateLimit,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

export default router;
