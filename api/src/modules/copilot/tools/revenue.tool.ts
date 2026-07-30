import { ToolDefinition } from '../types/copilot.types.js';
import { prisma } from '../../../config/prisma.js';

export const getRevenueTool: ToolDefinition = {
  name: 'getRevenue',
  description: 'Retrieve overall financial sales revenue and profit for a custom date range.',
  parameters: {
    type: 'object',
    properties: {
      from: { type: 'string', description: 'ISO start date string' },
      to: { type: 'string', description: 'ISO end date string' }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    if (userRole === 'STAFF') {
      return { success: false, error: 'Unauthorized: Staff roles do not have permission to view revenue summaries.' };
    }

    const where: any = { businessId, status: { not: 'CANCELLED' } };
    if (args.from || args.to) {
      where.orderDate = {};
      if (args.from) where.orderDate.gte = new Date(args.from);
      if (args.to) where.orderDate.lte = new Date(args.to);
    }

    const totalAgg = await prisma.order.aggregate({
      where,
      _sum: { totalAmount: true, totalProfit: true },
      _count: true
    });

    return {
      success: true,
      revenue: totalAgg._sum.totalAmount ?? 0,
      profit: totalAgg._sum.totalProfit ?? 0,
      orderCount: totalAgg._count
    };
  }
};

export const getRevenueByDateTool: ToolDefinition = {
  name: 'getRevenueByDate',
  description: 'Retrieve revenue figures for a specific calendar date (YYYY-MM-DD).',
  parameters: {
    type: 'object',
    properties: {
      date: { type: 'string', description: 'Calendar date in YYYY-MM-DD format (e.g. 2026-10-12)' }
    },
    required: ['date']
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    if (userRole === 'STAFF') {
      return { success: false, error: 'Unauthorized: Staff roles do not have permission to view revenue.' };
    }

    const targetDate = new Date(args.date);
    if (isNaN(targetDate.getTime())) {
      return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const totalAgg = await prisma.order.aggregate({
      where: {
        businessId,
        status: { not: 'CANCELLED' },
        orderDate: { gte: startOfDay, lte: endOfDay }
      },
      _sum: { totalAmount: true, totalProfit: true },
      _count: true
    });

    return {
      success: true,
      date: args.date,
      revenue: totalAgg._sum.totalAmount ?? 0,
      profit: totalAgg._sum.totalProfit ?? 0,
      orderCount: totalAgg._count
    };
  }
};

export const getRevenueByMonthTool: ToolDefinition = {
  name: 'getRevenueByMonth',
  description: 'Retrieve revenue figures for a specific month (1-12) of a given year (YYYY).',
  parameters: {
    type: 'object',
    properties: {
      year: { type: 'number', description: 'Calendar year (e.g. 2026)' },
      month: { type: 'number', description: 'Month number (1-12, e.g. 7 for July)' }
    },
    required: ['year', 'month']
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    if (userRole === 'STAFF') {
      return { success: false, error: 'Unauthorized: Staff roles do not have permission to view revenue.' };
    }

    const start = new Date(Date.UTC(args.year, args.month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(args.year, args.month, 0, 23, 59, 59, 999));

    const totalAgg = await prisma.order.aggregate({
      where: {
        businessId,
        status: { not: 'CANCELLED' },
        orderDate: { gte: start, lte: end }
      },
      _sum: { totalAmount: true, totalProfit: true },
      _count: true
    });

    return {
      success: true,
      year: args.year,
      month: args.month,
      revenue: totalAgg._sum.totalAmount ?? 0,
      profit: totalAgg._sum.totalProfit ?? 0,
      orderCount: totalAgg._count
    };
  }
};

export const getRevenueByYearTool: ToolDefinition = {
  name: 'getRevenueByYear',
  description: 'Retrieve revenue figures for a specific year (YYYY).',
  parameters: {
    type: 'object',
    properties: {
      year: { type: 'number', description: 'Calendar year (e.g. 2026)' }
    },
    required: ['year']
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    if (userRole === 'STAFF') {
      return { success: false, error: 'Unauthorized: Staff roles do not have permission to view revenue.' };
    }

    const start = new Date(Date.UTC(args.year, 0, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(args.year + 1, 0, 0, 23, 59, 59, 999));

    const totalAgg = await prisma.order.aggregate({
      where: {
        businessId,
        status: { not: 'CANCELLED' },
        orderDate: { gte: start, lte: end }
      },
      _sum: { totalAmount: true, totalProfit: true },
      _count: true
    });

    return {
      success: true,
      year: args.year,
      revenue: totalAgg._sum.totalAmount ?? 0,
      profit: totalAgg._sum.totalProfit ?? 0,
      orderCount: totalAgg._count
    };
  }
};
