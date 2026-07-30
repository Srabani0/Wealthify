import { Router } from "express";
import { createSupplierSchema, updateSupplierSchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as suppliersController from "./suppliers.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(suppliersController.listSuppliers));
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  validate(createSupplierSchema),
  asyncHandler(suppliersController.createSupplier),
);
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  validate(updateSupplierSchema),
  asyncHandler(suppliersController.updateSupplier),
);
router.delete("/:id", requireRole("OWNER", "ADMIN"), asyncHandler(suppliersController.deleteSupplier));

export default router;
