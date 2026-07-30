import { ToolDefinition } from '../types/copilot.types.js';
import { prisma } from '../../../config/prisma.js';
import { listLowStock } from '../../inventory/inventory.service.js';

export const getDashboardSummaryTool: ToolDefinition = {
  name: 'getDashboardSummary',
  description: 'Retrieve a complete high-level business analytics dashboard summary for today.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    // Only Admin / Owner can view financial dashboard summaries
    if (userRole === 'STAFF') {
      return { success: false, error: 'Unauthorized: Staff roles do not have permission to view high-level financial dashboard summaries.' };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [todayOrders, todayExpenses, lowStockItems, totalProducts] = await Promise.all([
      prisma.order.aggregate({
        where: {
          businessId,
          status: { not: 'CANCELLED' },
          orderDate: { gte: startOfDay, lte: endOfDay }
        },
        _sum: { totalAmount: true, totalProfit: true },
        _count: true
      }),
      prisma.expense.aggregate({
        where: {
          businessId,
          expenseDate: { gte: startOfDay, lte: endOfDay }
        },
        _sum: { amount: true },
        _count: true
      }),
      listLowStock(businessId),
      prisma.productVariant.count({
        where: { isActive: true, product: { businessId, isActive: true } }
      })
    ]);

    const revenue = Number(todayOrders._sum.totalAmount ?? 0);
    const profit = Number(todayOrders._sum.totalProfit ?? 0);
    const orderCount = todayOrders._count;

    const expenseAmount = Number(todayExpenses._sum.amount ?? 0);
    const expenseCount = todayExpenses._count;

    return {
      success: true,
      summary: {
        date: new Date().toISOString().slice(0, 10),
        todayRevenue: Math.round(revenue * 100) / 100,
        todayProfit: Math.round(profit * 100) / 100,
        todayOrdersCount: orderCount,
        todayExpensesAmount: Math.round(expenseAmount * 100) / 100,
        todayExpensesCount: expenseCount,
        lowStockItemsCount: lowStockItems.length,
        totalActiveProductsCount: totalProducts,
        netCashFlow: Math.round((revenue - expenseAmount) * 100) / 100
      }
    };
  }
};
