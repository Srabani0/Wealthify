import { Router } from "express";
import { createRawMaterialSchema, updateRawMaterialSchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as rawMaterialsController from "./raw-materials.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(rawMaterialsController.listRawMaterials));
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  validate(createRawMaterialSchema),
  asyncHandler(rawMaterialsController.createRawMaterial),
);
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  validate(updateRawMaterialSchema),
  asyncHandler(rawMaterialsController.updateRawMaterial),
);
router.delete("/:id", requireRole("OWNER", "ADMIN"), asyncHandler(rawMaterialsController.deleteRawMaterial));

export default router;
