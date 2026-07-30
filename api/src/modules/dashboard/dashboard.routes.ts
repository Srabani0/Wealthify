import { Router } from "express";
import { dashboardSummaryQuerySchema } from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as dashboardController from "./dashboard.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/summary",
  validate(dashboardSummaryQuerySchema, "query"),
  asyncHandler(dashboardController.getDashboardSummary),
);

export default router;
