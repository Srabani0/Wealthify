import type { Request, Response } from "express";
import type {
  CreateExpenseInput,
  ExpenseListQueryInput,
  ExpenseSummaryQueryInput,
  UpdateExpenseInput,
} from "@wealthify/shared";
import * as expensesService from "./expenses.service.js";
import { sendList, sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function listExpenses(req: Request, res: Response) {
  const query = req.query as unknown as ExpenseListQueryInput;
  const { items, total } = await expensesService.listExpenses(requireBusinessId(req), query);
  sendList(res, items, { page: query.page, pageSize: query.pageSize, total });
}

export async function createExpense(req: Request, res: Response) {
  const input = req.body as CreateExpenseInput;
  const expense = await expensesService.createExpense(requireBusinessId(req), input);
  sendSuccess(res, expense, 201, "Expense logged");
}

export async function updateExpense(req: Request, res: Response) {
  const input = req.body as UpdateExpenseInput;
  const expense = await expensesService.updateExpense(
    requireBusinessId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, expense, 200, "Expense updated");
}

export async function deleteExpense(req: Request, res: Response) {
  await expensesService.deleteExpense(requireBusinessId(req), req.params.id as string);
  sendSuccess(res, null, 200, "Expense deleted");
}

export async function getExpenseSummary(req: Request, res: Response) {
  const query = req.query as unknown as ExpenseSummaryQueryInput;
  const summary = await expensesService.getExpenseSummary(requireBusinessId(req), query.from, query.to);
  sendSuccess(res, summary);
}
