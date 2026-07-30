import { Router } from "express";
import { createOrderSchema, orderListQuerySchema, orderSummaryQuerySchema, updateOrderSchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as ordersController from "./orders.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/summary",
  validate(orderSummaryQuerySchema, "query"),
  asyncHandler(ordersController.getOrderSummary),
);
router.get("/", validate(orderListQuerySchema, "query"), asyncHandler(ordersController.listOrders));
router.get("/:id/bill.pdf", asyncHandler(ordersController.getOrderBill));
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  validate(createOrderSchema),
  asyncHandler(ordersController.createOrder),
);
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  validate(updateOrderSchema),
  asyncHandler(ordersController.updateOrder),
);

export default router;
