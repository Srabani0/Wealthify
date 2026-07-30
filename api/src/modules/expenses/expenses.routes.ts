import { Router } from "express";
import {
  createExpenseSchema,
  expenseListQuerySchema,
  expenseSummaryQuerySchema,
  updateExpenseSchema,
} from "@wealthify/shared";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role-guard.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import * as expensesController from "./expenses.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/summary",
  validate(expenseSummaryQuerySchema, "query"),
  asyncHandler(expensesController.getExpenseSummary),
);
router.get("/", validate(expenseListQuerySchema, "query"), asyncHandler(expensesController.listExpenses));
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  validate(createExpenseSchema),
  asyncHandler(expensesController.createExpense),
);
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  validate(updateExpenseSchema),
  asyncHandler(expensesController.updateExpense),
);
router.delete("/:id", requireRole("OWNER", "ADMIN"), asyncHandler(expensesController.deleteExpense));

export default router;
