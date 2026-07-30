export interface ExpenseRecord {
  id: string;
  expenseDate: string;
  description: string;
  amount: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Computed in JS from raw rows, same convention as PurchaseByDay/OrderByDay
// — a genuine JSON number, not the Decimal-serializes-to-string convention
// used for fields that come straight off a Prisma model.
export interface ExpenseByDay {
  date: string;
  totalAmount: number;
  count: number;
}

export interface ExpenseTotals {
  totalAmount: string;
  expenseCount: number;
  byDay: ExpenseByDay[];
}
