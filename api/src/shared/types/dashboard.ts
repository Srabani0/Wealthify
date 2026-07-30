// Every field here is computed/combined in JS from other modules' summaries
// (Orders, Purchases, Expenses, Inventory), so — same convention as
// PurchaseByDay/OrderByDay — these are genuine JSON numbers, not the
// Decimal-serializes-to-string convention used for raw Prisma model fields.
export interface DashboardActivityItem {
  id: string;
  type: "ORDER" | "STOCK_MOVEMENT" | "EXPENSE";
  title: string;
  detail: string;
  amount: number | null;
  occurredAt: string;
}

export interface DashboardSummary {
  revenue: number;
  orderProfit: number;
  expenses: number;
  // orderProfit - expenses. Deliberately NOT re-subtracting
  // rawMaterialInvestment — product cost prices already reflect material
  // cost, so that's already netted into orderProfit; subtracting it again
  // here would double-count it.
  bottomLine: number;
  rawMaterialInvestment: number;
  lowStockCount: number;
  orderCount: number;
  recentActivity: DashboardActivityItem[];
}
