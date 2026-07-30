import { ToolDefinition } from '../types/copilot.types.js';
import { listSuppliers } from '../../suppliers/suppliers.service.js';
import { prisma } from '../../../config/prisma.js';

export const listSuppliersTool: ToolDefinition = {
  name: 'listSuppliers',
  description: 'List active suppliers registered in the business system.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const result = await listSuppliers(businessId);
    return {
      success: true,
      suppliers: result
    };
  }
};

export const getSupplierTool: ToolDefinition = {
  name: 'getSupplier',
  description: 'Retrieve details of a specific supplier by ID or name.',
  parameters: {
    type: 'object',
    properties: {
      supplierId: { type: 'string', description: 'Supplier ID' },
      name: { type: 'string', description: 'Supplier name' }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    let supplier = null;
    if (args.supplierId) {
      supplier = await prisma.supplier.findFirst({
        where: { businessId, id: args.supplierId }
      });
    } else if (args.name) {
      supplier = await prisma.supplier.findFirst({
        where: { businessId, name: { contains: args.name, mode: 'insensitive' } }
      });
    }
    return { success: true, supplier };
  }
};

export const getSupplierPurchasesTool: ToolDefinition = {
  name: 'getSupplierPurchases',
  description: 'List all raw material purchases made from a specific supplier.',
  parameters: {
    type: 'object',
    properties: {
      supplierId: { type: 'string', description: 'Supplier ID' }
    },
    required: ['supplierId']
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const purchases = await prisma.rawMaterialPurchase.findMany({
      where: { businessId, supplierId: args.supplierId },
      include: { rawMaterial: true },
      orderBy: { purchaseDate: 'desc' }
    });
    return { success: true, purchases };
  }
};

export const getTopSuppliersTool: ToolDefinition = {
  name: 'getTopSuppliers',
  description: 'Retrieve suppliers ordered by total order spending value on raw materials.',
  parameters: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Number of suppliers to return (default: 5)' }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    if (userRole === 'STAFF') {
      return { success: false, error: 'Unauthorized: Staff roles do not have permission to view supplier financial standing summaries.' };
    }

    const limit = args.limit || 5;

    const groupings = await prisma.rawMaterialPurchase.groupBy({
      by: ['supplierId'],
      where: {
        businessId,
        supplierId: { not: null }
      },
      _sum: {
        totalPrice: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: limit
    });

    const enriched = await Promise.all(
      groupings.map(async (g: any) => {
        const supplier = await prisma.supplier.findUnique({
          where: { id: g.supplierId! },
          select: { id: true, name: true, contactPerson: true, phone: true }
        });
        return {
          supplier,
          totalPrice: g._sum.totalPrice ?? 0,
          purchaseCount: g._count.id
        };
      })
    );

    return { success: true, topSuppliers: enriched };
  }
};
