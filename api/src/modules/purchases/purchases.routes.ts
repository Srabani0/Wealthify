import { Router } from "express";
import {
  createPurchaseSchema,
  purchaseListQuerySchema,
  purchaseSummaryQuerySchema,
  updatePurchaseSchema,
} from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as purchasesController from "./purchases.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/summary",
  validate(purchaseSummaryQuerySchema, "query"),
  asyncHandler(purchasesController.getPurchaseSummary),
);
router.get("/", validate(purchaseListQuerySchema, "query"), asyncHandler(purchasesController.listPurchases));
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  validate(createPurchaseSchema),
  asyncHandler(purchasesController.createPurchase),
);
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  validate(updatePurchaseSchema),
  asyncHandler(purchasesController.updatePurchase),
);
router.delete("/:id", requireRole("OWNER", "ADMIN"), asyncHandler(purchasesController.deletePurchase));

export default router;
