import { Router } from "express";
import { createBrandSchema, updateBrandSchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as brandsController from "./brands.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(brandsController.listBrands));
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  validate(createBrandSchema),
  asyncHandler(brandsController.createBrand),
);
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  validate(updateBrandSchema),
  asyncHandler(brandsController.updateBrand),
);
router.delete("/:id", requireRole("OWNER", "ADMIN"), asyncHandler(brandsController.deleteBrand));

export default router;
