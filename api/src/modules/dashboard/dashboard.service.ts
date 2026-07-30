import type { DashboardActivityItem } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import * as ordersService from "../orders/orders.service.js";
import * as purchasesService from "../purchases/purchases.service.js";
import * as expensesService from "../expenses/expenses.service.js";
import * as inventoryService from "../inventory/inventory.service.js";

const RECENT_ACTIVITY_LIMIT = 15;

interface ActivityDraft {
  id: string;
  type: "ORDER" | "STOCK_MOVEMENT" | "EXPENSE";
  title: string;
  detail: string;
  amount: number | null;
  occurredAt: Date;
}

async function getRecentActivity(
  businessId: string,
  from?: Date,
  to?: Date,
): Promise<DashboardActivityItem[]> {
  const dateRange = from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;

  const [orders, movements, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { businessId, ...(dateRange ? { orderDate: dateRange } : {}) },
      include: {
        customer: true,
        items: { include: { variant: { include: { product: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
    }),
    prisma.stockMovement.findMany({
      where: { businessId, ...(dateRange ? { createdAt: dateRange } : {}) },
      include: { variant: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
    }),
    prisma.expense.findMany({
      where: { businessId, ...(dateRange ? { expenseDate: dateRange } : {}) },
      orderBy: { createdAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
    }),
  ]);

  const drafts: ActivityDraft[] = [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      type: "ORDER" as const,
      title: order.customer ? `Order — ${order.customer.name}` : "Order",
      detail: order.items.map((item) => `${item.variant.product.name} ×${item.quantity}`).join(", "),
      amount: Number(order.totalAmount),
      occurredAt: order.createdAt,
    })),
    ...movements.map((movement) => ({
      id: `movement-${movement.id}`,
      type: "STOCK_MOVEMENT" as const,
      title: movement.type.endsWith("IN") ? "Stock in" : "Stock out",
      detail: `${movement.variant.product.name}${movement.reason ? ` — ${movement.reason}` : ""}`,
      amount: movement.type.endsWith("IN") ? movement.quantity : -movement.quantity,
      occurredAt: movement.createdAt,
    })),
    ...expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      type: "EXPENSE" as const,
      title: "Expense",
      detail: expense.description,
      amount: -Number(expense.amount),
      occurredAt: expense.createdAt,
    })),
  ];

  return drafts
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map((draft) => ({ ...draft, occurredAt: draft.occurredAt.toISOString() }));
}

export async function getDashboardSummary(businessId: string, from?: Date, to?: Date) {
  const [orderSummary, purchaseSummary, expenseSummary, lowStock, recentActivity] = await Promise.all([
    ordersService.getOrderSummary(businessId, from, to),
    purchasesService.getPurchaseSummary(businessId, from, to),
    expensesService.getExpenseSummary(businessId, from, to),
    inventoryService.listLowStock(businessId),
    getRecentActivity(businessId, from, to),
  ]);

  const revenue = Number(orderSummary.totalAmount);
  const orderProfit = Number(orderSummary.totalProfit);
  const expenses = Number(expenseSummary.totalAmount);
  const rawMaterialInvestment = Number(purchaseSummary.totalAmount);

  return {
    revenue,
    orderProfit,
    expenses,
    // Deliberately NOT re-subtracting rawMaterialInvestment — product cost
    // prices already reflect material cost, so it's already netted into
    // orderProfit; subtracting it again here would double-count it.
    bottomLine: Math.round((orderProfit - expenses) * 100) / 100,
    rawMaterialInvestment,
    lowStockCount: lowStock.length,
    orderCount: orderSummary.orderCount,
    recentActivity,
  };
}
