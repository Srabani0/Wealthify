import { ToolDefinition } from '../types/copilot.types.js';
import { listLowStock } from '../../inventory/inventory.service.js';
import { prisma } from '../../../config/prisma.js';

export const getLowStockTool: ToolDefinition = {
  name: 'getLowStock',
  description: 'Retrieve items from inventory that are running low on stock (below or at their low stock threshold).',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const result = await listLowStock(businessId);
    return {
      success: true,
      items: result
    };
  }
};

export const getStockTool: ToolDefinition = {
  name: 'getStock',
  description: 'Retrieve current inventory stock levels for all products variants in the catalog.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: { businessId, isActive: true }
      },
      include: {
        inventory: true,
        product: { select: { name: true } }
      },
      orderBy: { variantName: 'asc' }
    });

    const items = variants.map((v: any) => ({
      variantId: v.id,
      productName: v.product.name,
      variantName: v.variantName,
      sku: v.sku,
      quantityOnHand: v.inventory?.quantityOnHand ?? 0,
      costPrice: v.costPrice,
      sellingPrice: v.sellingPrice
    }));

    return { success: true, items };
  }
};

export const getOutOfStockTool: ToolDefinition = {
  name: 'getOutOfStock',
  description: 'Retrieve all catalog variants that are completely out of stock (quantity is 0 or less).',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: { businessId, isActive: true },
        OR: [
          { inventory: null },
          { inventory: { quantityOnHand: { lte: 0 } } }
        ]
      },
      include: {
        inventory: true,
        product: { select: { name: true } }
      }
    });

    const items = variants.map((v: any) => ({
      variantId: v.id,
      productName: v.product.name,
      variantName: v.variantName,
      sku: v.sku,
      quantityOnHand: v.inventory?.quantityOnHand ?? 0
    }));

    return { success: true, items };
  }
};

export const getInventoryValueTool: ToolDefinition = {
  name: 'getInventoryValue',
  description: 'Calculate the total valuation of the active inventory based on cost prices of items currently on hand.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    if (userRole === 'STAFF') {
      return { success: false, error: 'Unauthorized: Staff roles do not have permission to view inventory financial valuation.' };
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: { businessId, isActive: true }
      },
      include: {
        inventory: true
      }
    });

    let totalCostValue = 0;
    let totalSellingValue = 0;
    let totalItemsCount = 0;

    variants.forEach((v: any) => {
      const q = v.inventory?.quantityOnHand ?? 0;
      totalCostValue += Number(v.costPrice) * q;
      totalSellingValue += Number(v.sellingPrice) * q;
      totalItemsCount += q;
    });

    return {
      success: true,
      totalCostValue: Math.round(totalCostValue * 100) / 100,
      totalSellingValue: Math.round(totalSellingValue * 100) / 100,
      totalItemsCount,
      potentialProfit: Math.round((totalSellingValue - totalCostValue) * 100) / 100
    };
  }
};

export const getProductAvailabilityTool: ToolDefinition = {
  name: 'getProductAvailability',
  description: 'Check stock availability and location/sku details for a specific product by its name or keyword.',
  parameters: {
    type: 'object',
    properties: {
      productName: { type: 'string', description: 'Name or part of the name of the product to search' }
    },
    required: ['productName']
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: {
          businessId,
          isActive: true,
          name: { contains: args.productName, mode: 'insensitive' }
        }
      },
      include: {
        inventory: true,
        product: { select: { name: true } }
      }
    });

    const items = variants.map((v: any) => ({
      variantId: v.id,
      productName: v.product.name,
      variantName: v.variantName,
      sku: v.sku,
      quantityOnHand: v.inventory?.quantityOnHand ?? 0,
      sellingPrice: v.sellingPrice
    }));

    return { success: true, items };
  }
};
