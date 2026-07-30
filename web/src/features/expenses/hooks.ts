import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateExpenseInput } from "@wealthify/shared";
import * as expensesApi from "./api";
import type { ExpenseListParams, ExpenseSummaryParams } from "./api";
import { expenseKeys } from "./queryKeys";

export function useExpenses(params: ExpenseListParams) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expensesApi.listExpenses(params),
  });
}

export function useExpenseSummary(params: ExpenseSummaryParams) {
  return useQuery({
    queryKey: expenseKeys.summary(params),
    queryFn: () => expensesApi.getExpenseSummary(params),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all() }),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExpenseInput }) =>
      expensesApi.updateExpense(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all() }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.deleteExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all() }),
  });
}
