import { z } from "zod";
import { listQuerySchema } from "./common.schema.js";

export const createExpenseSchema = z.object({
  expenseDate: z.coerce.date().optional(),
  description: z.string().trim().min(1, "Description is required").max(200),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  notes: z.string().trim().max(500).optional().nullable(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const expenseListQuerySchema = listQuerySchema.extend({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type ExpenseListQueryInput = z.infer<typeof expenseListQuerySchema>;

export const expenseSummaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type ExpenseSummaryQueryInput = z.infer<typeof expenseSummaryQuerySchema>;
