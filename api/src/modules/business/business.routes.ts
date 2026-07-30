import { Router } from "express";
import { updateBusinessLogoSchema, updateBusinessSchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as businessController from "./business.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(businessController.getBusiness));
router.patch(
  "/",
  requireRole("OWNER", "ADMIN"),
  validate(updateBusinessSchema),
  asyncHandler(businessController.updateBusiness),
);
router.patch(
  "/logo",
  requireRole("OWNER", "ADMIN"),
  validate(updateBusinessLogoSchema),
  asyncHandler(businessController.updateBusinessLogo),
);

export default router;
