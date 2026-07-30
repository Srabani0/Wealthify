import type {
  ApiListSuccess,
  ApiSuccess,
  CreateExpenseInput,
  ExpenseListQueryInput,
  ExpenseRecord,
  ExpenseTotals,
  UpdateExpenseInput,
} from "@wealthify/shared";
import { api } from "@/lib/axios";

export type ExpenseListParams = Partial<ExpenseListQueryInput>;

export async function listExpenses(params: ExpenseListParams) {
  const { data } = await api.get<ApiListSuccess<ExpenseRecord>>("/expenses", { params });
  return data;
}

export async function createExpense(input: CreateExpenseInput) {
  const { data } = await api.post<ApiSuccess<ExpenseRecord>>("/expenses", input);
  return data.data;
}

export async function updateExpense(id: string, input: UpdateExpenseInput) {
  const { data } = await api.patch<ApiSuccess<ExpenseRecord>>(`/expenses/${id}`, input);
  return data.data;
}

export async function deleteExpense(id: string) {
  await api.delete(`/expenses/${id}`);
}

export interface ExpenseSummaryParams {
  from?: Date;
  to?: Date;
}

export async function getExpenseSummary(params: ExpenseSummaryParams) {
  const { data } = await api.get<ApiSuccess<ExpenseTotals>>("/expenses/summary", { params });
  return data.data;
}
