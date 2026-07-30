import { Router } from "express";
import { createCustomerSchema, updateCustomerSchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as customersController from "./customers.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(customersController.listCustomers));
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  validate(createCustomerSchema),
  asyncHandler(customersController.createCustomer),
);
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  validate(updateCustomerSchema),
  asyncHandler(customersController.updateCustomer),
);
router.delete("/:id", requireRole("OWNER", "ADMIN"), asyncHandler(customersController.deleteCustomer));

export default router;
