import { Router } from "express";
import { z } from "zod";
import { createUserSchema, updateUserSchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as usersController from "./users.controller.js";

const router = Router();

const paramsSchema = z.object({ id: z.string().min(1) });

// Owner/Admin only — Staff cannot view or manage the user list.
router.use(authMiddleware, requireRole("OWNER", "ADMIN"));

router.get("/", asyncHandler(usersController.listUsers));
router.post("/", validate(createUserSchema), asyncHandler(usersController.createUser));
router.patch(
  "/:id",
  validate(paramsSchema, "params"),
  validate(updateUserSchema),
  asyncHandler(usersController.updateUser),
);

export default router;
