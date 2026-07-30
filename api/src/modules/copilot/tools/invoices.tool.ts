import { ToolDefinition } from '../types/copilot.types.js';
import { prisma } from '../../../config/prisma.js';

export const getInvoicesTool: ToolDefinition = {
  name: 'getInvoices',
  description: 'List all invoices (completed orders with bill numbers) within an optional date range.',
  parameters: {
    type: 'object',
    properties: {
      from: { type: 'string', description: 'ISO start date string' },
      to: { type: 'string', description: 'ISO end date string' }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const where: any = {
      businessId,
      billNumber: { not: null },
      status: { not: 'CANCELLED' }
    };

    if (args.from || args.to) {
      where.orderDate = {};
      if (args.from) where.orderDate.gte = new Date(args.from);
      if (args.to) where.orderDate.lte = new Date(args.to);
    }

    const invoices = await prisma.order.findMany({
      where,
      include: { customer: true },
      orderBy: { orderDate: 'desc' }
    });

    const items = invoices.map((inv: any) => ({
      invoiceId: inv.id,
      billNumber: inv.billNumber,
      orderDate: inv.orderDate,
      customerName: inv.customer?.name ?? 'Guest Customer',
      status: inv.status,
      paymentStatus: inv.paymentStatus,
      totalAmount: inv.totalAmount
    }));

    return { success: true, invoices: items };
  }
};

export const getUnpaidInvoicesTool: ToolDefinition = {
  name: 'getUnpaidInvoices',
  description: 'Retrieve all outstanding unpaid invoices.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const invoices = await prisma.order.findMany({
      where: {
        businessId,
        billNumber: { not: null },
        paymentStatus: 'UNPAID',
        status: { not: 'CANCELLED' }
      },
      include: { customer: true },
      orderBy: { orderDate: 'desc' }
    });

    const items = invoices.map((inv: any) => ({
      invoiceId: inv.id,
      billNumber: inv.billNumber,
      orderDate: inv.orderDate,
      customerName: inv.customer?.name ?? 'Guest Customer',
      status: inv.status,
      paymentStatus: inv.paymentStatus,
      totalAmount: inv.totalAmount
    }));

    return { success: true, invoices: items };
  }
};

export const getInvoiceDetailsTool: ToolDefinition = {
  name: 'getInvoiceDetails',
  description: 'Retrieve complete invoice invoice line items and customer details using its sequential bill number.',
  parameters: {
    type: 'object',
    properties: {
      billNumber: { type: 'number', description: 'The sequential invoice bill number (e.g. 5)' }
    },
    required: ['billNumber']
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const invoice = await prisma.order.findFirst({
      where: {
        businessId,
        billNumber: args.billNumber
      },
      include: {
        customer: true,
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return { success: false, error: `Invoice with bill number "${args.billNumber}" not found.` };
    }

    const items = invoice.items.map((item: any) => ({
      itemId: item.id,
      productName: item.variant.product.name,
      variantName: item.variant.variantName,
      sku: item.variant.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal
    }));

    return {
      success: true,
      invoice: {
        invoiceId: invoice.id,
        billNumber: invoice.billNumber,
        orderDate: invoice.orderDate,
        status: invoice.status,
        paymentStatus: invoice.paymentStatus,
        customerName: invoice.customer?.name ?? 'Guest Customer',
        customerPhone: invoice.customer?.phone,
        customerEmail: invoice.customer?.email,
        totalAmount: invoice.totalAmount,
        items
      }
    };
  }
};
