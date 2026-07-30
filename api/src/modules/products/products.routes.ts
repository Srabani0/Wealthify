import { Router } from "express";
import {
  addProductImageSchema,
  addProductVariantSchema,
  createProductSchema,
  productListQuerySchema,
  updateProductSchema,
  updateProductVariantSchema,
} from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as productsController from "./products.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", validate(productListQuerySchema, "query"), asyncHandler(productsController.listProducts));
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  validate(createProductSchema),
  asyncHandler(productsController.createProduct),
);

// Literal-prefixed sub-resource routes first — segment count/literal
// "variants"/"images" never collide with the single-segment `/:id` routes
// below, but keeping them grouped together avoids any ambiguity at a glance.
router.patch(
  "/variants/:variantId",
  requireRole("OWNER", "ADMIN"),
  validate(updateProductVariantSchema),
  asyncHandler(productsController.updateProductVariant),
);
router.delete(
  "/variants/:variantId",
  requireRole("OWNER", "ADMIN"),
  asyncHandler(productsController.deleteProductVariant),
);
router.get("/variants/:variantId/barcode", asyncHandler(productsController.getVariantBarcode));
router.get("/variants/:variantId/qrcode", asyncHandler(productsController.getVariantQrCode));
router.delete(
  "/images/:imageId",
  requireRole("OWNER", "ADMIN"),
  asyncHandler(productsController.deleteProductImage),
);

router.get("/:id", asyncHandler(productsController.getProduct));
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  validate(updateProductSchema),
  asyncHandler(productsController.updateProduct),
);
router.delete("/:id", requireRole("OWNER", "ADMIN"), asyncHandler(productsController.deleteProduct));
router.post(
  "/:id/variants",
  requireRole("OWNER", "ADMIN"),
  validate(addProductVariantSchema),
  asyncHandler(productsController.addProductVariant),
);
router.post(
  "/:id/images",
  requireRole("OWNER", "ADMIN"),
  validate(addProductImageSchema),
  asyncHandler(productsController.addProductImage),
);

export default router;
