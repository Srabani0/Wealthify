import { Router } from "express";
import { signUploadSchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as uploadsController from "./uploads.controller.js";

const router = Router();

router.post(
  "/sign",
  authMiddleware,
  validate(signUploadSchema),
  asyncHandler(uploadsController.signUpload),
);

export default router;
