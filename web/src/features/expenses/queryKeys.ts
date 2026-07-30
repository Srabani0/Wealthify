import type { ExpenseListParams, ExpenseSummaryParams } from "./api";

export const expenseKeys = {
  all: () => ["expenses"] as const,
  list: (params: ExpenseListParams) => ["expenses", "list", params] as const,
  summary: (params: ExpenseSummaryParams) => ["expenses", "summary", params] as const,
};
