import { Router } from "express";
import { stockAdjustmentSchema, stockMovementQuerySchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as inventoryController from "./inventory.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/adjustments",
  requireRole("OWNER", "ADMIN", "STAFF"),
  validate(stockAdjustmentSchema),
  asyncHandler(inventoryController.adjustStock),
);
router.get(
  "/movements",
  validate(stockMovementQuerySchema, "query"),
  asyncHandler(inventoryController.listStockMovements),
);
router.get("/low-stock", asyncHandler(inventoryController.listLowStock));

export default router;
