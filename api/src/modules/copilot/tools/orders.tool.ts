import { ToolDefinition } from '../types/copilot.types.js';
import { getOrderSummary, listOrders } from '../../orders/orders.service.js';
import { prisma } from '../../../config/prisma.js';

export const getOrderSummaryTool: ToolDefinition = {
  name: 'getOrderSummary',
  description: 'Retrieve aggregated sales summary including total revenue, profit, count, top selling products, and daily breakdown for a date range.',
  parameters: {
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'ISO start date string (inclusive). Example: "2026-07-01T00:00:00.000Z"'
      },
      to: {
        type: 'string',
        description: 'ISO end date string (inclusive). Example: "2026-07-31T23:59:59.999Z"'
      }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    if (userRole === 'STAFF') {
      return {
        success: false,
        error: 'Unauthorized: Staff roles do not have permission to view revenue summaries.'
      };
    }

    const fromDate = args.from ? new Date(args.from) : undefined;
    const toDate = args.to ? new Date(args.to) : undefined;

    const result = await getOrderSummary(businessId, fromDate, toDate);
    return {
      success: true,
      summary: result
    };
  }
};

export const listOrdersTool: ToolDefinition = {
  name: 'listOrders',
  description: 'List detailed orders with pagination and filters by customer, status, sales channel, or date range.',
  parameters: {
    type: 'object',
    properties: {
      customerId: {
        type: 'string',
        description: 'Filter orders by customer ID'
      },
      status: {
        type: 'string',
        description: 'Filter by order status',
        enum: ['READY', 'DELIVERED', 'COMPLETED', 'CANCELLED']
      },
      channel: {
        type: 'string',
        description: 'Filter by sales channel',
        enum: ['INSTAGRAM', 'WHATSAPP', 'OFFLINE', 'OTHER']
      },
      from: {
        type: 'string',
        description: 'ISO start date string'
      },
      to: {
        type: 'string',
        description: 'ISO end date string'
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (starts at 1)'
      },
      pageSize: {
        type: 'number',
        description: 'Number of records per page (max 50)'
      }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const page = Math.max(1, args.page || 1);
    const pageSize = Math.min(50, args.pageSize || 20);

    const query = {
      customerId: args.customerId,
      status: args.status,
      channel: args.channel,
      from: args.from ? new Date(args.from) : undefined,
      to: args.to ? new Date(args.to) : undefined,
      page,
      pageSize
    };

    const result = await listOrders(businessId, query);
    return {
      success: true,
      ...result,
      page,
      pageSize
    };
  }
};

export const getOrderCountTool: ToolDefinition = {
  name: 'getOrderCount',
  description: 'Retrieve the total number of orders placed in a date range (excluding cancelled orders).',
  parameters: {
    type: 'object',
    properties: {
      from: { type: 'string', description: 'ISO start date string' },
      to: { type: 'string', description: 'ISO end date string' }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const where: any = { businessId, status: { not: 'CANCELLED' } };
    if (args.from || args.to) {
      where.orderDate = {};
      if (args.from) where.orderDate.gte = new Date(args.from);
      if (args.to) where.orderDate.lte = new Date(args.to);
    }
    const count = await prisma.order.count({ where });
    return { success: true, count };
  }
};

export const getPendingOrdersTool: ToolDefinition = {
  name: 'getPendingOrders',
  description: 'List all pending/active orders (status: READY or DELIVERED, but not yet COMPLETED or CANCELLED).',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const orders = await prisma.order.findMany({
      where: { businessId, status: { in: ['READY', 'DELIVERED'] } },
      include: { customer: true },
      orderBy: { orderDate: 'desc' }
    });
    return { success: true, orders };
  }
};

export const getCancelledOrdersTool: ToolDefinition = {
  name: 'getCancelledOrders',
  description: 'List all cancelled orders.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const orders = await prisma.order.findMany({
      where: { businessId, status: 'CANCELLED' },
      include: { customer: true },
      orderBy: { orderDate: 'desc' }
    });
    return { success: true, orders };
  }
};

export const getCompletedOrdersTool: ToolDefinition = {
  name: 'getCompletedOrders',
  description: 'List all completed orders.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const orders = await prisma.order.findMany({
      where: { businessId, status: 'COMPLETED' },
      include: { customer: true },
      orderBy: { orderDate: 'desc' }
    });
    return { success: true, orders };
  }
};

export const getOrdersByCustomerTool: ToolDefinition = {
  name: 'getOrdersByCustomer',
  description: 'List all orders placed by a specific customer.',
  parameters: {
    type: 'object',
    properties: {
      customerId: { type: 'string', description: 'Customer ID' }
    },
    required: ['customerId']
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const orders = await prisma.order.findMany({
      where: { businessId, customerId: args.customerId },
      include: { customer: true },
      orderBy: { orderDate: 'desc' }
    });
    return { success: true, orders };
  }
};

export const getOrdersByCategoryTool: ToolDefinition = {
  name: 'getOrdersByCategory',
  description: 'List all orders containing products belonging to a specific category.',
  parameters: {
    type: 'object',
    properties: {
      categoryName: { type: 'string', description: 'The product category name (e.g. Bouquet)' }
    },
    required: ['categoryName']
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const category = await prisma.category.findFirst({
      where: { businessId, name: { contains: args.categoryName, mode: 'insensitive' } }
    });
    if (!category) {
      return { success: true, orders: [], message: `Category "${args.categoryName}" not found.` };
    }
    const orders = await prisma.order.findMany({
      where: {
        businessId,
        items: {
          some: {
            variant: {
              product: {
                categoryId: category.id
              }
            }
          }
        }
      },
      include: { customer: true },
      orderBy: { orderDate: 'desc' }
    });
    return { success: true, orders };
  }
};

export const getOrdersByDateTool: ToolDefinition = {
  name: 'getOrdersByDate',
  description: 'Retrieve all orders placed on a specific calendar day.',
  parameters: {
    type: 'object',
    properties: {
      date: { type: 'string', description: 'Calendar date in YYYY-MM-DD format (e.g. 2026-10-12)' }
    },
    required: ['date']
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const targetDate = new Date(args.date);
    if (isNaN(targetDate.getTime())) {
      return { success: false, error: 'Invalid date format. Please use YYYY-MM-DD.' };
    }
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        businessId,
        orderDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: { customer: true, items: { include: { variant: { include: { product: true } } } } },
      orderBy: { orderDate: 'desc' }
    });
    return { success: true, orders };
  }
};
