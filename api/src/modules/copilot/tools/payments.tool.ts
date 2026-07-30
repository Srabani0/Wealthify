import { ToolDefinition } from '../types/copilot.types.js';
import { prisma } from '../../../config/prisma.js';

export const getPaymentsTool: ToolDefinition = {
  name: 'getPayments',
  description: 'List orders representing transaction payments received (status: COMPLETED or paymentStatus: PAID).',
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
      paymentStatus: 'PAID',
      status: { not: 'CANCELLED' }
    };

    if (args.from || args.to) {
      where.orderDate = {};
      if (args.from) where.orderDate.gte = new Date(args.from);
      if (args.to) where.orderDate.lte = new Date(args.to);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { customer: true },
      orderBy: { orderDate: 'desc' }
    });

    const items = orders.map((ord: any) => ({
      orderId: ord.id,
      billNumber: ord.billNumber,
      orderDate: ord.orderDate,
      customerName: ord.customer?.name ?? 'Guest Customer',
      amount: ord.totalAmount,
      channel: ord.channel,
      status: ord.status
    }));

    return { success: true, payments: items };
  }
};

export const getPaymentSummaryTool: ToolDefinition = {
  name: 'getPaymentSummary',
  description: 'Retrieve a financial summary of paid collections vs unpaid accounts receivables.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    if (userRole === 'STAFF') {
      return { success: false, error: 'Unauthorized: Staff roles do not have permission to view payment collections summaries.' };
    }

    const groupings = await prisma.order.groupBy({
      by: ['paymentStatus'],
      where: {
        businessId,
        status: { not: 'CANCELLED' }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    groupings.forEach((g: any) => {
      const amt = Number(g._sum.totalAmount ?? 0);
      if (g.paymentStatus === 'PAID') {
        totalPaid = amt;
        paidCount = g._count.id;
      } else {
        totalUnpaid = amt;
        unpaidCount = g._count.id;
      }
    });

    return {
      success: true,
      summary: {
        collectedAmount: Math.round(totalPaid * 100) / 100,
        outstandingAmount: Math.round(totalUnpaid * 100) / 100,
        totalReceivables: Math.round((totalPaid + totalUnpaid) * 100) / 100,
        paidCount,
        unpaidCount,
        collectionRatePercent: totalPaid + totalUnpaid > 0 
          ? Math.round((totalPaid / (totalPaid + totalUnpaid)) * 10000) / 100 
          : 100
      }
    };
  }
};
