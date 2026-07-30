import { Router } from "express";
import { createCategorySchema, updateCategorySchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as categoriesController from "./categories.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(categoriesController.listCategories));
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  validate(createCategorySchema),
  asyncHandler(categoriesController.createCategory),
);
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  validate(updateCategorySchema),
  asyncHandler(categoriesController.updateCategory),
);
router.delete(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  asyncHandler(categoriesController.deleteCategory),
);

export default router;
