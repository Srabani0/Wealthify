import { ToolDefinition } from '../types/copilot.types.js';
import { listCustomers } from '../../customers/customers.service.js';
import { prisma } from '../../../config/prisma.js';

export const listCustomersTool: ToolDefinition = {
  name: 'listCustomers',
  description: 'List active customers registered in the business system.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const result = await listCustomers(businessId);
    return {
      success: true,
      customers: result
    };
  }
};

export const getCustomerTool: ToolDefinition = {
  name: 'getCustomer',
  description: 'Retrieve profile details of a specific customer by ID or name.',
  parameters: {
    type: 'object',
    properties: {
      customerId: { type: 'string', description: 'Customer ID' },
      name: { type: 'string', description: 'Customer name' }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    let customer = null;
    if (args.customerId) {
      customer = await prisma.customer.findFirst({
        where: { businessId, id: args.customerId }
      });
    } else if (args.name) {
      customer = await prisma.customer.findFirst({
        where: { businessId, name: { contains: args.name, mode: 'insensitive' } }
      });
    }
    return { success: true, customer };
  }
};

export const getCustomerOrdersTool: ToolDefinition = {
  name: 'getCustomerOrders',
  description: 'List all orders placed by a specific customer, including details and statuses.',
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
      orderBy: { orderDate: 'desc' }
    });
    return { success: true, orders };
  }
};

export const getTopCustomersTool: ToolDefinition = {
  name: 'getTopCustomers',
  description: 'Retrieve top spending customers rank-ordered by total order value.',
  parameters: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Number of customers to return (default: 5)' }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    if (userRole === 'STAFF') {
      return { success: false, error: 'Unauthorized: Staff roles do not have permission to view high-level client financial standings.' };
    }

    const limit = args.limit || 5;

    // Group by customerId and sum order totals
    const groupings = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        businessId,
        customerId: { not: null },
        status: { not: 'CANCELLED' }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: limit
    });

    const enriched = await Promise.all(
      groupings.map(async (g: any) => {
        const customer = await prisma.customer.findUnique({
          where: { id: g.customerId! },
          select: { id: true, name: true, phone: true, email: true }
        });
        return {
          customer,
          totalSpent: g._sum.totalAmount ?? 0,
          ordersCount: g._count.id
        };
      })
    );

    return { success: true, topCustomers: enriched };
  }
};

export const getCustomerInvoicesTool: ToolDefinition = {
  name: 'getCustomerInvoices',
  description: 'Retrieve all invoices (orders with invoice numbers) and payment statuses for a customer.',
  parameters: {
    type: 'object',
    properties: {
      customerId: { type: 'string', description: 'Customer ID' }
    },
    required: ['customerId']
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const invoices = await prisma.order.findMany({
      where: {
        businessId,
        customerId: args.customerId,
        billNumber: { not: null }
      },
      select: {
        id: true,
        billNumber: true,
        orderDate: true,
        status: true,
        paymentStatus: true,
        totalAmount: true
      },
      orderBy: { orderDate: 'desc' }
    });

    return { success: true, invoices };
  }
};
